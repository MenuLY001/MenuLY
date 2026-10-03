-- Migration 007: Announcements table
-- Platform-wide broadcast messages shown in restaurant admin dashboards

CREATE TABLE IF NOT EXISTS announcements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'info'  CHECK (type IN ('info', 'warning', 'success', 'error')),
  target      TEXT NOT NULL DEFAULT 'all'   CHECK (target IN ('all', 'trialing', 'active')),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at  TIMESTAMPTZ,
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for active announcement queries
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements (is_active, expires_at);

-- Auto-update updated_at
CREATE OR REPLACE TRIGGER set_announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS: Only super admins can manage announcements (via service role in API)
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- No public read access (API reads via service role)
CREATE POLICY "No direct public access" ON announcements FOR ALL USING (false);
