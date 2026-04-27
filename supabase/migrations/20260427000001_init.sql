-- ANS CRM Initial Schema

CREATE TABLE IF NOT EXISTS contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT UNIQUE,
  name TEXT,
  email TEXT,
  phone TEXT,
  message TEXT,
  service_type TEXT,
  interest TEXT DEFAULT 'Pending',
  summary TEXT,
  lead_status TEXT DEFAULT 'New Lead',
  customer_replied TEXT DEFAULT 'No',
  unsubscribe TEXT DEFAULT 'No',
  initial_sms_sent TEXT DEFAULT 'No',
  current_step TEXT DEFAULT 'START',
  last_action_date TIMESTAMPTZ DEFAULT NOW(),
  last_message_sent TEXT,
  last_action_type TEXT,
  source TEXT,
  avatar TEXT,
  avatar_color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL,
  text TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS followups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  contact_name TEXT,
  phone TEXT,
  source TEXT,
  follow_up_date DATE,
  message TEXT,
  status TEXT DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_name TEXT,
  automation TEXT,
  contact_name TEXT,
  status TEXT,
  duration_ms INTEGER DEFAULT 0,
  trigger TEXT,
  notes TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS for private CRM use
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE followups DISABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions DISABLE ROW LEVEL SECURITY;

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_contacts_session_id ON contacts(session_id);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone);
CREATE INDEX IF NOT EXISTS idx_contacts_lead_status ON contacts(lead_status);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_followups_contact_id ON followups(contact_id);
CREATE INDEX IF NOT EXISTS idx_followups_status ON followups(status);
CREATE INDEX IF NOT EXISTS idx_followups_follow_up_date ON followups(follow_up_date);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_timestamp ON workflow_executions(timestamp DESC);
