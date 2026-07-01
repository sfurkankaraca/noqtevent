-- NOQT — Bookings migration
-- Supabase Dashboard > SQL Editor'da çalıştır

CREATE TABLE IF NOT EXISTS bookings (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),

  -- İlişkiler
  inquiry_id              uuid REFERENCES inquiries(id) ON DELETE SET NULL,
  artist_id               uuid REFERENCES dj_profiles(id) ON DELETE SET NULL,

  -- Müşteri
  client_name             text NOT NULL,
  client_email            text,
  client_phone            text,

  -- Etkinlik
  event_type              text,
  event_date              date,
  event_time              text,
  event_duration_hours    numeric(4,1),
  venue_name              text,
  venue_city              text,
  venue_address           text,

  -- Finansal (TL)
  fee                     numeric(12,2) NOT NULL DEFAULT 0,
  commission_rate         numeric(5,2)  NOT NULL DEFAULT 15,
  deposit_rate            numeric(5,2)  NOT NULL DEFAULT 30,

  -- Gider avansı (bilet, konaklama)
  travel_required         boolean NOT NULL DEFAULT false,
  accommodation_required  boolean NOT NULL DEFAULT false,
  advance_amount          numeric(12,2) NOT NULL DEFAULT 0,

  -- Durum
  status                  text NOT NULL DEFAULT 'draft'
    CHECK (status IN (
      'draft',          -- Taslak
      'offer_sent',     -- Teklif gönderildi
      'confirmed',      -- Müşteri onayladı
      'contracted',     -- Sözleşme imzalandı
      'deposit_paid',   -- Kapora alındı
      'full_paid',      -- Tam ödeme alındı
      'completed',      -- Etkinlik tamamlandı
      'cancelled'       -- İptal
    )),

  -- Belgeler
  contract_url            text,
  contract_signed_at      timestamptz,
  report_url              text,

  -- Teslimat (etkinlik sonrası müşteriye)
  delivery_slug           text UNIQUE,
  delivery_photos         jsonb DEFAULT '[]',
  delivery_videos         jsonb DEFAULT '[]',
  delivery_notes          text,
  delivery_sent_at        timestamptz,

  -- Notlar
  notes                   text,
  internal_notes          text
);

-- Ödeme hareketleri
CREATE TABLE IF NOT EXISTS booking_payments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  booking_id   uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  type         text NOT NULL CHECK (type IN (
    'deposit',        -- Kapora (müşteriden)
    'full',           -- Tam ödeme (müşteriden)
    'advance',        -- Avans (sanatçıya: bilet/konaklama)
    'artist_payment', -- Sanatçı ödemesi (etkinlik sonrası)
    'refund'          -- İade
  )),
  amount       numeric(12,2) NOT NULL,
  direction    text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  status       text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  description  text,
  paid_at      timestamptz
);

-- updated_at otomatik güncelleme
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bookings_updated_at ON bookings;
CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS bookings_artist_id_idx  ON bookings (artist_id);
CREATE INDEX IF NOT EXISTS bookings_status_idx     ON bookings (status);
CREATE INDEX IF NOT EXISTS bookings_event_date_idx ON bookings (event_date);
CREATE INDEX IF NOT EXISTS booking_payments_booking_id_idx ON booking_payments (booking_id);

-- Bu migration'ı daha önce çalıştırdıysanız (teslimat kolonları olmadan),
-- aşağıdaki satır mevcut tabloyu güvenle günceller:
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS delivery_slug     text UNIQUE,
  ADD COLUMN IF NOT EXISTS delivery_photos   jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS delivery_videos   jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS delivery_notes    text,
  ADD COLUMN IF NOT EXISTS delivery_sent_at  timestamptz;

CREATE INDEX IF NOT EXISTS bookings_delivery_slug_idx ON bookings (delivery_slug);
