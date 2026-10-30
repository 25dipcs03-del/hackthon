-- ============================================================
-- MIGRATION: Add scoring_breakdown and factors to ai_analysis
-- Run this in your Supabase SQL Editor if you already have an
-- existing database from an earlier version.
-- If you are setting up fresh, schema.sql already includes this.
-- ============================================================

ALTER TABLE ai_analysis
  ADD COLUMN IF NOT EXISTS scoring_breakdown JSONB,
  ADD COLUMN IF NOT EXISTS factors JSONB;

-- Informational comment
COMMENT ON COLUMN ai_analysis.scoring_breakdown IS
  'Explainable priority breakdown: safety_risk_score, urgency_score, public_impact_score, severity_score (each 0-25) with reasons';

COMMENT ON COLUMN ai_analysis.factors IS
  'High-level factor summary: safety_risk, urgency, public_impact, estimated_resolution_days';
