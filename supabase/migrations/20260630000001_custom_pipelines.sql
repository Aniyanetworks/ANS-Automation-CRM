-- Admin-created pipelines (additive only — does not touch contacts.lead_status,
-- which remains the default "Sales Pipeline" used by existing automation).
-- A contact can be assigned to one stage per custom pipeline at a time, and
-- can be in several different custom pipelines simultaneously.

CREATE TABLE IF NOT EXISTS pipelines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pipeline_stages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pipeline_id UUID REFERENCES pipelines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contact_pipeline_stages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  pipeline_id UUID REFERENCES pipelines(id) ON DELETE CASCADE,
  stage_id UUID REFERENCES pipeline_stages(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (contact_id, pipeline_id)
);

-- Private CRM: RLS off, matching the existing tables.
ALTER TABLE pipelines               DISABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages         DISABLE ROW LEVEL SECURITY;
ALTER TABLE contact_pipeline_stages DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_pipeline_stages_pipeline ON pipeline_stages(pipeline_id, position);
CREATE INDEX IF NOT EXISTS idx_cps_pipeline             ON contact_pipeline_stages(pipeline_id, stage_id);
CREATE INDEX IF NOT EXISTS idx_cps_contact              ON contact_pipeline_stages(contact_id);
