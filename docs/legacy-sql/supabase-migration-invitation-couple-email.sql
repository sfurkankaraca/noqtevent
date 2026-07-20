-- NOQT — Davetiye: gelin & damat bildirim e-postası
-- Her RSVP formu dolduğunda çifte bildirim gitmesi için
-- Supabase Dashboard > SQL Editor'da çalıştır

ALTER TABLE invitations
  ADD COLUMN IF NOT EXISTS couple_email text;
