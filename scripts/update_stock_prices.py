#!/usr/bin/env python3
"""
Stock Price Updater for PostgreSQL
Uses Alpha Vantage API (free tier: 5 calls/min, 500 calls/day)

Simplified version - updates companies with ticker symbols
"""

import os
import requests
from dotenv import load_dotenv
from datetime import datetime
import time
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

load_dotenv(os.path.join(os.path.dirname(__file__), '../.env.production'))
load_dotenv(os.path.join(os.path.dirname(__file__), '../.env.local'))

try:
    from supabase import create_client, Client
except ImportError:
    print("❌ supabase-py not installed. Installing...")
    os.system(f"{sys.executable} -m pip install supabase")
    from supabase import create_client, Client

class StockPriceUpdater:
    def __init__(self, limit=100):
        self.supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        self.alpha_vantage_key = os.getenv('ALPHA_VANTAGE_API_KEY')

        if not all([self.supabase_url, self.supabase_key, self.alpha_vantage_key]):
            raise ValueError("Missing environment variables")

        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
        self.limit = limit  # Limit number of companies to update (free tier limit)

        # Stats
        self.stats = {
            'start_time': None,
            'end_time': None,
            'companies_found': 0,
            'companies_processed': 0,
            'companies_updated': 0,
            'companies_skipped': 0,
            'companies_failed': 0,
            'api_calls': 0,
            'success': False,
            'error_message': None
        }

    def get_companies_with_tickers(self):
        """Get companies that have ticker symbols in extra_data"""
        print("\n📊 Getting companies with ticker symbols...")

        try:
            # Get companies with Ticker in extra_data
            response = self.supabase.table('companies')\
                .select('id, name, symbol, extra_data')\
                .neq('extra_data->>Ticker', 'null')\
                .limit(self.limit)\
                .execute()

            companies = response.data
            self.stats['companies_found'] = len(companies)

            # Filter for companies that actually have a non-empty ticker
            companies_with_tickers = []
            for company in companies:
                ticker = company.get('extra_data', {}).get('Ticker')
                if ticker and str(ticker).strip() and ticker != '-':
                    companies_with_tickers.append(company)

            print(f"   ✅ Found {len(companies_with_tickers)} companies with valid tickers (out of {len(companies)} total)")

            return companies_with_tickers

        except Exception as e:
            print(f"   ❌ Error: {e}")
            self.stats['error_message'] = str(e)
            return []

    def normalize_ticker(self, ticker):
        """Normalize ticker symbol for Alpha Vantage"""
        if not ticker:
            return None

        ticker = str(ticker).strip().upper()

        # Remove common suffixes for international markets (Alpha Vantage uses US symbols)
        if ticker.endswith('.DE'):
            ticker = ticker[:-3]
        elif ticker.endswith('.F'):
            ticker = ticker[:-2]

        # Skip if too long or contains spaces
        if len(ticker) > 10 or ' ' in ticker:
            return None

        return ticker

    def fetch_stock_price(self, ticker):
        """Fetch stock price from Alpha Vantage API"""
        ticker = self.normalize_ticker(ticker)
        if not ticker:
            return None

        try:
            url = f"https://www.alphavantage.co/query"
            params = {
                'function': 'GLOBAL_QUOTE',
                'symbol': ticker,
                'apikey': self.alpha_vantage_key
            }

            response = requests.get(url, params=params, timeout=10)
            self.stats['api_calls'] += 1

            if response.status_code != 200:
                return None

            data = response.json()

            # Check for rate limit message
            if 'Note' in data:
                print(f"   ⚠️  Rate limit reached: {data['Note']}")
                return 'RATE_LIMIT'

            # Check for error message
            if 'Error Message' in data:
                return None

            quote = data.get('Global Quote', {})

            if not quote:
                return None

            # Extract price data
            price_data = {
                'Current_Price': float(quote.get('05. price', 0)),
                'Day_High': float(quote.get('03. high', 0)),
                'Day_Low': float(quote.get('04. low', 0)),
                'Volume': int(float(quote.get('06. volume', 0))),
                'Price_Change_Percent': float(quote.get('10. change percent', '0%').rstrip('%')),
                'Price_Update': datetime.now().isoformat(),
                'Currency': 'USD',  # Alpha Vantage returns USD prices
                'Market_Status': '🟢 Open' if quote.get('05. price') else '🔴 Closed'
            }

            return price_data

        except Exception as e:
            print(f"   ❌ Error fetching {ticker}: {e}")
            return None

    def update_company_price(self, company_id, price_data, existing_extra_data):
        """Update company price in PostgreSQL"""
        try:
            # Merge price_data into existing extra_data
            updated_extra_data = existing_extra_data.copy()
            updated_extra_data.update(price_data)

            # Also update current_price column
            update_data = {
                'extra_data': updated_extra_data,
                'current_price': price_data.get('Current_Price')
            }

            self.supabase.table('companies')\
                .update(update_data)\
                .eq('id', company_id)\
                .execute()

            return True

        except Exception as e:
            print(f"   ❌ Error updating company: {e}")
            return False

    def run(self):
        """Run the price update"""
        self.stats['start_time'] = datetime.now()
        print("=" * 60)
        print("💰 STOCK PRICE UPDATER")
        print("=" * 60)
        print(f"Started at: {self.stats['start_time'].strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Update limit: {self.limit} companies")
        print(f"API: Alpha Vantage (Free tier: 5 calls/min, 500/day)")

        try:
            # 1. Get companies with tickers
            companies = self.get_companies_with_tickers()

            if not companies:
                print("\n⚠️  No companies with tickers found")
                self.stats['success'] = True
                return True

            print(f"\n🔄 Processing {len(companies)} companies...")
            print("   (Rate limited to 5 calls/minute)\n")

            # 2. Update prices
            for i, company in enumerate(companies):
                self.stats['companies_processed'] += 1

                company_name = company.get('name', 'Unknown')
                ticker = company.get('extra_data', {}).get('Ticker')

                print(f"   [{i+1}/{len(companies)}] {company_name} ({ticker})... ", end='', flush=True)

                # Fetch price
                price_data = self.fetch_stock_price(ticker)

                if price_data == 'RATE_LIMIT':
                    print("⚠️  RATE LIMIT - Stopping")
                    break

                if price_data:
                    # Update in database
                    success = self.update_company_price(
                        company['id'],
                        price_data,
                        company.get('extra_data', {})
                    )

                    if success:
                        print(f"✅ ${price_data.get('Current_Price', 0):.2f}")
                        self.stats['companies_updated'] += 1
                    else:
                        print("❌ Failed to update")
                        self.stats['companies_failed'] += 1
                else:
                    print("⏭️  Skipped (no data)")
                    self.stats['companies_skipped'] += 1

                # Rate limiting: 5 calls per minute = 12 seconds between calls
                if self.stats['api_calls'] % 5 == 0 and i < len(companies) - 1:
                    print("   ⏳ Waiting 60s for rate limit...")
                    time.sleep(60)

            self.stats['success'] = True
            print("\n" + "=" * 60)
            print("✅ PRICE UPDATE COMPLETED")

        except Exception as e:
            print(f"\n❌ PRICE UPDATE FAILED: {e}")
            self.stats['success'] = False
            self.stats['error_message'] = str(e)

        finally:
            self.stats['end_time'] = datetime.now()
            duration = (self.stats['end_time'] - self.stats['start_time']).total_seconds()

            print("=" * 60)
            print("📊 UPDATE STATISTICS")
            print("=" * 60)
            print(f"Duration: {duration:.1f}s")
            print(f"Companies Found: {self.stats['companies_found']}")
            print(f"Companies Processed: {self.stats['companies_processed']}")
            print(f"Companies Updated: {self.stats['companies_updated']}")
            print(f"Companies Skipped: {self.stats['companies_skipped']}")
            print(f"Companies Failed: {self.stats['companies_failed']}")
            print(f"API Calls: {self.stats['api_calls']}")
            print(f"Status: {'✅ SUCCESS' if self.stats['success'] else '❌ FAILED'}")
            if self.stats['error_message']:
                print(f"Error: {self.stats['error_message']}")
            print("=" * 60)

            return self.stats['success']

if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='Update stock prices from Alpha Vantage')
    parser.add_argument('--limit', type=int, default=100, help='Maximum number of companies to update (default: 100)')
    args = parser.parse_args()

    updater = StockPriceUpdater(limit=args.limit)
    success = updater.run()
    sys.exit(0 if success else 1)
