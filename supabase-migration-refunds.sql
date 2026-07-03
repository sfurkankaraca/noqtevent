-- İptal/iade akışı için iyzico işlem referansı
-- Supabase Dashboard > SQL Editor'da çalıştırın

ALTER TABLE booking_payments
  ADD COLUMN IF NOT EXISTS provider_transaction_id text; -- iyzico paymentTransactionId (iade için gerekli)
