-- Web başvurusu → uygulama arzı köprüsü (Furkan, 2026-09-04:
-- "başvuru onaylanınca uygulamaya otomatik taşınsın").
--
-- Kod tarafı: src/lib/artists/djProfileToArtistProfile.ts (saf eşleme),
-- src/lib/artists/promoteDjProfile.ts (idempotent taşıma),
-- src/app/admin/djler/actions.ts (pending→approved tetiği + toplu taşıma).
--
-- Bu migration ADDITIVE'dir: yeni tablo yok, mevcut kolon/CHECK/RLS
-- DEĞİŞMİYOR. Taşımanın ihtiyaç duyduğu her şey zaten vardı:
--   * dj_profiles.entity_id        → 20260720010642 (nullable FK + index)
--   * artist_profiles.legacy_dj_profile_id → 20260801130000 (+ unique index)
--   * review_status / is_published → 20260801150000 + 20260801160000
-- Eklenen tek şey izleme damgası.

-- Bir başvurunun uygulamaya en son ne zaman taşındığı. Yalnız gözlem/rapor
-- amaçlı — taşımanın idempotensliği bu kolona DEĞİL, artist_profiles'taki
-- entity_id / legacy_dj_profile_id eşleşmesine dayanıyor (kolon uygulanmamış
-- olsa bile taşıma çalışır; promoteDjProfile hatayı yutup uyarı loglar).
ALTER TABLE dj_profiles
  ADD COLUMN IF NOT EXISTS promoted_at timestamptz;

-- "Onaylı ama henüz taşınmamış" başvuruları hızlı süzmek için.
CREATE INDEX IF NOT EXISTS dj_profiles_pending_promotion_idx
  ON dj_profiles (application_status)
  WHERE promoted_at IS NULL;

-- RLS NOTU: dj_profiles'ın mevcut politikaları satır bazlı
-- ("Performer application insert" application_status='pending' ile INSERT,
-- "Performers public read" is_active + approved ile SELECT) — kolon bazlı
-- kısıtlama yok, dolayısıyla yeni kolon için ek politika GEREKMİYOR ve
-- promoted_at anon okumaya açılmıyor: zaten yalnız service_role yazıyor.
-- artist_profiles tarafına hiç dokunulmadı.
