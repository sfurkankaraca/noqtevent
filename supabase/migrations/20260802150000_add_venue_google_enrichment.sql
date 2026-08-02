-- Mekan Google Places zenginleştirme alanları — panel "Google'dan doldur"
-- özelliği (sanatçı tarafındaki Spotify zenginleştirmesinin mekan eşi; bkz.
-- src/app/api/panel/enrich/venue-google-*, src/components/panel/VenueGoogleEnrich.tsx,
-- scripts/supply-import/enrich-google-venues.mjs). Additive, nullable —
-- mevcut satırlar etkilenmez.
--
-- google_place_id İÇ VERİ olarak kalır — eventmatch supplySync worker'ına
-- (functions/src/supplySync.ts) BİLEREK projekte EDİLMEZ (google_maps_phone
-- ile aynı gerekçe: doğrulama/kürasyon içi veri, dış yüzeye taşınmaz).
-- google_rating/google_ratings_total ise kürasyon/sıralama sinyali olarak
-- worker'a AYRICA eklenir (artist_profiles.spotify_popularity'nin mekan eşi).

ALTER TABLE venue_details
  ADD COLUMN IF NOT EXISTS google_place_id text,
  ADD COLUMN IF NOT EXISTS google_rating numeric(2,1),
  ADD COLUMN IF NOT EXISTS google_ratings_total integer,
  ADD COLUMN IF NOT EXISTS enriched_at timestamptz;

-- RLS: venue_details'in mevcut UPDATE politikaları satır bazlı (kolon bazlı
-- kısıtlama yok) — yeni kolonlar için ayrı bir policy gerekmiyor
-- (20260802140000_add_artist_spotify_enrichment.sql'deki aynı gerekçe).
