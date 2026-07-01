-- NOQT — Presskit migration
-- Supabase Dashboard > SQL Editor'da çalıştır

ALTER TABLE dj_profiles
  ADD COLUMN IF NOT EXISTS slug             text UNIQUE,
  ADD COLUMN IF NOT EXISTS rider_url        text,
  ADD COLUMN IF NOT EXISTS rider            jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS media_drive_url  text;

CREATE INDEX IF NOT EXISTS dj_profiles_slug_idx ON dj_profiles (slug);
