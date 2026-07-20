-- NOQT — Partner Toolkit migration
-- Supabase Dashboard > SQL Editor'da çalıştır
-- Not: Admin panelindeki partner formu gerçek şemayla (business_name, category[], vb.)
-- senkronize edilmiştir. Bu migration sadece toolkit/presskit özelliklerini ekler.

ALTER TABLE partner_profiles
  ADD COLUMN IF NOT EXISTS slug          text UNIQUE,
  ADD COLUMN IF NOT EXISTS focal_points  jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tool_data     jsonb DEFAULT '{}';

CREATE INDEX IF NOT EXISTS partner_profiles_slug_idx ON partner_profiles (slug);

-- tool_data yapısı (serbest form, örnek):
-- {
--   "specs": [{ "label": "Kapasite", "value": "300 kişi" }, { "label": "Sahne Ölçüsü", "value": "6x4m" }],
--   "packages": [{ "name": "Temel Paket", "price": "15.000 ₺", "description": "..." }]
-- }
