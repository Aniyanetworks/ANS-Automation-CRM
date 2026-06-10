-- Client Nurture (monthly relationship check-ins) — additive only.
-- IMPORTANT: this does not alter or repurpose any existing contact fields;
-- it only ADDS a new column and new tables, so existing workflows are unaffected.

-- Relationship / past-project note on a contact (used by the nurture AI).
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS client_note TEXT;

-- Let an email campaign be either sales 'outreach' or relationship 'nurture'.
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'outreach';
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS interval_days INTEGER DEFAULT 30;

-- Clients enrolled in a nurture campaign. The monthly workflow walks these.
-- Replies do NOT stop the cadence (it runs until status is changed).
CREATE TABLE IF NOT EXISTS nurture_clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  note TEXT,                              -- snapshot of the contact's client_note at enrolment
  status TEXT DEFAULT 'Active',           -- Active | Paused
  next_send_at TIMESTAMPTZ,               -- when the next monthly check-in is due
  last_sent_at TIMESTAMPTZ,
  last_message TEXT,                      -- last AI check-in that was sent
  emails_sent INTEGER DEFAULT 0,
  thread_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE nurture_clients DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_nurture_clients_due      ON nurture_clients(status, next_send_at);
CREATE INDEX IF NOT EXISTS idx_nurture_clients_campaign ON nurture_clients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_nurture_clients_contact  ON nurture_clients(contact_id);
