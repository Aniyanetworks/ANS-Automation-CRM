-- Campaign-level reply & follow-up controls.
--   ai_reply_enabled     : default AI auto-reply state for NEW recipients added to this
--                          campaign. Existing recipients keep their own per-lead flag.
--   reply_delay_minutes  : how long to wait before the AI sends its auto-reply
--                          (0 = immediate). Lets replies feel human / be reviewable.
--   auto_followup_enabled: when false, only the first email is sent — the scheduled
--                          follow-up sequence is skipped (outreach only). Follow-ups
--                          already stop automatically once a lead replies.
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS ai_reply_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS reply_delay_minutes INTEGER DEFAULT 0;
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS auto_followup_enabled BOOLEAN DEFAULT TRUE;
