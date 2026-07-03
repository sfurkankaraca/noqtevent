-- iyzico online ödeme entegrasyonu
-- Supabase Dashboard > SQL Editor'da çalıştırın

ALTER TABLE booking_payments
  ADD COLUMN IF NOT EXISTS provider            text,   -- 'iyzico' | 'bank-transfer'
  ADD COLUMN IF NOT EXISTS provider_payment_id text,   -- iyzico paymentId (idempotency)
  ADD COLUMN IF NOT EXISTS conversation_id     text;

CREATE INDEX IF NOT EXISTS booking_payments_provider_payment_id_idx
  ON booking_payments (provider_payment_id);
