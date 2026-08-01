-- TASLAK: KURUCU İNCELEMESİ ÖNCESİ ÇALIŞTIRMAYIN
--
-- Kayseri mekan envanteri — soğuk başlangıç seed taslağı (etkinlik keşfi V1).
-- Kaynak: ops/kayseri-mekan-envanteri.md ("Ana Envanter — Güven: Yüksek + Orta" tablosu).
-- Yalnız güven=yüksek/orta satırlar buradadır; "Doğrulanmalı" bölümündeki mekanlar
-- (kapanmış olabilecekler / tek kaynaklı / kapsamı şüpheli olanlar) BİLEREK dışarıda
-- bırakıldı — kurucu saha bilgisiyle doğruladıktan sonra ayrı bir ekleme yapılabilir.
--
-- Şema kaynağı (birebir doğrulandı):
--   supabase/migrations/20260720004631_create_identity_registry.sql
--     -> entities(id uuid pk, kind text check in ('person','organization','venue'), created_at)
--     -> venue_details(entity_id uuid pk, entity_kind text default 'venue', name text not null,
--                       address text, operated_by_organization_id uuid, operated_by_kind text,
--                       created_at, updated_at)
--   supabase/migrations/20260801130000_create_event_discovery_supply_schema.sql
--     -> venue_details genişletmesi: slug text, district text, venue_type text check in
--        ('bar','club','stage_cafe','concert_hall','other'), capacity integer,
--        entry_policy text check in ('free','door_fee','reservation'), instagram_handle text,
--        google_maps_phone text, photo_urls text[] default '{}',
--        claim_status text default 'unclaimed' check in
--        ('unclaimed','pending','claimed','verified')
--     -> venue_details_slug_unique_idx: UNIQUE (slug) WHERE slug IS NOT NULL
--
-- İdempotentlik: her mekan için tek CTE — entities insert'i yalnız o slug'a sahip bir
-- venue_details satırı YOKSA çalışır (WHERE NOT EXISTS). Slug zaten varsa CTE boş döner,
-- venue_details insert'i de otomatik olarak 0 satır ekler. Script'i tekrar tekrar
-- çalıştırmak güvenlidir (ikinci çalıştırmada hiçbir satır eklenmez).
--
-- Alan notları:
--   - address: web aramasıyla bulunan adresler serbest metin olarak kondu; resmi/tapu adresi
--     DEĞİL, kurucu doğrulamalı.
--   - district: bazı mekanlarda kaynaklar arasında tutarsızlık/eksiklik olduğu için NULL
--     bırakıldı (bkz. envanter tablosundaki "Not" kolonu) — tahmin edilmedi.
--   - instagram_handle / google_maps_phone: yalnız web aramasında doğrudan bulunanlar girildi;
--     bulunamayanlar NULL.
--   - operated_by_organization_id / operated_by_kind: hiçbiri için bir "organization" entity'si
--     bu taslakta oluşturulmadı (mekanı işleten tüzel kişi bilgisi web aramasından güvenilir
--     çıkarılamadı) — her iki alan da NULL kalıyor, ileride claim akışıyla doldurulabilir.

BEGIN;

-- 1. Harman Pub
WITH e AS (
  INSERT INTO entities (kind)
  SELECT 'venue'
  WHERE NOT EXISTS (SELECT 1 FROM venue_details WHERE slug = 'harman-pub')
  RETURNING id
)
INSERT INTO venue_details (entity_id, name, address, slug, district, venue_type, instagram_handle, google_maps_phone, claim_status)
SELECT id, 'Harman Pub', 'İstasyon Cad. No:5/B, Kayseri', 'harman-pub', NULL, 'bar', NULL, NULL, 'unclaimed'
FROM e;

-- 2. JJ Pub Kayseri (Jolly Joker)
WITH e AS (
  INSERT INTO entities (kind)
  SELECT 'venue'
  WHERE NOT EXISTS (SELECT 1 FROM venue_details WHERE slug = 'jj-pub-kayseri')
  RETURNING id
)
INSERT INTO venue_details (entity_id, name, address, slug, district, venue_type, instagram_handle, google_maps_phone, claim_status)
SELECT id, 'JJ Pub Kayseri (Jolly Joker)', 'Gevher Nesibe Mah. İstasyon Cad. No:3 (Wyndham Grand Otel), Kocasinan, Kayseri', 'jj-pub-kayseri', 'Kocasinan', 'club', 'jjpubkayseri', '+90 850 549 01 45', 'unclaimed'
FROM e;

-- 3. Roof Lounge (Radisson Blu)
WITH e AS (
  INSERT INTO entities (kind)
  SELECT 'venue'
  WHERE NOT EXISTS (SELECT 1 FROM venue_details WHERE slug = 'roof-lounge-radisson-blu')
  RETURNING id
)
INSERT INTO venue_details (entity_id, name, address, slug, district, venue_type, instagram_handle, google_maps_phone, claim_status)
SELECT id, 'Roof Lounge (Radisson Blu)', 'Hunat, Melikgazi, Kayseri', 'roof-lounge-radisson-blu', 'Melikgazi', 'bar', NULL, NULL, 'unclaimed'
FROM e;

