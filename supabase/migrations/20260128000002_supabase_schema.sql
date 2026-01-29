-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- COMPANIES
-- ============================================================================

CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  symbol TEXT UNIQUE,
  wkn TEXT,
  isin TEXT,
  sector TEXT,
  industry TEXT,
  market_cap BIGINT,
  description TEXT,
  website TEXT,
  logo_url TEXT,
  country TEXT,
  exchange TEXT,
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_companies_symbol ON companies(symbol);
CREATE INDEX idx_companies_sector ON companies(sector);
CREATE INDEX idx_companies_name ON companies USING gin(to_tsvector('english', name));

-- ============================================================================
-- STOCK PRICES (Time-Series) - Supabase compatible (no TimescaleDB)
-- ============================================================================

CREATE TABLE stock_prices (
  id UUID DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL,
  open DECIMAL(20, 4),
  high DECIMAL(20, 4),
  low DECIMAL(20, 4),
  close DECIMAL(20, 4) NOT NULL,
  volume BIGINT,
  adjusted_close DECIMAL(20, 4),
  PRIMARY KEY (company_id, timestamp)
);

-- Create index for efficient queries (no TimescaleDB)
CREATE INDEX idx_stock_prices_company_time ON stock_prices (company_id, timestamp DESC);
CREATE INDEX idx_stock_prices_timestamp ON stock_prices (timestamp DESC);

-- ============================================================================
-- PORTFOLIOS
-- ============================================================================

CREATE TABLE portfolios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_portfolios_user ON portfolios(user_id);

-- ============================================================================
-- HOLDINGS
-- ============================================================================

CREATE TABLE holdings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  quantity DECIMAL(20, 8) NOT NULL,
  average_purchase_price DECIMAL(20, 4) NOT NULL,
  purchase_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(portfolio_id, company_id)
);

CREATE INDEX idx_holdings_portfolio ON holdings(portfolio_id);
CREATE INDEX idx_holdings_company ON holdings(company_id);

-- ============================================================================
-- TRANSACTIONS
-- ============================================================================

CREATE TYPE transaction_type AS ENUM ('buy', 'sell', 'dividend');

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  quantity DECIMAL(20, 8) NOT NULL,
  price DECIMAL(20, 4) NOT NULL,
  total DECIMAL(20, 4) NOT NULL,
  fees DECIMAL(20, 4) DEFAULT 0,
  transaction_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_portfolio ON transactions(portfolio_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date DESC);

-- ============================================================================
-- WATCHLISTS
-- ============================================================================

CREATE TABLE watchlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_watchlists_user ON watchlists(user_id);

CREATE TABLE watchlist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  watchlist_id UUID NOT NULL REFERENCES watchlists(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  notes TEXT,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(watchlist_id, company_id)
);

CREATE INDEX idx_watchlist_items_watchlist ON watchlist_items(watchlist_id);

-- ============================================================================
-- NOTES
-- ============================================================================

CREATE TYPE note_entity_type AS ENUM ('company', 'sector', 'basket', 'general');

CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type note_entity_type NOT NULL,
  entity_id UUID, -- References companies.id for company notes
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  notion_page_id TEXT, -- Optional reference to Notion page
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notes_user ON notes(user_id);
CREATE INDEX idx_notes_entity ON notes(entity_type, entity_id);
CREATE INDEX idx_notes_tags ON notes USING gin(tags);
CREATE INDEX idx_notes_content ON notes USING gin(to_tsvector('english', content));

-- ============================================================================
-- INFORMATION SOURCES
-- ============================================================================

CREATE TYPE source_type AS ENUM (
  'website', 'blog', 'newsletter', 'youtube', 'podcast',
  'twitter', 'reddit', 'linkedin', 'forum', 'rss', 'other'
);

CREATE TABLE information_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type source_type NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  check_frequency_hours INTEGER DEFAULT 24,
  last_checked_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  reliability_score INTEGER CHECK (reliability_score >= 1 AND reliability_score <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sources_type ON information_sources(type);
CREATE INDEX idx_sources_active ON information_sources(is_active) WHERE is_active = true;

-- Link sources to companies
CREATE TABLE company_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES information_sources(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, source_id)
);

CREATE INDEX idx_company_sources_company ON company_sources(company_id);

-- ============================================================================
-- SOURCE CONTENT (Archive)
-- ============================================================================

CREATE TABLE source_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id UUID NOT NULL REFERENCES information_sources(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT,
  url TEXT,
  published_at TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sentiment_score DECIMAL(3, 2), -- -1.00 to 1.00
  relevance_score DECIMAL(3, 2), -- 0.00 to 1.00
  mentions UUID[] -- Array of company IDs mentioned
);

CREATE INDEX idx_source_content_source ON source_content(source_id);
CREATE INDEX idx_source_content_published ON source_content(published_at DESC);
CREATE INDEX idx_source_content_mentions ON source_content USING gin(mentions);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Portfolios policies
CREATE POLICY "Users can view own portfolios"
  ON portfolios FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own portfolios"
  ON portfolios FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolios"
  ON portfolios FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own portfolios"
  ON portfolios FOR DELETE
  USING (auth.uid() = user_id);

-- Holdings policies
CREATE POLICY "Users can view own holdings"
  ON holdings FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM portfolios
    WHERE portfolios.id = holdings.portfolio_id
    AND portfolios.user_id = auth.uid()
  ));

CREATE POLICY "Users can create own holdings"
  ON holdings FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM portfolios
    WHERE portfolios.id = holdings.portfolio_id
    AND portfolios.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own holdings"
  ON holdings FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM portfolios
    WHERE portfolios.id = holdings.portfolio_id
    AND portfolios.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own holdings"
  ON holdings FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM portfolios
    WHERE portfolios.id = holdings.portfolio_id
    AND portfolios.user_id = auth.uid()
  ));

-- Transactions policies
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM portfolios
    WHERE portfolios.id = transactions.portfolio_id
    AND portfolios.user_id = auth.uid()
  ));

CREATE POLICY "Users can create own transactions"
  ON transactions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM portfolios
    WHERE portfolios.id = transactions.portfolio_id
    AND portfolios.user_id = auth.uid()
  ));

-- Watchlists policies
CREATE POLICY "Users can manage own watchlists"
  ON watchlists FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own watchlist items"
  ON watchlist_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM watchlists
    WHERE watchlists.id = watchlist_items.watchlist_id
    AND watchlists.user_id = auth.uid()
  ));

-- Notes policies
CREATE POLICY "Users can manage own notes"
  ON notes FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON portfolios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_holdings_updated_at BEFORE UPDATE ON holdings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_watchlists_updated_at BEFORE UPDATE ON watchlists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_information_sources_updated_at BEFORE UPDATE ON information_sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
