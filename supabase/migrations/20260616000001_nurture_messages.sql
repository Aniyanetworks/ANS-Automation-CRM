-- Conversation log for nurture clients (outbound check-ins, inbound replies, AI replies).
-- Mirrors email_messages, but linked to nurture_clients.
CREATE TABLE IF NOT EXISTS nurture_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES nurture_clients(id) ON DELETE CASCADE,
  direction TEXT,            -- outbound | inbound
  subject TEXT,
  body TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE nurture_messages DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_nurture_messages_client ON nurture_messages(client_id);
