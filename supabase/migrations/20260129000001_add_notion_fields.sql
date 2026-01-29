-- Add Notion-specific fields to companies table

-- Add satellog (unique identifier from Notion/Excel)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS satellog TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_companies_satellog ON companies(satellog);

-- Add current price data (from stock_price_updater)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS current_price DECIMAL(20, 4);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS price_change_percent DECIMAL(10, 4);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS price_update TIMESTAMPTZ;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS market_status TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS day_high DECIMAL(20, 4);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS day_low DECIMAL(20, 4);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS volume BIGINT;

-- Add additional metadata
ALTER TABLE companies ADD COLUMN IF NOT EXISTS notion_page_id TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

-- Add Excel/Notion extra fields (flexible JSONB for 80+ fields)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS extra_data JSONB DEFAULT '{}';

-- Create index for faster JSONB queries
CREATE INDEX IF NOT EXISTS idx_companies_extra_data ON companies USING gin(extra_data);

-- Add comment for documentation
COMMENT ON COLUMN companies.satellog IS 'Unique identifier from Excel/Notion (Primary Key for sync)';
COMMENT ON COLUMN companies.extra_data IS 'Additional fields from Excel (80+ columns stored as JSONB)';
