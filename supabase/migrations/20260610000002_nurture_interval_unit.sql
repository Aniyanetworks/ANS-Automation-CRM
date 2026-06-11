-- Make the nurture check-in interval support custom units (minutes / hours / days).
-- interval_days holds the numeric value; interval_unit holds the unit.
-- e.g. value 10 + unit 'minutes' = every 10 minutes; value 30 + unit 'days' = monthly.
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS interval_unit TEXT DEFAULT 'days';
