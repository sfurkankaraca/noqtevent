-- ============================================================
-- NOQT — Inquiry Status Migration
-- Supabase Dashboard > SQL Editor'da çalıştır
-- ============================================================

ALTER TABLE inquiries
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'confirmed', 'cancelled')),
  ADD COLUMN IF NOT EXISTS admin_notes text,
  ADD COLUMN IF NOT EXISTS assigned_dj_id uuid REFERENCES dj_profiles(id) ON DELETE SET NULL;
