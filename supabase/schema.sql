-- ============================================================
-- 1-800-CLOSER Database Schema
-- ============================================================
-- Run this in your Supabase SQL Editor:
--   Dashboard → SQL Editor → New query → Paste this → Run
-- ============================================================

-- Sessions table: one row per completed call
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  rep_id TEXT NOT NULL,
  rep_name TEXT NOT NULL,
  lead_first_name TEXT,
  lead_last_name TEXT,
  business_name TEXT,
  lead_source TEXT,
  entity_type TEXT,
  industry TEXT,
  state TEXT,
  revenue_range TEXT,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  over_time BOOLEAN DEFAULT FALSE,
  total_slides INTEGER,
  slides_presented INTEGER,
  slides_skipped JSONB DEFAULT '[]',
  slide_times JSONB DEFAULT '[]',
  discovery_answers JSONB DEFAULT '{}',
  tax_calc_inputs JSONB DEFAULT '{}',
  computed_savings INTEGER DEFAULT 0,
  price_quoted TEXT,
  payment_type TEXT,
  card_type TEXT,
  objections_handled JSONB DEFAULT '[]',
  script_adherence_score INTEGER,
  call_notes TEXT,
  outcome TEXT DEFAULT 'pending',
  deck_type TEXT,
  ai_coach_tips_count INTEGER DEFAULT 0,
  whispers_received INTEGER DEFAULT 0,
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (tighten with auth later)
CREATE POLICY "Allow all" ON sessions FOR ALL USING (true) WITH CHECK (true);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_sessions_rep_id ON sessions(rep_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_outcome ON sessions(outcome);

-- =============================================
-- ANALYTICS TABLES — Run these in Supabase SQL Editor
-- =============================================

-- Daily stats per rep (one row per rep per day)
CREATE TABLE IF NOT EXISTS rep_daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id TEXT NOT NULL,
  rep_name TEXT NOT NULL,
  manager_id TEXT,
  date DATE NOT NULL,
  total_appointments INTEGER DEFAULT 0,
  calls_completed INTEGER DEFAULT 0,
  no_shows INTEGER DEFAULT 0,
  sales INTEGER DEFAULT 0,
  follow_ups INTEGER DEFAULT 0,
  not_interested INTEGER DEFAULT 0,
  total_revenue DECIMAL DEFAULT 0,
  avg_call_duration INTEGER DEFAULT 0,
  avg_flow_score INTEGER DEFAULT 0,
  avg_pacing_pct INTEGER DEFAULT 0,
  calls_over_time INTEGER DEFAULT 0,
  objections_total INTEGER DEFAULT 0,
  calculator_used INTEGER DEFAULT 0,
  avg_savings_quoted INTEGER DEFAULT 0,
  discovery_completion_avg DECIMAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(rep_id, date)
);

ALTER TABLE rep_daily_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all rep_daily" ON rep_daily_stats FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_rep_daily_rep ON rep_daily_stats(rep_id, date DESC);
CREATE INDEX idx_rep_daily_date ON rep_daily_stats(date DESC);
CREATE INDEX idx_rep_daily_manager ON rep_daily_stats(manager_id, date DESC);

-- Daily stats per manager (aggregated from their reps)
CREATE TABLE IF NOT EXISTS manager_daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id TEXT NOT NULL,
  manager_name TEXT NOT NULL,
  date DATE NOT NULL,
  total_reps INTEGER DEFAULT 0,
  total_calls INTEGER DEFAULT 0,
  total_sales INTEGER DEFAULT 0,
  total_revenue DECIMAL DEFAULT 0,
  close_rate DECIMAL DEFAULT 0,
  avg_call_duration INTEGER DEFAULT 0,
  avg_flow_score INTEGER DEFAULT 0,
  calls_over_time INTEGER DEFAULT 0,
  top_objection TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(manager_id, date)
);

ALTER TABLE manager_daily_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all manager_daily" ON manager_daily_stats FOR ALL USING (true) WITH CHECK (true);

-- Objection tracking (one row per objection per call)
CREATE TABLE IF NOT EXISTS objection_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  rep_id TEXT NOT NULL,
  objection_type TEXT NOT NULL,
  competitor_mentioned TEXT,
  outcome TEXT,
  slide_number INTEGER,
  timestamp_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE objection_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all objection_log" ON objection_log FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_objection_rep ON objection_log(rep_id);
CREATE INDEX idx_objection_type ON objection_log(objection_type);

-- Not-interested reasons tracking
CREATE TABLE IF NOT EXISTS disposition_reasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  rep_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  lead_source TEXT,
  industry TEXT,
  state TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE disposition_reasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all disposition_reasons" ON disposition_reasons FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_disposition_reason ON disposition_reasons(reason);
CREATE INDEX idx_disposition_rep ON disposition_reasons(rep_id);
