-- Run in Supabase SQL Editor

-- Add performer_type and application_status to dj_profiles
ALTER TABLE dj_profiles
  ADD COLUMN IF NOT EXISTS performer_type text NOT NULL DEFAULT 'dj',
  ADD COLUMN IF NOT EXISTS application_status text NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS instagram_url text,
  ADD COLUMN IF NOT EXISTS spotify_url text,
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS speciality text; -- e.g. "Latin Dans", "Flamenko", "Caz Trio"

-- performer_type: 'dj' | 'artist' | 'trio' | 'dance' | 'band'
-- application_status: 'approved' | 'pending' | 'rejected'

-- Update existing DJ records
UPDATE dj_profiles SET performer_type = 'dj' WHERE performer_type IS NULL OR performer_type = '';

-- Public read: only approved + active
DROP POLICY IF EXISTS "DJ profiles public read" ON dj_profiles;
CREATE POLICY "Performers public read" ON dj_profiles
  FOR SELECT USING (is_active = true AND application_status = 'approved');

-- Allow public INSERT for applications (pending status only)
DROP POLICY IF EXISTS "Performer application insert" ON dj_profiles;
CREATE POLICY "Performer application insert" ON dj_profiles
  FOR INSERT WITH CHECK (application_status = 'pending');
