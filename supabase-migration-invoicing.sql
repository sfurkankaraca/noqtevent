-- Muhasebe: ödeme hareketlerinde fatura takibi
-- Supabase Dashboard > SQL Editor'da çalıştırın

ALTER TABLE booking_payments
  ADD COLUMN IF NOT EXISTS invoiced      boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS invoiced_at   timestamptz,
  ADD COLUMN IF NOT EXISTS invoice_note  text; -- fatura no / e-arşiv referansı (serbest metin)

CREATE INDEX IF NOT EXISTS booking_payments_invoiced_idx ON booking_payments (invoiced);
