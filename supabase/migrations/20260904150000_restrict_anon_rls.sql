-- ═══════════════════════════════════════════════════════════════════════════
-- Anon/authenticated erişim yüzeyinin kapatılması
-- Güvenlik taraması 2026-09-04 · BULGU 8 (MEDIUM, VERIFIED)
--   "memory_events/memory_uploads/dj_profiles/invitations/artist_profiles anon
--    SELECT policy'leri; 19 Tem lockdown canlıya uygulanmamış"
-- İlgili bulgular: 1 ve 2 (memory galeri token sızıntısı) — bu migration onları
-- ÇÖZMEZ, yalnız aynı verinin ikinci (PostgREST + anon key) yolunu kapatır.
--
-- ── NEDEN GÜVENLİ: kod hangi rolle okuyor ────────────────────────────────────
-- • src/lib/supabase.ts → createServiceClient() = SUPABASE_SERVICE_ROLE_KEY.
--   Depodaki 150 dosya bunu kullanıyor; kamuya açık site (src/app/page.tsx,
--   /davetiye/[slug], /memory/[slug]/galeri, /journal, /konseptler, /planla,
--   /api/rsvp, /api/memory/upload …) ve panel sorgularının TAMAMI (queries.ts,
--   adminQueries.ts, actions/*) service_role ile okuyor. service_role RLS'i
--   bypass eder → aşağıdaki policy/grant değişiklikleri bu yolları ETKİLEMEZ.
-- • src/lib/panel/supabaseServer.ts → anon key + kullanıcı çerezi (authenticated).
--   Bu client'ı yalnız 3 dosya kullanıyor:
--     - src/app/panel/auth/callback/route.ts  → sadece auth.exchangeCodeForSession
--     - src/lib/panel/actions/auth.ts         → sadece auth.signInWithOtp/verifyOtp
--     - src/lib/panel/actions/onboarding.ts   → TEK tablo erişimi:
--                                               onboarding_surveys INSERT
--   GoTrue (auth şeması) bu migration'dan etkilenmez.
-- • Tarayıcıya giden anon client YOK: NEXT_PUBLIC_SUPABASE_ANON_KEY yalnız
--   supabaseServer.ts'te geçiyor, hiçbir "use client" bileşeninde değil.
-- • ../eventmatch/functions/src/supplySync.ts → SUPABASE_SERVICE_ROLE_KEY
--   secret'ı ile /rest/v1'e gidiyor (satır 83-132). Etkilenmez.
-- • ../noqtbusiness ve ../noqtacademy: pubspec'lerinde supabase paketi YOK,
--   lib/ altındaki "Supabase" geçişleri yalnız yorum. Etkilenmez.
--
-- ── NE YAPIYOR ───────────────────────────────────────────────────────────────
-- 1. TO cümlesi olmayan (= PUBLIC = anon dahil) SELECT/INSERT policy'lerini
--    düşürür. Eski düğün/etkinlik tablolarında tamamen kaldırır; supply/keşif
--    tablolarında 20260801130000'de tasarlanan panel modelini korumak için
--    TO authenticated olarak yeniden kurar.
-- 2. public şemasındaki TÜM tablo ve sequence'lerde anon'dan REVOKE ALL
--    (baseline 1247-1417 arası GRANT ALL ... TO anon veriyordu).
-- 3. authenticated'dan da REVOKE ALL; yalnız policy'si olan panel tablolarına
--    DML geri verilir (GRANT ALL'daki TRUNCATE/REFERENCES/TRIGGER geri gelmez).
-- 4. Gelecekteki tablolar için ALTER DEFAULT PRIVILEGES'tan anon çıkarılır.
-- 5. Savunma amaçlı: RLS'i açık olmayan public tabloları için RLS açılır
--    (rls_auto_enable event trigger'ı dump'ta yok, canlıda var olduğu belirsiz).
--
-- Geri alma: supabase/migrations/_rollback_20260904150000.sql.disabled
-- ═══════════════════════════════════════════════════════════════════════════

-- Not: `supabase db push` her migration dosyasini zaten bir transaction icinde
-- calistirir; asagidaki acik BEGIN/COMMIT ciftinin amaci dosyanin Dashboard >
-- SQL Editor'a yapistirilarak calistirilmasi durumunda da butun-ya-da-hic
-- olmasidir. CLI ile calistirildiginda zararsiz bir "transaction already in
-- progress" uyarisi verir.

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1a. Eski düğün / etkinlik tabloları — PUBLIC policy'ler tamamen kaldırılıyor.
--     Bu tabloların hepsi yalnız service_role ile okunup yazılıyor (yukarıdaki
--     dosya listesi). Kalan policy'ler: baseline'daki "TO service_role" olanlar.
-- ─────────────────────────────────────────────────────────────────────────────

-- memory_events: galeri sayfası service_role ile okuyor (memory/[slug]/page.tsx)
DROP POLICY IF EXISTS "public read active memory events" ON public.memory_events;

-- memory_uploads: USING(true) idi — anon key ile TÜM düğün fotoğrafları.
-- Misafir yükleme /api/memory/upload üzerinden service_role ile yapılıyor.
DROP POLICY IF EXISTS "public read memory uploads"   ON public.memory_uploads;
DROP POLICY IF EXISTS "public insert memory uploads" ON public.memory_uploads;

-- invitations: davetiye PII'si. /davetiye/[slug] service_role ile okuyor.
DROP POLICY IF EXISTS "public read active invitations" ON public.invitations;

-- rsvp_responses: /api/rsvp service_role ile insert ediyor.
DROP POLICY IF EXISTS "public insert rsvp" ON public.rsvp_responses;

-- dj_profiles: e-posta/telefon/ücret kolonları var. Ana sayfa, /planla,
-- /teklif/[slug], sitemap hepsi service_role. Başvuru formu da service_role.
DROP POLICY IF EXISTS "Performers public read"        ON public.dj_profiles;
DROP POLICY IF EXISTS "Performer application insert"  ON public.dj_profiles;

-- Vitrin içerikleri — hepsi sunucuda service_role ile render ediliyor.
DROP POLICY IF EXISTS "Public read"            ON public.concepts;
DROP POLICY IF EXISTS "Public read published"  ON public.journal_posts;
DROP POLICY IF EXISTS "Site assets public read" ON public.site_assets;
DROP POLICY IF EXISTS "Songs public read"      ON public.songs;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1b. Supply / keşif tabloları — PUBLIC policy'ler TO authenticated'a daraltılıyor.
--     20260801130000 bu tablolar için bilinçli bir panel (authenticated) modeli
--     kurdu; onu bozmadan yalnız anon'u dışarıda bırakıyoruz. Bugün panel bu
--     yolu kullanmıyor (service_role), ama model canlı kalsın.
--     Kolon bazlı bir "security_invoker VIEW" KURULMADI: anon ile okuyan hiçbir
--     kod yolu yok, view kurmak kapatılan yüzeyi yeniden açmak olurdu.
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Public read artist_profiles" ON public.artist_profiles;
DROP POLICY IF EXISTS "Authenticated read artist_profiles" ON public.artist_profiles;
CREATE POLICY "Authenticated read artist_profiles" ON public.artist_profiles
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Public read venue_details" ON public.venue_details;
DROP POLICY IF EXISTS "Authenticated read venue_details" ON public.venue_details;
CREATE POLICY "Authenticated read venue_details" ON public.venue_details
  FOR SELECT TO authenticated USING (true);

-- entities: PII taşımayan ince kayıt defteri; PostgREST embed'i için gerekli.
DROP POLICY IF EXISTS "Public read entities" ON public.entities;
DROP POLICY IF EXISTS "Authenticated read entities" ON public.entities;
CREATE POLICY "Authenticated read entities" ON public.entities
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Public read active recurring templates" ON public.event_recurring_templates;
DROP POLICY IF EXISTS "Authenticated read active recurring templates" ON public.event_recurring_templates;
CREATE POLICY "Authenticated read active recurring templates" ON public.event_recurring_templates
  FOR SELECT TO authenticated USING (is_active = true);

DROP POLICY IF EXISTS "Public read confirmed supply_events" ON public.supply_events;
DROP POLICY IF EXISTS "Authenticated read confirmed supply_events" ON public.supply_events;
CREATE POLICY "Authenticated read confirmed supply_events" ON public.supply_events
  FOR SELECT TO authenticated USING (status = 'confirmed');

-- Not: CREATE POLICY'nin IF NOT EXISTS'i yoktur; bu yüzden yukarıda hem eski
-- hem yeni policy adı için DROP IF EXISTS var — dosya idempotenttir.

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. RLS savunma katmanı: public şemasında RLS'i kapalı kalmış tablo varsa aç.
--    service_role RLS'i bypass ettiği için hiçbir kod yolu etkilenmez.
-- ─────────────────────────────────────────────────────────────────────────────
DO $lockdown$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p') AND c.relrowsecurity = false
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.relname);
    RAISE NOTICE 'RLS acildi: public.%', r.relname;
  END LOOP;
END
$lockdown$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. anon: public şemasındaki tüm tablo/sequence yetkileri geri alınıyor.
--    Baseline GRANT ALL ON TABLE ... TO "anon" satırlarının karşılığı.
--    Şema USAGE'ı bilerek bırakılıyor (GoTrue/PostgREST introspection).
-- ─────────────────────────────────────────────────────────────────────────────
DO $lockdown$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.relname, c.relkind
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p', 'v', 'm', 'f')
  LOOP
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon', r.relname);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM authenticated', r.relname);
  END LOOP;

  FOR r IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'S'
  LOOP
    EXECUTE format('REVOKE ALL ON SEQUENCE public.%I FROM anon', r.relname);
    EXECUTE format('REVOKE ALL ON SEQUENCE public.%I FROM authenticated', r.relname);
  END LOOP;
END
$lockdown$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. authenticated'a asgari yetkinin geri verilmesi.
--    Satır filtresi RLS policy'lerinde; buradaki GRANT yalnız "tabloya
--    dokunabilir" kapısıdır. GRANT ALL değil, yalnız DML.
-- ─────────────────────────────────────────────────────────────────────────────

-- TEK gerçek kod yolu: src/lib/panel/actions/onboarding.ts
-- ("Members submit onboarding survey" policy'si zaten auth.uid() ile sınırlı)
GRANT INSERT ON TABLE public.onboarding_surveys TO authenticated;

-- 20260801130000'in panel modeli — bugün kullanılmıyor (panel service_role ile
-- okuyor) ama policy'ler yerinde; grant'siz bırakılsa model sessizce ölürdü.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.entity_members            TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.artist_profiles           TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.venue_details             TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.supply_events             TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.event_recurring_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.auto_approve_rules        TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.claims                    TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.invites                   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.contact_leads             TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.trust_scores              TO authenticated;
GRANT SELECT                          ON TABLE public.entities                 TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Gelecekte eklenecek tablolar otomatik olarak anon'a açılmasın.
--    Baseline 1442/1443 satırlarının geri alınması.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES    FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES    FROM authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM authenticated;

COMMIT;
