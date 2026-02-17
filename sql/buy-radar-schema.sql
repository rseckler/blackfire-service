-- Buy Radar Analyses Table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard → SQL Editor

-- 1. Create the table
CREATE TABLE IF NOT EXISTS buy_radar_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  recommendation TEXT NOT NULL CHECK (recommendation IN ('buy', 'wait', 'avoid')),
  confidence INTEGER NOT NULL CHECK (confidence BETWEEN 1 AND 10),
  reasoning TEXT NOT NULL,
  summary TEXT NOT NULL,
  current_price NUMERIC,
  target_price NUMERIC,
  price_gap_percent NUMERIC,
  catalysts TEXT[] DEFAULT '{}',
  risks TEXT[] DEFAULT '{}',
  web_research_summary TEXT,
  data_sources JSONB DEFAULT '{}',
  model_used TEXT NOT NULL DEFAULT 'claude-sonnet-4-5-20250929',
  analysis_duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Index for fast lookups
CREATE INDEX idx_buy_radar_company_id ON buy_radar_analyses(company_id);
CREATE INDEX idx_buy_radar_created_at ON buy_radar_analyses(created_at DESC);
CREATE INDEX idx_buy_radar_recommendation ON buy_radar_analyses(recommendation);

-- 3. RLS Policies (allow public read, no write from client)
ALTER TABLE buy_radar_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read buy radar analyses"
  ON buy_radar_analyses FOR SELECT
  USING (true);

-- Only service role can insert (via API routes)
-- No INSERT/UPDATE/DELETE policies for anon = blocked by default

-- 4. RPC Function: Get buy radar companies with latest analysis
CREATE OR REPLACE FUNCTION get_buy_radar_companies()
RETURNS TABLE (
  company_id UUID,
  company_name TEXT,
  symbol TEXT,
  extra_data JSONB,
  latest_analysis_id UUID,
  recommendation TEXT,
  confidence INTEGER,
  reasoning TEXT,
  summary TEXT,
  current_price NUMERIC,
  target_price NUMERIC,
  price_gap_percent NUMERIC,
  catalysts TEXT[],
  risks TEXT[],
  web_research_summary TEXT,
  data_sources JSONB,
  model_used TEXT,
  analysis_duration_ms INTEGER,
  analyzed_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
AS $$
  WITH filtered_companies AS (
    SELECT c.id, c.name, c.symbol, c.extra_data
    FROM companies c
    WHERE
      c.extra_data->>'Thier_Group' IN ('2026', '2026*', '2026**', '2026***')
      OR c.extra_data->>'VIP' = 'Defcon 1'
  ),
  latest_analyses AS (
    SELECT DISTINCT ON (bra.company_id)
      bra.*
    FROM buy_radar_analyses bra
    WHERE bra.company_id IN (SELECT id FROM filtered_companies)
    ORDER BY bra.company_id, bra.created_at DESC
  )
  SELECT
    fc.id AS company_id,
    fc.name AS company_name,
    fc.symbol,
    fc.extra_data,
    la.id AS latest_analysis_id,
    la.recommendation,
    la.confidence,
    la.reasoning,
    la.summary,
    la.current_price,
    la.target_price,
    la.price_gap_percent,
    la.catalysts,
    la.risks,
    la.web_research_summary,
    la.data_sources,
    la.model_used,
    la.analysis_duration_ms,
    la.created_at AS analyzed_at
  FROM filtered_companies fc
  LEFT JOIN latest_analyses la ON fc.id = la.company_id
  ORDER BY
    CASE la.recommendation
      WHEN 'buy' THEN 1
      WHEN 'wait' THEN 2
      WHEN 'avoid' THEN 3
      ELSE 4
    END,
    la.confidence DESC NULLS LAST,
    fc.name ASC;
$$;
