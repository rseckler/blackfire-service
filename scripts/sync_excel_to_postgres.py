#!/usr/bin/env python3
"""
Excel to PostgreSQL Sync
Adapted from Blackfire_automation/sync_final.py

Syncs companies from Dropbox Excel to PostgreSQL/Supabase
"""

import os
import requests
import pandas as pd
from io import BytesIO
from dotenv import load_dotenv
from datetime import datetime
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

load_dotenv(os.path.join(os.path.dirname(__file__), '../.env.local'))

try:
    from supabase import create_client, Client
except ImportError:
    print("❌ supabase-py not installed. Installing...")
    os.system(f"{sys.executable} -m pip install supabase")
    from supabase import create_client, Client

# Column Mapping (Excel → PostgreSQL)
COLUMN_MAPPING = {
    'Company_Name': 'name',
    'Name': 'name'
}

# Protected Fields - NEVER overwrite these (managed by other scripts)
PROTECTED_FIELDS = {
    # Stock prices (managed by stock_price_updater.py)
    'Current_Price',
    'Currency',
    'Price_Change_Percent',
    'Price_Update',
    'Exchange',
    'Market_Status',
    'Day_High',
    'Day_Low',
    'Volume',
    'Market_Cap',
    # Identifiers (managed by other scripts)
    'ISIN',
    'WKN'
}

# Core PostgreSQL Fields (not in extra_data)
CORE_FIELDS = {'name', 'symbol', 'wkn', 'isin', 'satellog', 'current_price'}