-- 4. The Godfather Cafe (Talas)
WITH e AS (
  INSERT INTO entities (kind)
  SELECT 'venue'
  WHERE NOT EXISTS (SELECT 1 FROM venue_details WHERE slug = 'the-godfather-cafe-talas')
  RETURNING id
)
INSERT INTO venue_details (entity_id, name, address, slug, district, venue_type, instagram_handle, google_maps_phone, claim_status)
SELECT id, 'The Godfather Cafe', 'Atatürk Bul. No:21, Talas, Kayseri', 'the-godfather-cafe-talas', 'Talas', 'stage_cafe', 'thegodfathertalas', NULL, 'unclaimed'
FROM e;

-- 5. Bigbosstalas
WITH e AS (
  INSERT INTO entities (kind)
  SELECT 'venue'
  WHERE NOT EXISTS (SELECT 1 FROM venue_details WHERE slug = 'bigbosstalas')
  RETURNING id
)
INSERT INTO venue_details (entity_id, name, address, slug, district, venue_type, instagram_handle, google_maps_phone, claim_status)
SELECT id, 'Bigbosstalas', 'Yenidoğan Mah. Atatürk Cad. (OPET Petrol karşısı), Talas, Kayseri', 'bigbosstalas', 'Talas', 'stage_cafe', 'bigbosstalas', '0552 575 2495', 'unclaimed'
FROM e;

-- 6. Seyir Teras & Cafe / Seyir Cafe & Restaurant (Talas) — adres tutarsızlığı var, bkz. envanter notu
WITH e AS (
  INSERT INTO entities (kind)
  SELECT 'venue'
  WHERE NOT EXISTS (SELECT 1 FROM venue_details WHERE slug = 'seyir-teras-cafe-talas')
  RETURNING id
)
INSERT INTO venue_details (entity_id, name, address, slug, district, venue_type, instagram_handle, google_maps_phone, claim_status)
SELECT id, 'Seyir Teras & Cafe', 'Tablakaya Mah. Yukarı Talas Cad. No:2, Talas, Kayseri', 'seyir-teras-cafe-talas', 'Talas', 'stage_cafe', NULL, NULL, 'unclaimed'
FROM e;

-- 7. Mavera Mürüvvet Hanım Konağı
WITH e AS (
  INSERT INTO entities (kind)
  SELECT 'venue'
  WHERE NOT EXISTS (SELECT 1 FROM venue_details WHERE slug = 'mavera-muruvvet-hanim-konagi')
  RETURNING id
)
INSERT INTO venue_details (entity_id, name, address, slug, district, venue_type, instagram_handle, google_maps_phone, claim_status)
SELECT id, 'Mavera Mürüvvet Hanım Konağı', 'Talas, Kayseri', 'mavera-muruvvet-hanim-konagi', 'Talas', 'stage_cafe', 'maveramhk', '0553 695 67 58', 'unclaimed'
FROM e;

-- 8. Heybe Cafe (Canlı Müzik)
WITH e AS (
  INSERT INTO entities (kind)
  SELECT 'venue'
  WHERE NOT EXISTS (SELECT 1 FROM venue_details WHERE slug = 'heybe-cafe-canli-muzik')
  RETURNING id
)
INSERT INTO venue_details (entity_id, name, address, slug, district, venue_type, instagram_handle, google_maps_phone, claim_status)
SELECT id, 'Heybe Cafe (Canlı Müzik)', 'Hunat, Sivas Blv. No:10B, Melikgazi, Kayseri', 'heybe-cafe-canli-muzik', 'Melikgazi', 'stage_cafe', 'heybecafe', NULL, 'unclaimed'
FROM e;

-- 9. M&M Black Rose
WITH e AS (
  INSERT INTO entities (kind)
  SELECT 'venue'
  WHERE NOT EXISTS (SELECT 1 FROM venue_details WHERE slug = 'mm-black-rose')
  RETURNING id
)
INSERT INTO venue_details (entity_id, name, address, slug, district, venue_type, instagram_handle, google_maps_phone, claim_status)
SELECT id, 'M&M Black Rose', 'Kiçi Köy Mah. Ali Saip Paşa Cad. Osmanlı Sok. No:23, Talas, Kayseri', 'mm-black-rose', 'Talas', 'stage_cafe', 'mmblackrose', NULL, 'unclaimed'
FROM e;

-- 10. Roof 11 by Dedeman
WITH e AS (
  INSERT INTO entities (kind)
  SELECT 'venue'
  WHERE NOT EXISTS (SELECT 1 FROM venue_details WHERE slug = 'roof-11-by-dedeman')
  RETURNING id
)
INSERT INTO venue_details (entity_id, name, address, slug, district, venue_type, instagram_handle, google_maps_phone, claim_status)
SELECT id, 'Roof 11 by Dedeman', 'Esentepe Mh. Ahmet Gazi Ayhan Blv. No:161, Melikgazi, Kayseri', 'roof-11-by-dedeman', 'Melikgazi', 'bar', 'roof11kayseri', NULL, 'unclaimed'
FROM e;

