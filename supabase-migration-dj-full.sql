-- ============================================================
-- NOQT — dj_profiles Full Column Migration
-- Supabase Dashboard > SQL Editor'da çalıştır
-- ============================================================

ALTER TABLE dj_profiles
  ADD COLUMN IF NOT EXISTS performer_type      text NOT NULL DEFAULT 'dj',
  ADD COLUMN IF NOT EXISTS speciality          text,
  ADD COLUMN IF NOT EXISTS city                text,
  ADD COLUMN IF NOT EXISTS instagram_url       text,
  ADD COLUMN IF NOT EXISTS spotify_url         text,
  ADD COLUMN IF NOT EXISTS website_url         text,
  ADD COLUMN IF NOT EXISTS application_status  text NOT NULL DEFAULT 'approved'
    CHECK (application_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS email               text,
  ADD COLUMN IF NOT EXISTS phone               text,
  ADD COLUMN IF NOT EXISTS repertoire          text,
  ADD COLUMN IF NOT EXISTS event_types         text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS youtube_links       text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS cover_cities        text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS photos              text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS focal_points        jsonb  DEFAULT '{}';