class ExcelToPostgresSync:
    def __init__(self):
        self.dropbox_url = os.getenv('DROPBOX_URL')
        self.supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

        if not all([self.dropbox_url, self.supabase_url, self.supabase_key]):
            raise ValueError("Missing environment variables")

        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)

        # Stats
        self.stats = {
            'start_time': None,
            'end_time': None,
            'excel_rows': 0,
            'excel_columns': 0,
            'db_companies': 0,
            'updates': 0,
            'creates': 0,
            'skipped': 0,
            'errors': 0,
            'success': False,
            'error_message': None
        }

    def download_and_parse(self):
        """Download and parse Excel from Dropbox"""
        print("\n📥 Downloading Excel from Dropbox...")

        try:
            response = requests.get(self.dropbox_url, timeout=60)
            if response.status_code != 200:
                self.stats['error_message'] = f"Dropbox download failed: {response.status_code}"
                return None

            print(f"   ✅ Downloaded {len(response.content)} bytes")

            print("\n📊 Parsing Excel...")
            df = pd.read_excel(BytesIO(response.content))

            self.stats['excel_rows'] = len(df)
            self.stats['excel_columns'] = len(df.columns)

            print(f"   ✅ Parsed {len(df)} rows, {len(df.columns)} columns")
            print(f"   Columns: {', '.join(df.columns.tolist()[:10])}{'...' if len(df.columns) > 10 else ''}")

            return df

        except Exception as e:
            print(f"   ❌ Error: {e}")
            self.stats['error_message'] = str(e)
            return None

    def get_existing_companies(self):
        """Get all existing companies from PostgreSQL"""
        print("\n🐘 Getting existing companies from PostgreSQL...")

        try:
            # Fetch all companies
            response = self.supabase.table('companies').select('id, name, satellog, symbol, wkn, isin, extra_data').execute()

            companies = response.data
            self.stats['db_companies'] = len(companies)

            print(f"   ✅ Found {len(companies)} companies in database")

            # Build maps
            by_name = {}
            by_satellog = {}

            for company in companies:
                name = company.get('name', '').strip()
                satellog = company.get('satellog', '').strip()

                if name:
                    by_name[name] = company
                if satellog:
                    by_satellog[satellog] = company

            return {'by_name': by_name, 'by_satellog': by_satellog}

        except Exception as e:
            print(f"   ❌ Error: {e}")
            self.stats['error_message'] = str(e)
            return None

    def map_column_name(self, excel_col):
        """Map Excel column to PostgreSQL field"""
        return COLUMN_MAPPING.get(excel_col, excel_col)

    def build_company_data(self, excel_row, identifier):
        """Build company data for PostgreSQL"""

        # Start with core fields
        company_data = {
            'name': identifier,
            'satellog': f'excel_{identifier.lower().replace(" ", "_")}'
        }

        # Extra data for JSONB field
        extra_data = {}

        for excel_col, value in excel_row.items():
            # Skip NaN values
            if pd.isna(value) or value == '':
                continue

            # Map column name
            mapped_col = self.map_column_name(excel_col)

            # Skip protected fields
            if mapped_col in PROTECTED_FIELDS:
                continue

            # Handle core fields
            if mapped_col in CORE_FIELDS:
                if mapped_col == 'symbol':
                    company_data['symbol'] = str(value).strip() if value else None
                elif mapped_col == 'wkn':
                    company_data['wkn'] = str(value).strip() if value else None
                elif mapped_col == 'isin':
                    company_data['isin'] = str(value).strip() if value else None
            else:
                # Everything else goes to extra_data
                extra_data[excel_col] = value

        if extra_data:
            company_data['extra_data'] = extra_data

        return company_data

    def compare_and_sync(self, df, existing):
        """Compare Excel with PostgreSQL and sync"""
        print("\n🔍 Comparing Excel with PostgreSQL...")

        # Use first column as identifier (usually Company_Name or Name)
        identifier_col = df.columns[0]
        print(f"   Using '{identifier_col}' as identifier")

        to_update = []
        to_create = []

        for idx, row in df.iterrows():
            identifier = str(row[identifier_col]).strip()

            if not identifier or identifier == 'nan':
                self.stats['skipped'] += 1
                continue

            # Check if company exists
            existing_company = existing['by_name'].get(identifier) or existing['by_satellog'].get(f'excel_{identifier.lower().replace(" ", "_")}')

            company_data = self.build_company_data(row.to_dict(), identifier)

            if existing_company:
                # Update existing
                to_update.append({
                    'id': existing_company['id'],
                    'data': company_data,
                    'existing_extra_data': existing_company.get('extra_data', {})
                })
            else:
                # Create new
                to_create.append(company_data)

        self.stats['updates'] = len(to_update)
        self.stats['creates'] = len(to_create)

        print(f"   📊 To Update: {len(to_update)}")
        print(f"   📊 To Create: {len(to_create)}")
        print(f"   📊 Skipped: {self.stats['skipped']}")

        return {'updates': to_update, 'creates': to_create}

    def merge_extra_data(self, new_data, existing_data):
        """Merge new extra_data with existing, preserving protected fields"""
        merged = existing_data.copy()

        for key, value in new_data.items():
            # Don't overwrite protected fields
            if key not in PROTECTED_FIELDS:
                merged[key] = value

        return merged

    def update_companies(self, updates):
        """Update companies in PostgreSQL"""
        print("\n✏️  Updating companies...")

        success = 0
        failed = 0

        for update in updates:
            company_id = update['id']
            data = update['data']
            existing_extra = update.get('existing_extra_data', {})

            # Merge extra_data
            if 'extra_data' in data:
                data['extra_data'] = self.merge_extra_data(data['extra_data'], existing_extra)

            try:
                self.supabase.table('companies').update(data).eq('id', company_id).execute()
                success += 1

                if success % 100 == 0:
                    print(f"   ✅ Updated {success}/{len(updates)} companies...")

            except Exception as e:
                failed += 1
                if failed <= 5:  # Only print first 5 errors
                    print(f"   ❌ Error updating {data.get('name')}: {e}")

        print(f"   ✅ Updated {success} companies")
        if failed > 0:
            print(f"   ❌ Failed: {failed}")

        return success

    def create_companies(self, creates):
        """Create new companies in PostgreSQL"""
        print("\n➕ Creating new companies...")

        if not creates:
            print("   No companies to create")
            return 0

        try:
            # Batch insert
            self.supabase.table('companies').insert(creates).execute()
            print(f"   ✅ Created {len(creates)} companies")
            return len(creates)

        except Exception as e:
            print(f"   ❌ Error creating companies: {e}")
            self.stats['errors'] += len(creates)
            return 0

    def run(self):
        """Run the sync"""
        self.stats['start_time'] = datetime.now()
        print("=" * 60)
        print("🔄 EXCEL → POSTGRESQL SYNC")
        print("=" * 60)
        print(f"Started at: {self.stats['start_time'].strftime('%Y-%m-%d %H:%M:%S')}")

        try:
            # 1. Download and parse Excel
            df = self.download_and_parse()
            if df is None:
                raise Exception("Failed to download/parse Excel")

            # 2. Get existing companies
            existing = self.get_existing_companies()
            if existing is None:
                raise Exception("Failed to get existing companies")

            # 3. Compare and prepare sync
            sync_data = self.compare_and_sync(df, existing)

            # 4. Update existing companies
            if sync_data['updates']:
                updated = self.update_companies(sync_data['updates'])
                self.stats['updates'] = updated

            # 5. Create new companies
            if sync_data['creates']:
                created = self.create_companies(sync_data['creates'])
                self.stats['creates'] = created

            self.stats['success'] = True
            print("\n" + "=" * 60)
            print("✅ SYNC COMPLETED SUCCESSFULLY")

        except Exception as e:
            print(f"\n❌ SYNC FAILED: {e}")
            self.stats['success'] = False
            self.stats['error_message'] = str(e)

        finally:
            self.stats['end_time'] = datetime.now()
            duration = (self.stats['end_time'] - self.stats['start_time']).total_seconds()

            print("=" * 60)
            print("📊 SYNC STATISTICS")
            print("=" * 60)
            print(f"Duration: {duration:.1f}s")
            print(f"Excel Rows: {self.stats['excel_rows']}")
            print(f"Excel Columns: {self.stats['excel_columns']}")
            print(f"DB Companies (before): {self.stats['db_companies']}")
            print(f"Updates: {self.stats['updates']}")
            print(f"Creates: {self.stats['creates']}")
            print(f"Skipped: {self.stats['skipped']}")
            print(f"Errors: {self.stats['errors']}")
            print(f"Status: {'✅ SUCCESS' if self.stats['success'] else '❌ FAILED'}")
            if self.stats['error_message']:
                print(f"Error: {self.stats['error_message']}")
            print("=" * 60)

            return self.stats['success']

if __name__ == '__main__':
    sync = ExcelToPostgresSync()
    success = sync.run()
    sys.exit(0 if success else 1)
