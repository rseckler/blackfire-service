# Import Scripts

## Import Companies from Notion

This script imports all companies (1600+) from your Notion database into PostgreSQL.

### Prerequisites

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables** in `.env.local`:
   ```bash
   # From Blackfire_automation project
   NOTION_API_KEY=ntn_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   NOTION_DATABASE_ID=2f3708a3-de95-807b-88c4-ca0463fd07fb

   # From Vercel environment variables
   NEXT_PUBLIC_SUPABASE_URL=https://lglvuiuwbrhiqvxcriwa.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
   ```

3. **Run database migration:**
   ```bash
   # This adds the necessary columns to the companies table
   # You can run this migration in Supabase Dashboard → SQL Editor
   # Or it will be applied automatically on next deployment
   ```

### Usage

```bash
npm run import:notion
```

### What it does

1. ✅ Connects to your Notion database
2. ✅ Fetches all companies (paginated, handles 1600+)
3. ✅ Maps Notion properties to PostgreSQL schema:
   - Basic: name, satellog, symbol, ISIN, WKN
   - Prices: current_price, currency, exchange, market_status
   - Metadata: day_high, day_low, volume, market_cap
   - Extra: 80+ additional fields stored in JSONB
4. ✅ Inserts/updates companies in batches (100 at a time)
5. ✅ Shows progress and summary

### Expected Output

```
🚀 Starting Notion → PostgreSQL Import

Configuration:
   Notion Database: 2f3708a3-de95-807b-88c4-ca0463fd07fb
   Supabase URL: https://lglvuiuwbrhiqvxcriwa.supabase.co
   Batch Size: 100

📥 Fetching companies from Notion...
   Fetched page 1: 100 companies total
   Fetched page 2: 200 companies total
   ...
   Fetched page 17: 1602 companies total
✅ Fetched 1602 companies from Notion

🔄 Mapping Notion data to PostgreSQL schema...
✅ Mapped 1602 companies

📋 Sample company data:
   Name: KYNDRYL HOLDINGS
   Satellog: 0001916150
   Symbol: KD
   ISIN: US50155Q1004
   Current Price: 23.83 USD
   Extra Fields: 85

📤 Inserting 1602 companies into PostgreSQL...

   Processing batch 1/17 (100 companies)...
   ✅ Batch 1 inserted successfully
   Processing batch 2/17 (100 companies)...
   ✅ Batch 2 inserted successfully
   ...
   Processing batch 17/17 (2 companies)...
   ✅ Batch 17 inserted successfully

📊 Import Summary:
   ✅ Inserted/Updated: 1602
   ⏩ Skipped: 0
   ❌ Errors: 0
   📈 Total: 1602

✅ Import completed in 127s
```

### Duration

- **Expected:** 2-3 minutes (depends on Notion API rate limits)
- **Network:** ~50 MB download from Notion

### After Import

Once imported, you can:

1. **View companies** in Supabase Dashboard:
   ```
   Dashboard → Table Editor → companies
   ```

2. **Query companies** in your app:
   ```typescript
   const { data } = await supabase
     .from('companies')
     .select('*')
     .order('name')
   ```

3. **Build Stock List page** with real data

4. **Set up sync** to keep data updated (see next steps)

### Troubleshooting

**Error: `NOTION_API_KEY not found`**
- Solution: Add to `.env.local` from Blackfire_automation project

**Error: `relation "companies" does not exist`**
- Solution: Run database migration first (see Prerequisites)

**Error: `API token is invalid`**
- Solution: Check Notion API key, ensure integration has access to database

**Error: `Batch insert failed`**
- Solution: Check Supabase service role key, verify database connection

### Re-running the Import

The script uses `upsert` with `satellog` as unique key, so you can:
- ✅ Run multiple times safely
- ✅ Updates existing companies
- ✅ Adds new companies
- ✅ Doesn't create duplicates

### Next Steps

After successful import:

1. **Set up automatic sync** (daily updates from Dropbox)
2. **Adapt stock_price_updater.py** to update PostgreSQL
3. **Build Stock List page** to display companies
4. **Add search and filters**

---

## Other Scripts (Coming Soon)

- `sync-from-dropbox.ts` - Daily sync from Excel
- `update-stock-prices.ts` - Hourly price updates
- `cleanup-old-prices.ts` - Archive old price data
