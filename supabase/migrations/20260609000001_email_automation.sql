-- Email Automation Schema
-- Cold-email outreach + scheduled follow-ups + reply detection + AI auto-reply.
-- Powers the two n8n workflows in /n8n.

-- A campaign = one outreach sequence (first email + N follow-ups) with its own
-- sender identity and AI reply behaviour.
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'Active',          -- Active | Paused
  from_name TEXT,                        -- display name on outgoing mail
  from_email TEXT,                       -- informational; actual send uses Gmail cred
  ai_reply_prompt TEXT,                  -- system prompt for the AI agent reply
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- The body of each step. step_number 0 = first email, 1..n = follow-ups.
-- delay_days = days to wait AFTER the previous step before this one is sent.
-- Bodies support {{name}} {{email}} {{service}} placeholders.
CREATE TABLE IF NOT EXISTS email_steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  subject TEXT,
  body TEXT,
  delay_days INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (campaign_id, step_number)
);

-- The leads you enrol into a campaign. The sender workflow walks each lead
-- through the steps; the reply workflow flips replied=true to stop the sequence.
CREATE TABLE IF NOT EXISTS email_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  service TEXT,
  status TEXT DEFAULT 'Active',          -- Active | Replied | Completed | Unsubscribed | Error
  current_step INTEGER DEFAULT 0,        -- the step index to send next
  next_send_at TIMESTAMPTZ DEFAULT NOW(),-- when the next email becomes due
  last_sent_at TIMESTAMPTZ,
  replied BOOLEAN DEFAULT FALSE,         -- true once they reply -> follow-ups stop
  emails_sent INTEGER DEFAULT 0,
  thread_id TEXT,                        -- Gmail thread id (for matching replies)
  message_id TEXT,                       -- id of the last sent message
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Full conversation log (outbound sends + inbound replies + AI drafts).
CREATE TABLE IF NOT EXISTS email_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES email_leads(id) ON DELETE CASCADE,
  direction TEXT,                        -- outbound | inbound
  subject TEXT,
  body TEXT,
  step_number INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Private CRM: RLS off, matching the existing tables.
ALTER TABLE email_campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE email_steps     DISABLE ROW LEVEL SECURITY;
ALTER TABLE email_leads     DISABLE ROW LEVEL SECURITY;
ALTER TABLE email_messages  DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_email_steps_campaign     ON email_steps(campaign_id, step_number);
CREATE INDEX IF NOT EXISTS idx_email_leads_campaign     ON email_leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_leads_due          ON email_leads(status, replied, next_send_at);
CREATE INDEX IF NOT EXISTS idx_email_leads_email        ON email_leads(email);
CREATE INDEX IF NOT EXISTS idx_email_messages_lead      ON email_messages(lead_id);
