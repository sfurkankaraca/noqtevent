-- Ön ödemeli (kaporalı) plan vade farkı oranı artık booking bazında admin
-- tarafından ayarlanabilir — önceden sabit %25 idi (PREPAY_MULTIPLIER).
-- Supabase Dashboard > SQL Editor'da çalıştır.

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS prepay_markup_rate numeric(5,2) NOT NULL DEFAULT 25;
