-- NOQT — Teklif kalemleri migration (çoklu sanatçı + hizmet içeren teklifler)
-- Supabase Dashboard > SQL Editor'da çalıştır

CREATE TABLE IF NOT EXISTS booking_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  booking_id  uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,

  -- 'artist': dj_profiles'a bağlı sanatçı kalemi · 'service': serbest hizmet kalemi
  kind        text NOT NULL DEFAULT 'service' CHECK (kind IN ('artist', 'service')),
  artist_id   uuid REFERENCES dj_profiles(id) ON DELETE SET NULL,

  title       text NOT NULL,
  description text,
  amount      numeric(12,2) NOT NULL DEFAULT 0,
  sort_order  int NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS booking_items_booking_id_idx ON booking_items (booking_id);

-- Tüm erişim server tarafında service role ile — anon policy tanımlamadan RLS aç
ALTER TABLE booking_items ENABLE ROW LEVEL SECURITY;
