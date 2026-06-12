-- Add configurable follow-up schedule to review campaigns.
-- Default matches the original hardcoded schedule: days 1, 3, 7, 15, 30, 60 after enrollment.
ALTER TABLE review_campaigns
  ADD COLUMN IF NOT EXISTS followup_days JSONB DEFAULT '[1, 3, 7, 15, 30, 60]'::JSONB;
