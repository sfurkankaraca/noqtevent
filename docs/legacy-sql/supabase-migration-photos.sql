-- DJ profiles: add photos array and focal points
ALTER TABLE dj_profiles
  ADD COLUMN IF NOT EXISTS photos text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS focal_points jsonb DEFAULT '{}';

-- Backfill: move existing photo_url into photos array
UPDATE dj_profiles
SET photos = ARRAY[photo_url]
WHERE photo_url IS NOT NULL AND (photos IS NULL OR photos = '{}');

-- Partner profiles: add focal points
ALTER TABLE partner_profiles
  ADD COLUMN IF NOT EXISTS focal_points jsonb DEFAULT '{}';
