-- Run this in Supabase SQL Editor

ALTER TABLE concepts
  ADD COLUMN IF NOT EXISTS spotify_playlist_url text;
