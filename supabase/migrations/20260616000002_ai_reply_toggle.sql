-- Per-recipient AI auto-reply toggle. When false, inbound replies are still
-- logged but the AI does NOT auto-respond — the admin replies manually.
ALTER TABLE email_leads     ADD COLUMN IF NOT EXISTS ai_reply_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE nurture_clients ADD COLUMN IF NOT EXISTS ai_reply_enabled BOOLEAN DEFAULT TRUE;
