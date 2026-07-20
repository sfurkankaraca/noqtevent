-- Teklif onayında e-posta OTP doğrulaması ve sözleşme bütünlük kanıtı
-- Supabase Dashboard > SQL Editor'da çalıştırın

ALTER TABLE booking_agreements
  ADD COLUMN IF NOT EXISTS verification_method text,   -- 'email-otp'
  ADD COLUMN IF NOT EXISTS verified_email      text,   -- OTP ile doğrulanan adres
  ADD COLUMN IF NOT EXISTS contract_hash       text;   -- sözleşme PDF'inin SHA-256 özeti
