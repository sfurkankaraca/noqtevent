-- NOQT — Teklif / Bağlayıcı Sözleşme migration
-- Supabase Dashboard > SQL Editor'da çalıştır

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS offer_slug     text UNIQUE,
  ADD COLUMN IF NOT EXISTS payment_plan   text CHECK (payment_plan IN ('cash', 'prepay'));

CREATE INDEX IF NOT EXISTS bookings_offer_slug_idx ON bookings (offer_slug);

-- Bağlayıcı onay kayıtları (click-wrap sözleşme izi)
CREATE TABLE IF NOT EXISTS booking_agreements (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        timestamptz NOT NULL DEFAULT now(),
  booking_id        uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  accepted_name     text NOT NULL,
  accepted_email    text,
  payment_plan      text NOT NULL CHECK (payment_plan IN ('cash', 'prepay')),
  agreed_price      numeric(12,2) NOT NULL,
  terms_version     text NOT NULL,
  ip_address        text,
  user_agent        text
);

CREATE INDEX IF NOT EXISTS booking_agreements_booking_id_idx ON booking_agreements (booking_id);
