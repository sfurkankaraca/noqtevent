-- Sanatçı/mekan medya galerisi genişletmesi — panel medya yönetimi eklentisi
-- (kurucu talebi: admin formu, sahiplenen mekan/sanatçının düzenleyebileceği
-- her şeyin ÜST KÜMESİ olmalı; tek foto URL yapıştırmak yetmiyor — çoklu
-- galeri + video linki gerekiyor). Additive: mevcut kolonlara dokunulmaz.
--
-- artist_profiles.photo_url TEK KAPAK olarak kalıyor (davranış değişmiyor) —
-- galeri ayrı bir kolon (photo_urls). venue_details.photo_urls zaten vardı
-- (20260801130000_create_event_discovery_supply_schema.sql); onun ilk elemanı
-- kapak kabul edilir, mekana ayrı bir kapak kolonu eklenmiyor.
--
-- RLS: her iki tablonun UPDATE politikaları ("Owners and managers update ...",
-- "Admin full access ...", "Service role full access ...") zaten tüm kolonları
-- kapsıyor (satır bazlı, kolon bazlı kısıtlama yok) — yeni kolonlar için ayrı
-- bir policy gerekmiyor.

ALTER TABLE artist_profiles
  ADD COLUMN IF NOT EXISTS photo_urls text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS video_urls text[] NOT NULL DEFAULT '{}';

ALTER TABLE venue_details
  ADD COLUMN IF NOT EXISTS video_urls text[] NOT NULL DEFAULT '{}';
