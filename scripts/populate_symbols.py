#!/usr/bin/env python3
"""
Symbol Population Service
Automatically populates the 'symbol' field from existing data in extra_data, WKN, ISIN, etc.

Priority order:
1. Company Symbol (from extra_data)
2. Ticker (from extra_data)
3. Symbol (from extra_data)
4. Stock_Symbol (from extra_data)
5. WKN (from companies.wkn)
6. ISIN (from companies.isin)

Runs multiple times daily via cron
"""

import os
import sys
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '../.env.local'))
load_dotenv(os.path.join(os.path.dirname(__file__), '../.env.production'))

try:
    from supabase import create_client, Client
except ImportError:
    print("❌ supabase-py not installed. Installing...")
    os.system(f"{sys.executable} -m pip install supabase")
    from supabase import create_client, Client

class SymbolPopulationService:
    def __init__(self):
        self.supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

        if not all([self.supabase_url, self.supabase_key]):
            raise ValueError("Missing environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")

        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)

        # Statistics
        self.stats = {
            'start_time': datetime.now(),
            'total_companies': 0,
            'missing_symbols': 0,
            'symbols_populated': 0,
            'skipped': 0,
            'errors': 0
        }

    def extract_symbol_from_extra_data(self, extra_data):
        """
        Extract symbol from extra_data JSONB with priority order

        Priority:
        1. Company Symbol
        2. Ticker
        3. Symbol
        4. Stock_Symbol
        5. Any field containing 'symbol' or 'ticker' (case insensitive)
        """
        if not extra_data or not isinstance(extra_data, dict):
            return None

        # Priority fields
        priority_fields = [
            'Company Symbol',
            'Company_Symbol',
            'Ticker',
            'Symbol',
            'Stock_Symbol',
            'Stock Symbol',
            'TICKER',
            'SYMBOL'
        ]

        # Check priority fields first
        for field in priority_fields:
            if field in extra_data and extra_data[field]:
                value = str(extra_data[field]).strip()
                if value and value.upper() not in ['NAN', 'NONE', 'NULL', '']:
                    return self.clean_symbol(value)

        # Check any field containing 'symbol' or 'ticker'
        for key, value in extra_data.items():
            key_lower = key.lower()
            if ('symbol' in key_lower or 'ticker' in key_lower) and value:
                cleaned = self.clean_symbol(str(value))
                if cleaned:
                    return cleaned

        return None

    def clean_symbol(self, symbol):
        """Clean and validate symbol"""
        if not symbol:
            return None

        # Remove common prefixes/suffixes
        symbol = symbol.strip().upper()

        # Remove exchange suffixes (e.g., ".US", ".DE", ":US")
        symbol = symbol.split('.')[0].split(':')[0]

        # Must be between 1-10 characters and alphanumeric (with optional hyphen)
        if 1 <= len(symbol) <= 10 and symbol.replace('-', '').isalnum():
            return symbol

        return None

    def get_symbol_candidate(self, company):
        """
        Get the best symbol candidate for a company

        Returns: (symbol, source) tuple
        """
        company_id = company.get('id')
        name = company.get('name', 'Unknown')
        wkn = company.get('wkn')
        isin = company.get('isin')
        extra_data = company.get('extra_data', {})

        # 1. Try extra_data first
        symbol = self.extract_symbol_from_extra_data(extra_data)
        if symbol:
            return (symbol, 'extra_data')

        # 2. Try WKN if available (for German stocks)
        if wkn:
            cleaned_wkn = self.clean_symbol(wkn)
            if cleaned_wkn:
                return (cleaned_wkn, 'wkn')

        # 3. Try ISIN if available (extract last part)
        if isin and len(isin) >= 12:
            # ISIN format: US0378331005 (Country + Security identifier + Check digit)
            # Not reliable as stock symbol, skip
            pass

        return (None, None)

    def populate_symbols(self, dry_run=False, limit=None):
        """
        Populate symbols for companies missing them

        Args:
            dry_run: If True, only print what would be done
            limit: Maximum number of companies to process
        """
        print("=" * 70)
        print("🔄 SYMBOL POPULATION SERVICE")
        print("=" * 70)
        print(f"Started at: {self.stats['start_time'].strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Mode: {'DRY RUN' if dry_run else 'LIVE'}")
        if limit:
            print(f"Limit: {limit} companies")
        print()

        try:
            # Get companies without symbols
            print("📊 Fetching companies without symbols...")

            query = self.supabase.table('companies').select(
                'id, name, symbol, wkn, isin, extra_data'
            ).is_('symbol', None)

            if limit:
                query = query.limit(limit)

            response = query.execute()
            companies = response.data

            self.stats['total_companies'] = len(companies)
            self.stats['missing_symbols'] = len(companies)

            print(f"   ✅ Found {len(companies)} companies without symbols")
            print()

            if len(companies) == 0:
                print("✅ All companies already have symbols!")
                return

            # Process each company
            print("🔍 Processing companies...")
            print()

            for idx, company in enumerate(companies, 1):
                company_id = company.get('id')
                name = company.get('name', 'Unknown')

                # Get symbol candidate
                symbol, source = self.get_symbol_candidate(company)

                if symbol:
                    if dry_run:
                        print(f"   [{idx}/{len(companies)}] Would set '{name}' → {symbol} (from {source})")
                        self.stats['symbols_populated'] += 1
                    else:
                        try:
                            # Update database
                            self.supabase.table('companies').update({
                                'symbol': symbol
                            }).eq('id', company_id).execute()

                            print(f"   ✅ [{idx}/{len(companies)}] {name} → {symbol} (from {source})")
                            self.stats['symbols_populated'] += 1

                        except Exception as e:
                            print(f"   ❌ [{idx}/{len(companies)}] Error updating {name}: {e}")
                            self.stats['errors'] += 1
                else:
                    print(f"   ⏭️  [{idx}/{len(companies)}] Skipped '{name}' (no symbol found)")
                    self.stats['skipped'] += 1

            print()
            print("=" * 70)
            print("✅ SYMBOL POPULATION COMPLETED")

        except Exception as e:
            print()
            print("=" * 70)
            print(f"❌ ERROR: {e}")
            import traceback
            traceback.print_exc()

        finally:
            self.print_stats()

    def print_stats(self):
        """Print statistics"""
        self.stats['end_time'] = datetime.now()
        duration = (self.stats['end_time'] - self.stats['start_time']).total_seconds()

        print("=" * 70)
        print("📊 STATISTICS")
        print("=" * 70)
        print(f"Duration: {duration:.1f}s")
        print(f"Total Companies Checked: {self.stats['total_companies']}")
        print(f"Missing Symbols: {self.stats['missing_symbols']}")
        print(f"Symbols Populated: {self.stats['symbols_populated']}")
        print(f"Symbols Skipped: {self.stats['skipped']}")
        print(f"Errors: {self.stats['errors']}")

        if self.stats['symbols_populated'] > 0:
            success_rate = (self.stats['symbols_populated'] / self.stats['missing_symbols']) * 100
            print(f"Success Rate: {success_rate:.1f}%")

        print("=" * 70)

def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(description='Populate symbol field from existing data')
    parser.add_argument('--dry-run', action='store_true', help='Dry run - do not update database')
    parser.add_argument('--limit', type=int, help='Maximum number of companies to process')

    args = parser.parse_args()

    service = SymbolPopulationService()
    service.populate_symbols(dry_run=args.dry_run, limit=args.limit)

if __name__ == '__main__':
    main()
