-- Store the last Gmail message id for nurture clients so manual replies can be
-- sent in-thread (Gmail "reply" needs a message id from the thread).
ALTER TABLE nurture_clients ADD COLUMN IF NOT EXISTS message_id TEXT;
