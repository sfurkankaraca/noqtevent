-- Etkinlik keşfi V1 — yayın bayrağı (kurucu kürasyon akışı).
--
-- Gerekçe (Furkan, 2026-08-01): seed edilen mekan/sanatçı profilleri önce
-- GİZLİ gelir; kurucu panelden bilgileri düzenleyip bilinçli olarak yayınlar
-- ("görünür hale getireceğim ya da gizleyeceğim"). Ayrıca noqt.events'in
-- mevcut venue_details satırlarının uygulama projeksiyonuna İSTENMEDEN
-- sızmasını da önler: yayın varsayılan olarak KAPALI, açmak bilinçli karar.
--
-- Sync worker (eventmatch/functions/src/supplySync.ts) yalnız
-- is_published=true satırları projekte eder; unpublish edilen satır aktif
-- kümeden düşer ve worker'ın mutabakat adımı Firestore kopyasını siler.
--
-- RLS değişmez: mevcut owner/manager update politikaları bu kolonu da kapsar
-- (claim'li mekan sahibi kendi profilini gizleyebilir — bilinçli tercih).

ALTER TABLE venue_details
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false;

ALTER TABLE artist_profiles
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS venue_details_is_published_idx
  ON venue_details (is_published) WHERE is_published = true;

CREATE INDEX IF NOT EXISTS artist_profiles_is_published_idx
  ON artist_profiles (is_published) WHERE is_published = true;
