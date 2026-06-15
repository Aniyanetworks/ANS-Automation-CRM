-- Review Campaigns — SMS + Email review collection with follow-up sequence.
-- Additive only; does not alter any existing table.
-- Public review form at /r/{token} reads these tables via the anon key (RLS disabled
-- like all other tables in this CRM, access is controlled at the app layer).

-- One campaign = one review collection sequence with its own branding + message templates.
CREATE TABLE IF NOT EXISTS review_campaigns (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name           TEXT NOT NULL,
  status         TEXT DEFAULT 'Active',                -- Active | Paused
  from_name      TEXT,
  from_email     TEXT,
  -- Review form appearance (all editable from CRM)
  form_logo_url  TEXT,
  form_title     TEXT DEFAULT 'How was your experience?',
  form_subtitle  TEXT DEFAULT 'Your feedback helps us improve',
  -- Where to redirect Excellent/Good reviewers (e.g. Google Business link)
  review_link    TEXT,
  -- Admin contact for Bad review alerts
  admin_phone    TEXT,
  admin_email    TEXT,
  -- Outreach templates; placeholders: {{name}} {{review_link}} {{from_name}}
  sms_body       TEXT DEFAULT 'Hi {{name}}, we''d love your feedback! It only takes 30 seconds: {{review_link}} 🙏',
  email_subject  TEXT DEFAULT 'How was your experience with us, {{name}}?',
  email_body     TEXT DEFAULT E'Hi {{name}},\n\nThank you for choosing us! We''d love to hear about your experience.\n\nPlease click below to leave your review:\n\n{{review_link}}\n\nYour feedback means the world to us.\n\nWarm regards,\n{{from_name}}',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- One row per lead enrolled in a review campaign.
-- current_step maps to the follow-up schedule: 0=immediate, 1=day1, 2=day3, 3=day7, 4=day15, 5=day30, 6=day60.
-- After step 6 is sent the n8n workflow sets status='Completed'.
CREATE TABLE IF NOT EXISTS review_leads (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id    UUID REFERENCES review_campaigns(id) ON DELETE CASCADE,
  name           TEXT,
  phone          TEXT,
  email          TEXT,
  status         TEXT DEFAULT 'Active',                -- Active | Completed | Paused | Unsubscribed
  current_step   INTEGER DEFAULT 0,
  next_send_at   TIMESTAMPTZ DEFAULT NOW(),
  messages_sent  INTEGER DEFAULT 0,
  tag            TEXT,                                  -- review_later | review_done | bad_alerted
  review_rating  TEXT,                                  -- Excellent | Good | Bad
  review_comment TEXT,
  submitted_at   TIMESTAMPTZ,
  token          TEXT UNIQUE DEFAULT gen_random_uuid()::TEXT,  -- unique URL token for /r/{token}
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE review_campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE review_leads     DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_review_leads_campaign    ON review_leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_review_leads_token       ON review_leads(token);
CREATE INDEX IF NOT EXISTS idx_review_leads_due         ON review_leads(status, next_send_at);
CREATE INDEX IF NOT EXISTS idx_review_leads_bad         ON review_leads(review_rating, submitted_at) WHERE review_rating = 'Bad';
