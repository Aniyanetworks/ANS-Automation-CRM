-- Follow-up settings: configurable sequence steps (replaces hardcoded n8n logic)
CREATE TABLE IF NOT EXISTS followup_settings (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  step_number  INTEGER NOT NULL,
  label        TEXT NOT NULL DEFAULT '',
  wait_hours   DECIMAL(10,2) NOT NULL DEFAULT 24,
  sms_enabled  BOOLEAN NOT NULL DEFAULT true,
  sms_template TEXT NOT NULL DEFAULT '',
  email_enabled  BOOLEAN NOT NULL DEFAULT false,
  email_subject  TEXT NOT NULL DEFAULT '',
  email_template TEXT NOT NULL DEFAULT '',
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(step_number)
);
ALTER TABLE followup_settings DISABLE ROW LEVEL SECURITY;

-- Follow-up logs: per-message audit trail
CREATE TABLE IF NOT EXISTS followup_logs (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id    UUID REFERENCES contacts(id) ON DELETE SET NULL,
  contact_name  TEXT NOT NULL DEFAULT '',
  phone         TEXT NOT NULL DEFAULT '',
  email         TEXT NOT NULL DEFAULT '',
  step_number   INTEGER NOT NULL,
  step_label    TEXT NOT NULL DEFAULT '',
  sms_text      TEXT DEFAULT '',
  email_subject TEXT DEFAULT '',
  email_text    TEXT DEFAULT '',
  status        TEXT NOT NULL DEFAULT 'sent',
  error_message TEXT DEFAULT '',
  sent_at       TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE followup_logs DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_followup_logs_contact ON followup_logs(contact_id);
CREATE INDEX IF NOT EXISTS idx_followup_logs_step    ON followup_logs(step_number);
CREATE INDEX IF NOT EXISTS idx_followup_logs_sent    ON followup_logs(sent_at DESC);

-- New tracking columns on contacts
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS followup_step        INTEGER DEFAULT 0;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_followup_date   TIMESTAMPTZ;

-- Migrate existing contacts: map old text steps to integer positions
UPDATE contacts
SET followup_step = CASE current_step
  WHEN 'SMS_1'   THEN 1
  WHEN 'EMAIL_1' THEN 2
  WHEN 'SMS_2'   THEN 3
  WHEN 'EMAIL_2' THEN 4
  WHEN 'SMS_3'   THEN 5
  ELSE 0
END,
last_followup_date = COALESCE(last_followup_date, last_action_date)
WHERE followup_step IS NULL OR followup_step = 0;

-- Seed default follow-up steps
INSERT INTO followup_settings
  (step_number, label, wait_hours, sms_enabled, sms_template, email_enabled, email_subject, email_template)
VALUES
  (1, 'First Follow-up', 2, true,
   'Hey {{name}}, just checking in — did you still want help with {{service}}? I can get you booked this week if you''re ready.',
   false, '', ''),
  (2, 'Second Follow-up', 24, true,
   'Still interested in {{service}}? No pressure — just want to make sure you get taken care of. — ANS Team',
   true, 'Quick follow-up on your request',
   'Hi {{name}},'||chr(10)||chr(10)||'Just wanted to follow up on your request about {{service}}.'||chr(10)||'We still have availability this week if you''d like to move forward.'||chr(10)||chr(10)||'Book here: {{booking_link}}'||chr(10)||chr(10)||'Best, ANS Team'),
  (3, 'Third Follow-up', 72, false, '',
   true, 'Want me to hold a spot for you?',
   'Hi {{name}},'||chr(10)||chr(10)||'We''ve helped a lot of people with {{service}} recently.'||chr(10)||'If you want, I can hold a spot for you — just let me know.'||chr(10)||chr(10)||'Book here: {{booking_link}}'||chr(10)||chr(10)||'Best, ANS Team')
ON CONFLICT (step_number) DO NOTHING;
