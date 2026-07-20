-- NOQT — M2 Security Batch: close anon-key public write/read exposure
-- Supabase Dashboard > SQL Editor'da çalıştır
--
-- Bulgular: songs, inquiries, site_assets, invitations, rsvp_responses, memory_events,
-- memory_uploads tablolarındaki "service role" politikaları `TO service_role` olmadan
-- tanımlanmış — Postgres'te bu, politikanın PUBLIC'e (anon dahil) uygulanması demektir.
-- Kodda anon client hiç kullanılmıyor (grep ile doğrulandı), yani bu düzeltme hiçbir
-- uygulama davranışını değiştirmez, sadece dışarıdan (PostgREST + anon key) erişimi kapatır.
--
-- dj_profiles ve partner_profiles bu listede DEĞİL — incelemede bu ikisinin politikalarının
-- zaten doğru şekilde kısıtlı olduğu görüldü (public read yalnızca is_active+approved,
-- public insert yalnızca application_status='pending' başvuru formu için).
--
-- Referans: docs/AUDIT.md §3, §9.1 · docs/SOFTWARE_ARCHITECTURE.md §4 adım 1 (M2)

-- ── songs ────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Service role full access songs" ON songs;
CREATE POLICY "Service role full access songs" ON songs
  TO service_role USING (true) WITH CHECK (true);

-- ── inquiries ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Service role full access inquiries" ON inquiries;
CREATE POLICY "Service role full access inquiries" ON inquiries
  TO service_role USING (true) WITH CHECK (true);

-- ── site_assets ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Service role full access site_assets" ON site_assets;
CREATE POLICY "Service role full access site_assets" ON site_assets
  TO service_role USING (true) WITH CHECK (true);

-- ── invitations ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "service full invitations" ON invitations;
CREATE POLICY "service full invitations" ON invitations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── rsvp_responses ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "service full rsvp" ON rsvp_responses;
CREATE POLICY "service full rsvp" ON rsvp_responses
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── memory_events ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "service full memory events" ON memory_events;
CREATE POLICY "service full memory events" ON memory_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── memory_uploads ───────────────────────────────────────────────────────────
-- Not: "public read memory uploads" (galeri için anon SELECT) ve "public insert
-- memory uploads" (misafir yükleme formu) politikaları kasıtlı olarak PUBLIC kalır,
-- bu migration'da dokunulmuyor — yalnızca aşırı yetkili "service full" politikası
-- service_role'e kısıtlanıyor.
DROP POLICY IF EXISTS "service full memory uploads" ON memory_uploads;
CREATE POLICY "service full memory uploads" ON memory_uploads
  FOR ALL TO service_role USING (true) WITH CHECK (true);
