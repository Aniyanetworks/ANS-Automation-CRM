-- Per-step message templates for review campaigns.
-- Each index matches the follow-up step: [0] = initial send, [1..N] = follow-up steps.
-- Falls back to sms_body / email_subject / email_body when empty.
ALTER TABLE review_campaigns
  ADD COLUMN IF NOT EXISTS followup_messages JSONB DEFAULT '[]'::JSONB;
