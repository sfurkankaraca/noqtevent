-- Etkinlik keşfi V1 — kurucu kürasyon kategorileri (Furkan, 2026-08-01):
-- "verisini çektiğimiz mekanlar potansiyel, onayladıklarım mekanlar,
-- arşivlenenler arşivlenmiş mekanlar olsun."
--
-- review_status yaşam döngüsü:
--   potential — dışarıdan çekilen / hayalet oluşturulan, kurucu henüz incelemedi
--   approved  — kurucu bilgileri doğruladı ("mekanlar" listesi)
--   archived  — kapanmış / kapsam dışı / vazgeçilen
--
-- is_published ile ilişkisi CHECK ile zorlanır: yalnız approved satır
-- yayınlanabilir; arşivlerken is_published=false yazmak ZORUNLUDUR (aksi
-- halde constraint hatası). Claim onay akışı, entity'yi approved'a çeker.
-- Seed satırları varsayılanla potential + gizli doğar.

ALTER TABLE venue_details
  ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'potential'
    CHECK (review_status IN ('potential', 'approved', 'archived'));

ALTER TABLE artist_profiles
  ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'potential'
    CHECK (review_status IN ('potential', 'approved', 'archived'));

-- Yayın yalnız onaylı profillerde (is_published şu an her satırda false —
-- constraint mevcut veriyle geçerli).
ALTER TABLE venue_details
  ADD CONSTRAINT venue_details_publish_requires_approved
    CHECK (NOT is_published OR review_status = 'approved');

ALTER TABLE artist_profiles
  ADD CONSTRAINT artist_profiles_publish_requires_approved
    CHECK (NOT is_published OR review_status = 'approved');

CREATE INDEX IF NOT EXISTS venue_details_review_status_idx
  ON venue_details (review_status);

CREATE INDEX IF NOT EXISTS artist_profiles_review_status_idx
  ON artist_profiles (review_status);
