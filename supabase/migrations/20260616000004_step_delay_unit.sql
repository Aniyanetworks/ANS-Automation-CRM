-- Follow-up step delays can be minutes / hours / days (was days-only).
-- delay_days holds the numeric value; delay_unit holds the unit.
ALTER TABLE email_steps ADD COLUMN IF NOT EXISTS delay_unit TEXT DEFAULT 'days';
