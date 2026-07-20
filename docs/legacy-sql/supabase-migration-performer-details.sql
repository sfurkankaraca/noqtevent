-- Run in Supabase SQL Editor

ALTER TABLE dj_profiles
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS repertoire text,
  ADD COLUMN IF NOT EXISTS event_types text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS youtube_links text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS cover_cities text[] DEFAULT '{}';
