-- ============================================================
-- NOQT — Contact Messages Table
-- Supabase Dashboard > SQL Editor'da çalıştır
-- ============================================================

CREATE TABLE IF NOT EXISTS contact_messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  email      text NOT NULL,
  event_type text,
  message    text NOT NULL,
  is_read    boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
-- Sadece servis rolü yazabilir ve okuyabilir (admin panel service client kullanır)
