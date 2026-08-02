-- Sanatçı Spotify zenginleştirme alanları — panel "Spotify'dan doldur" özelliği
-- (bkz. src/app/api/panel/enrich/*, src/components/panel/ArtistEnrich.tsx,
-- scripts/supply-import/enrich-spotify.mjs). Additive, nullable — mevcut
-- satırlar etkilenmez. spotify_artist_id kolonu zaten vardı
-- (20260801130000_create_event_discovery_supply_schema.sql); bu migration
-- yalnız Spotify'dan çekilen sinyalleri (popülerlik/takipçi) ve "ne zaman
-- eşleştirildi" bilgisini ekliyor — sıralama/kürasyon sinyali olarak
-- eventmatch supplySync worker'ına da taşınacak (bkz. functions/src/supplySync.ts).
--
-- RLS: artist_profiles'ın mevcut UPDATE politikaları satır bazlı (kolon bazlı
-- kısıtlama yok) — yeni kolonlar için ayrı bir policy gerekmiyor
-- (20260802090000_add_supply_media_gallery.sql'deki aynı gerekçe).

ALTER TABLE artist_profiles
  ADD COLUMN IF NOT EXISTS spotify_popularity integer,
  ADD COLUMN IF NOT EXISTS spotify_followers integer,
  ADD COLUMN IF NOT EXISTS enriched_at timestamptz;
