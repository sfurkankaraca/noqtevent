-- NOQT — Sanatçı kaşe bedelleri (etkinlik türüne göre)
-- Supabase Dashboard > SQL Editor'da çalıştır

ALTER TABLE dj_profiles
  ADD COLUMN IF NOT EXISTS base_fee_min      numeric(12,2),
  ADD COLUMN IF NOT EXISTS base_fee_max      numeric(12,2),
  ADD COLUMN IF NOT EXISTS event_type_fees   jsonb DEFAULT '{}';

-- event_type_fees yapısı (serbest form, örnek):
-- {
--   "wedding":  { "min": 20000, "max": 45000 },
--   "corporate":{ "min": 15000, "max": 30000 }
-- }
-- Bir etkinlik türü burada yoksa base_fee_min/max fallback olarak kullanılır.
