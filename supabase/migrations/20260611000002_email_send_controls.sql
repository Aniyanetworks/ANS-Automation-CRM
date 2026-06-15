-- Sending controls for email campaigns — additive only.
-- daily_limit       : max emails to send per day for the campaign
-- send_days         : CSV of ISO weekdays allowed (1=Mon ... 7=Sun)
-- send_start_hour   : earliest hour to send (0-23)
-- send_end_hour     : latest hour to send, exclusive (1-24)
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS daily_limit     INTEGER DEFAULT 50;
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS send_days       TEXT    DEFAULT '1,2,3,4,5,6,7';
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS send_start_hour INTEGER DEFAULT 0;
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS send_end_hour   INTEGER DEFAULT 24;
