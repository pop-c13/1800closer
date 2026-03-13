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
