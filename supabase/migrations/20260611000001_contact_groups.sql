-- Contact grouping — additive only.
-- Groups are named buckets of contacts (many-to-many). A whole group can be
-- pushed into an email campaign from the Contacts page.

CREATE TABLE IF NOT EXISTS contact_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contact_group_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES contact_groups(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (group_id, contact_id)
);

ALTER TABLE contact_groups        DISABLE ROW LEVEL SECURITY;
ALTER TABLE contact_group_members DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_cgm_group   ON contact_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_cgm_contact ON contact_group_members(contact_id);
