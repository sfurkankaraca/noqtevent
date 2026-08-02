-- Mekan şehir kolonu — kritik veri açığının düzeltmesi.
--
-- BULGU: venue_details'te hiçbir zaman bir `city` kolonu olmadı (yalnız
-- `district` — bkz. eventmatch/functions/src/supplySync.ts'teki eski not ve
-- 20260802150000_add_venue_google_enrichment.sql'in bulk script'inin bu
-- yüzden "Kayseri" varsaydığı yorum). Bu, scripts/supply-import/import-external.mjs
-- (Ticketmaster/RA içe aktarımı) için sessiz bir veri kaybıydı: TM/RA
-- adaylarının `city` alanı (venue.city.name / RA area.name) fetch aşamasında
-- doğru okunuyordu AMA `insertVenue()` bunu satıra hiç yazmıyordu — yalnız
-- `address` (TM'nin `line1` alanı, genelde şehir İÇERMEZ) kaydediliyordu.
-- Sonuç: yüzlerce İstanbul/Ankara/İzmir/... mekanı DB'de şehirsiz duruyor,
-- enrich-google-venues.mjs de bu mekanlar için sorguyu "Kayseri" ekleyerek
-- kuruyordu — YANLIŞ, çünkü bu mekanların çoğu Kayseri'de değil.
--
-- Bu migration additive: mevcut satırlar etkilenmez, city NULL kalır. Asıl
-- düzeltme üç yerde: import-external.mjs'in insertVenue()'sine city eklendi,
-- yeni bir --backfill-city modu eklendi (TM/RA'dan taze çekip slug
-- eşleşmesiyle mevcut NULL city'leri doldurur), enrich-google-venues.mjs
-- artık "Kayseri" varsaymıyor.

ALTER TABLE venue_details
  ADD COLUMN IF NOT EXISTS city text;

-- Admin mekan listesi filtresi (getDistinctVenueCities) ve olası şehir bazlı
-- keşif sorguları için.
CREATE INDEX IF NOT EXISTS venue_details_city_idx ON venue_details (city);
