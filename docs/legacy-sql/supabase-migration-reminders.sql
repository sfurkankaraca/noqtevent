-- Otomatik ödeme hatırlatmaları + teklif görüntülenme/geçerlilik takibi
-- Supabase Dashboard > SQL Editor'da çalıştırın

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS reminder_7d_sent_at  timestamptz,
  ADD COLUMN IF NOT EXISTS reminder_3d_sent_at  timestamptz,
  ADD COLUMN IF NOT EXISTS offer_viewed_at       timestamptz,
  ADD COLUMN IF NOT EXISTS offer_expires_at      timestamptz,
  ADD COLUMN IF NOT EXISTS review_requested_at   timestamptz;