-- 11. FiER Roof Restaurant
WITH e AS (
  INSERT INTO entities (kind)
  SELECT 'venue'
  WHERE NOT EXISTS (SELECT 1 FROM venue_details WHERE slug = 'fier-roof-restaurant')
  RETURNING id
)
INSERT INTO venue_details (entity_id, name, address, slug, district, venue_type, instagram_handle, google_maps_phone, claim_status)
SELECT id, 'FiER Roof Restaurant', 'Mimarsinan Mahallesi, Bozantı Cd. No:184, Kocasinan, Kayseri', 'fier-roof-restaurant', 'Kocasinan', 'stage_cafe', 'fierroof.kayseri', '+90 352 333 36 36', 'unclaimed'
FROM e;

-- 12. Piyano Club (İncesu)
WITH e AS (
  INSERT INTO entities (kind)
  SELECT 'venue'
  WHERE NOT EXISTS (SELECT 1 FROM venue_details WHERE slug = 'piyano-club-incesu')
  RETURNING id
)
INSERT INTO venue_details (entity_id, name, address, slug, district, venue_type, instagram_handle, google_maps_phone, claim_status)
SELECT id, 'Piyano Club', 'Süksün Cumhuriyet, Kayseri Kırşehir Yolu, İncesu, Kayseri', 'piyano-club-incesu', 'İncesu', 'club', NULL, '0532 731 59 58', 'unclaimed'
FROM e;

-- 13. Vocal Karaoke Party House
WITH e AS (
  INSERT INTO entities (kind)
  SELECT 'venue'
  WHERE NOT EXISTS (SELECT 1 FROM venue_details WHERE slug = 'vocal-karaoke-party-house')
  RETURNING id
)
INSERT INTO venue_details (entity_id, name, address, slug, district, venue_type, instagram_handle, google_maps_phone, claim_status)
SELECT id, 'Vocal Karaoke Party House', 'Sanayi, Çimen Sk., Kocasinan, Kayseri', 'vocal-karaoke-party-house', 'Kocasinan', 'other', 'karaokevocalkayseri', '0545 104 06 05', 'unclaimed'
FROM e;

-- 14. Piano Karaoke Party House
WITH e AS (
  INSERT INTO entities (kind)
  SELECT 'venue'
  WHERE NOT EXISTS (SELECT 1 FROM venue_details WHERE slug = 'piano-karaoke-party-house')
  RETURNING id
)
INSERT INTO venue_details (entity_id, name, address, slug, district, venue_type, instagram_handle, google_maps_phone, claim_status)
SELECT id, 'Piano Karaoke Party House', 'Yıldırım Beyazıt Mah. Sivas Bulvarı, Optimal AVM No:230, Kayseri', 'piano-karaoke-party-house', NULL, 'other', 'karaokepianokayseri', '0554 496 06 05', 'unclaimed'
FROM e;

-- 15. WİNX Karaoke Salonu
WITH e AS (
  INSERT INTO entities (kind)
  SELECT 'venue'
  WHERE NOT EXISTS (SELECT 1 FROM venue_details WHERE slug = 'winx-karaoke-kayseri')
  RETURNING id
)
INSERT INTO venue_details (entity_id, name, address, slug, district, venue_type, instagram_handle, google_maps_phone, claim_status)
SELECT id, 'WİNX Karaoke Salonu', 'Fevzi Çakmak, Çoruh Cad. 38/A, Kocasinan, Kayseri', 'winx-karaoke-kayseri', 'Kocasinan', 'other', 'winxclupkaraoke', '0530 086 01 38', 'unclaimed'
FROM e;

-- 16. Çamlıca Cafe & Bistro (Canlı Müzik)
WITH e AS (
  INSERT INTO entities (kind)
  SELECT 'venue'
  WHERE NOT EXISTS (SELECT 1 FROM venue_details WHERE slug = 'camlica-cafe-bistro')
  RETURNING id
)
INSERT INTO venue_details (entity_id, name, address, slug, district, venue_type, instagram_handle, google_maps_phone, claim_status)
SELECT id, 'Çamlıca Cafe & Bistro (Canlı Müzik)', 'Tablakaya, Talas, Kayseri', 'camlica-cafe-bistro', 'Talas', 'stage_cafe', 'camlicacafebistro', NULL, 'unclaimed'
FROM e;

-- 17. Erciyes Kültür Merkezi (EKM)
WITH e AS (
  INSERT INTO entities (kind)
  SELECT 'venue'
  WHERE NOT EXISTS (SELECT 1 FROM venue_details WHERE slug = 'erciyes-kultur-merkezi')
  RETURNING id
)
INSERT INTO venue_details (entity_id, name, address, slug, district, venue_type, instagram_handle, google_maps_phone, claim_status)
SELECT id, 'Erciyes Kültür Merkezi (EKM)', 'Köşk, Talas Blv. No:65, Melikgazi, Kayseri', 'erciyes-kultur-merkezi', 'Melikgazi', 'concert_hall', NULL, '+90 352 438 28 28', 'unclaimed'
FROM e;

COMMIT;
