-- RSVP: beraber gelecek misafirlerin adları
-- Supabase Dashboard > SQL Editor'da çalıştırın

ALTER TABLE rsvp_responses
  ADD COLUMN IF NOT EXISTS companion_names text[] DEFAULT '{}';
