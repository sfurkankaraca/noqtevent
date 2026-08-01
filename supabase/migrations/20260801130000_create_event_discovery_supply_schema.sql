-- Etkinlik keşfi V1 — arz şeması (adım 1/N).
-- Tasarım: ~/noqt/eventmatch/docs/ETKINLIK_KESIF_V1_TASARIM.md (§3 backend mimarisi,
--          §3.2 durum makinesi, §3.5 güven/kota)
--          ~/noqt/eventmatch/docs/SANATCI_MEKAN_ARZ_PLANI.md (§2 mevcut şema, §4 veri modeli)
--
-- Kapsam: yalnız Supabase şeması (arz doğruluk kaynağı). Firestore projeksiyonu,
-- panel UI ve sync worker sonraki adımlar. Bu migration additive'dir — mevcut
-- hiçbir tablo/kolon silinmez veya davranışı bozulmaz; dj_profiles DOKUNULMAZ
-- (artist_profiles onun genellemesi olarak yeni kurulur; ileride veri taşımak
-- için artist_profiles.legacy_dj_profile_id köprü kolonu eklendi).
--
-- Kimlik modeli 20260720004631_create_identity_registry.sql'deki entities/roles
-- üzerine kurulur. entity_members burada YENİ: panelde "kim hangi entity'yi
-- yönetiyor" sorusunu cevaplayan rol tablosu (roles tablosundan farklı — roles
-- ürün geneli yetkilendirme, entity_members tek bir entity'nin ekip yönetimi).
--
-- Panel kimlik doğrulaması Supabase Auth ile yapılacağı için (TASARIM §4.4),
-- auth.users burada ilk kez FK hedefi olarak kullanılıyor.

-- ── yardımcı fonksiyonlar ────────────────────────────────────────────────────

-- Admin kontrolü mevcut roles tablosu deseniyle (role='admin', product='events')
-- kurulur. Supabase Auth kullanıcısını entities/roles kimlik zincirine bağlamak
-- için credentials tablosuna provider='supabase' satırı gerekir — bu satırlar
-- BUGÜN yazılmıyor (panel/auth entegrasyonu henüz kurulmadı). Yani bu fonksiyon
-- şimdilik hep false döner ve admin erişimi fiilen yalnız service_role'den
-- geçer — GÜVENLİ TARAF (kapalı) ama panel admin ekranı için credentials
-- yazımı ayrı bir iş kalemi. Bkz. final rapor.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM credentials c
    JOIN roles r ON r.entity_id = c.entity_id
    WHERE c.provider = 'supabase'
      AND c.provider_user_id = auth.uid()::text
      AND r.role = 'admin'
      AND r.product = 'events'
      AND r.revoked_at IS NULL
  );
$$;

-- ── entity_members ───────────────────────────────────────────────────────────
-- Panel ekip yönetimi: bir entity'yi (sanatçı VEYA mekan — venue_details.entity_id
-- de dahil, çünkü mekan panelinde Sahip/Yönetici/Personel modeli venue entity'sinin
-- kendisi üzerinden işler) kim hangi yetkiyle yönetiyor. roles tablosundan farklı:
-- roles ürün geneli bir yetkilendirme (ör. 'artist' rolü events ürününde),
-- entity_members tek bir entity'nin operasyonel ekip listesidir.
CREATE TABLE entity_members (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id    uuid NOT NULL REFERENCES entities (id),
  user_id      uuid NOT NULL REFERENCES auth.users (id),
  member_role  text NOT NULL CHECK (member_role IN ('owner', 'manager', 'staff')),
  invited_by   uuid REFERENCES auth.users (id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_id, user_id)
);

CREATE INDEX entity_members_entity_id_idx ON entity_members (entity_id);
CREATE INDEX entity_members_user_id_idx ON entity_members (user_id);

-- Bir kullanıcının verilen entity için belirtilen rollerden birine sahip
-- panel üyesi olup olmadığını söyler. SECURITY DEFINER: entity_members'ın
-- kendi RLS'i "yalnız kendi satırını gör" olduğu için, başka bir üyenin
-- (örn. owner'ın) satırını politika değerlendirmesi sırasında görebilmek
-- gerekir — tanımlayıcı rol (postgres, tablo sahibi) RLS'i doğal olarak
-- bypass eder, döngüsel RLS sorunu oluşmaz.
CREATE OR REPLACE FUNCTION public.is_entity_member(p_entity_id uuid, p_roles text[])
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM entity_members em
    WHERE em.entity_id = p_entity_id
      AND em.user_id = auth.uid()
      AND em.member_role = ANY (p_roles)
  );
$$;

ALTER TABLE entity_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read own membership rows" ON entity_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_entity_member(entity_id, ARRAY['owner', 'manager']));

-- Owner: ekibin tamamını (owner dahil) ekleyip/çıkarabilir.
CREATE POLICY "Owners manage all members" ON entity_members
  FOR ALL TO authenticated
  USING (public.is_entity_member(entity_id, ARRAY['owner']))
  WITH CHECK (public.is_entity_member(entity_id, ARRAY['owner']));

-- Manager: yalnız 'staff' rolüyle yeni üye davet edebilir (owner/manager
-- satırlarına dokunamaz — o yetki yalnız owner'da).
CREATE POLICY "Managers invite staff" ON entity_members
  FOR INSERT TO authenticated
  WITH CHECK (member_role = 'staff' AND public.is_entity_member(entity_id, ARRAY['manager']));

CREATE POLICY "Admin full access entity_members" ON entity_members
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Service role full access entity_members" ON entity_members
  TO service_role USING (true) WITH CHECK (true);

-- ── artist_profiles ──────────────────────────────────────────────────────────
-- dj_profiles'ın genellemesi: performer_type artık DJ'e özel değil (canlı grup/
-- solist/akustik de var), claim/rol sistemi entity_members üzerinden çalışır.
-- dj_profiles BOZULMADI — iki tablo bir süre paralel yaşayacak. legacy_dj_profile_id
-- ileride tek seferlik bir taşıma script'inin eşleştirme anahtarı olsun diye var;
-- bugün hiçbir satır doldurmuyor.
CREATE TABLE artist_profiles (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id             uuid NOT NULL,
  -- Sanatçı bir kişi VEYA bir grup/kurumsal proje (organization) olabilir —
  -- venue_details'in aksine tek bir kind'e kilitli değil.
  entity_kind           text NOT NULL CHECK (entity_kind IN ('person', 'organization')),
  slug                  text NOT NULL,
  display_name          text NOT NULL,
  bio                   text,
  photo_url             text,
  city                  text,
  genres                text[] NOT NULL DEFAULT '{}',
  performer_type        text NOT NULL DEFAULT 'dj' CHECK (performer_type IN ('dj', 'band', 'solo', 'acoustic', 'other')),
  -- {instagram, spotify, youtube, soundcloud}
  links                 jsonb NOT NULL DEFAULT '{}',
  spotify_artist_id     text,
  youtube_channel_id    text,
  claim_status          text NOT NULL DEFAULT 'unclaimed' CHECK (claim_status IN ('unclaimed', 'pending', 'claimed', 'verified')),
  managed_by_manager    boolean NOT NULL DEFAULT false,
  legacy_dj_profile_id  uuid REFERENCES dj_profiles (id),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (entity_id, entity_kind) REFERENCES entities (id, kind),
  UNIQUE (entity_id),
  UNIQUE (slug)
);

CREATE INDEX artist_profiles_city_idx ON artist_profiles (city);
CREATE UNIQUE INDEX artist_profiles_legacy_dj_profile_id_idx
  ON artist_profiles (legacy_dj_profile_id) WHERE legacy_dj_profile_id IS NOT NULL;

CREATE TRIGGER artist_profiles_updated_at
  BEFORE UPDATE ON artist_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE artist_profiles ENABLE ROW LEVEL SECURITY;

-- Herkese açık dizin — claim edilmemiş profiller de görünür ("bu sanatçı sen
-- misin?" CTA'sı bunun üzerine kurulur, TASARIM §1).
CREATE POLICY "Public read artist_profiles" ON artist_profiles
  FOR SELECT USING (true);

CREATE POLICY "Owners and managers write artist_profiles" ON artist_profiles
  FOR INSERT TO authenticated
  WITH CHECK (public.is_entity_member(entity_id, ARRAY['owner', 'manager']));

CREATE POLICY "Owners and managers update artist_profiles" ON artist_profiles
  FOR UPDATE TO authenticated
  USING (public.is_entity_member(entity_id, ARRAY['owner', 'manager']))
  WITH CHECK (public.is_entity_member(entity_id, ARRAY['owner', 'manager']));

CREATE POLICY "Owners delete artist_profiles" ON artist_profiles
  FOR DELETE TO authenticated
  USING (public.is_entity_member(entity_id, ARRAY['owner']));

CREATE POLICY "Admin full access artist_profiles" ON artist_profiles
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Service role full access artist_profiles" ON artist_profiles
  TO service_role USING (true) WITH CHECK (true);

-- ── venue_details genişletmesi ───────────────────────────────────────────────
-- created_at/updated_at zaten mevcut (20260720004631) — burada eklenmiyor.
-- Tüm yeni kolonlar additive + IF NOT EXISTS; mevcut satırlar NULL/varsayılanla
-- dolar, hiçbir mevcut sorgu bozulmaz.
ALTER TABLE venue_details
  ADD COLUMN IF NOT EXISTS slug                text,
  ADD COLUMN IF NOT EXISTS district             text,
  ADD COLUMN IF NOT EXISTS venue_type           text CHECK (venue_type IN ('bar', 'club', 'stage_cafe', 'concert_hall', 'other')),
  ADD COLUMN IF NOT EXISTS capacity             integer,
  ADD COLUMN IF NOT EXISTS entry_policy         text CHECK (entry_policy IN ('free', 'door_fee', 'reservation')),
  ADD COLUMN IF NOT EXISTS instagram_handle     text,
  ADD COLUMN IF NOT EXISTS google_maps_phone    text,
  ADD COLUMN IF NOT EXISTS photo_urls           text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS claim_status         text NOT NULL DEFAULT 'unclaimed' CHECK (claim_status IN ('unclaimed', 'pending', 'claimed', 'verified'));

CREATE UNIQUE INDEX IF NOT EXISTS venue_details_slug_unique_idx
  ON venue_details (slug) WHERE slug IS NOT NULL;

-- venue_details'te daha önce updated_at trigger'ı yoktu (kolon vardı, trigger
-- eksikti) — burada tamamlanıyor, davranış değişikliği yalnız bu: artık
-- updated_at otomatik güncellenecek.
CREATE TRIGGER venue_details_updated_at
  BEFORE UPDATE ON venue_details
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- venue_details bugüne kadar HİÇBİR RLS politikası olmadan yalnız service_role'e
-- açıktı (RLS auto-enable ile kapalı, policy'siz = herkese kapalı). Bu migration
-- ile kamuya açık okuma İLK KEZ ekleniyor — mekan keşif yüzeyi bunu gerektiriyor
-- (TASARIM §2), ama bu mevcut tablonun erişim yüzeyini genişleten bir karar,
-- gözden geçirilmeli.
CREATE POLICY "Public read venue_details" ON venue_details
  FOR SELECT USING (true);

CREATE POLICY "Owners and managers write venue_details" ON venue_details
  FOR INSERT TO authenticated
  WITH CHECK (public.is_entity_member(entity_id, ARRAY['owner', 'manager']));

CREATE POLICY "Owners and managers update venue_details" ON venue_details
  FOR UPDATE TO authenticated
  USING (public.is_entity_member(entity_id, ARRAY['owner', 'manager']))
  WITH CHECK (public.is_entity_member(entity_id, ARRAY['owner', 'manager']));

CREATE POLICY "Owners delete venue_details" ON venue_details
  FOR DELETE TO authenticated
  USING (public.is_entity_member(entity_id, ARRAY['owner']));

CREATE POLICY "Admin full access venue_details" ON venue_details
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Service role full access venue_details" ON venue_details
  TO service_role USING (true) WITH CHECK (true);

-- entities tablosu PII taşımaz ("Thin registry ... No business data lives
-- here" — 20260720004631 yorumu); artist_profiles/venue_details'i PostgREST
-- embed'iyle (ör. entities!inner(kind)) okuyabilmek için buraya da herkese
-- açık okuma ekleniyor. Bu da mevcut tablonun erişim yüzeyini genişletiyor —
-- kapsam dışı görülüyorsa (panel/uygulama entities'i hiç client'tan okumayacaksa)
-- bu politika geri alınabilir, zarar veren bir veri içermiyor.
CREATE POLICY "Public read entities" ON entities
  FOR SELECT USING (true);

-- ── event_recurring_templates ────────────────────────────────────────────────
-- "Her çarşamba jazz gecesi" gibi tekrarlayan etkinlik şablonları. supply_events
-- bu şablondan üretilen somut örnekleri recurring_template_id ile referanslar.
CREATE TABLE event_recurring_templates (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_entity_id        uuid NOT NULL REFERENCES venue_details (entity_id),
  artist_entity_id       uuid REFERENCES artist_profiles (entity_id),
  title                  text NOT NULL,
  -- Postgres EXTRACT(DOW) kuralı: 0 = Pazar ... 6 = Cumartesi.
  weekday                integer NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time             time NOT NULL,
  end_time               time,
  event_kind             text NOT NULL DEFAULT 'dj' CHECK (event_kind IN ('live_music', 'dj', 'karaoke', 'quiz', 'theme_night', 'other')),
  genres                 text[] NOT NULL DEFAULT '{}',
  is_active              boolean NOT NULL DEFAULT true,
  created_by_entity_id   uuid NOT NULL REFERENCES entities (id),
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX event_recurring_templates_venue_entity_id_idx ON event_recurring_templates (venue_entity_id);

CREATE TRIGGER event_recurring_templates_updated_at
  BEFORE UPDATE ON event_recurring_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE event_recurring_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active recurring templates" ON event_recurring_templates
  FOR SELECT USING (is_active = true);

CREATE POLICY "Venue members manage recurring templates" ON event_recurring_templates
  FOR ALL TO authenticated
  USING (public.is_entity_member(venue_entity_id, ARRAY['owner', 'manager']))
  WITH CHECK (public.is_entity_member(venue_entity_id, ARRAY['owner', 'manager']));

CREATE POLICY "Admin full access recurring templates" ON event_recurring_templates
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Service role full access recurring templates" ON event_recurring_templates
  TO service_role USING (true) WITH CHECK (true);

-- ── supply_events ─────────────────────────────────────────────────────────────
-- Durum makinesi TASARIM §3.2 + §3.3'ün REVİZE hâli: 'published_unilateral' AYRI
-- bir status DEĞİL. pending_counterparty durumundaki bir etkinlik, oluşturanın
-- kendi profilinde "onay bekleniyor" ibaresiyle görünür — ama bu görünürlük
-- kararı projeksiyon/uygulama katmanının işi. Burada yalnız status +
-- created_by_entity_id/created_by_side var; "kimin nerede gördüğü" mantığı
-- RLS'e gömülmedi (bkz. aşağıdaki RLS notu).
CREATE TABLE supply_events (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title                    text NOT NULL,
  venue_entity_id          uuid NOT NULL REFERENCES venue_details (entity_id),
  -- Postgres dizi kolonlarında native FK yok; sanatçı referans bütünlüğü
  -- uygulama/servis katmanında (panel API) enforce edilir.
  artist_entity_ids        uuid[] NOT NULL DEFAULT '{}',
  start_at                 timestamptz NOT NULL,
  end_at                   timestamptz,
  city                     text NOT NULL,
  district                 text,
  genres                   text[] NOT NULL DEFAULT '{}',
  entry_policy             text CHECK (entry_policy IN ('free', 'door_fee', 'reservation')),
  price_text               text,
  description              text,
  event_kind               text NOT NULL DEFAULT 'dj' CHECK (event_kind IN ('live_music', 'dj', 'karaoke', 'quiz', 'theme_night', 'other')),
  status                   text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_counterparty', 'confirmed', 'rejected', 'expired', 'cancelled')),
  created_by_entity_id     uuid NOT NULL REFERENCES entities (id),
  created_by_side          text NOT NULL CHECK (created_by_side IN ('artist', 'venue', 'organizer')),
  counterparty_entity_id   uuid REFERENCES entities (id),
  confirmed_at             timestamptz,
  rejected_reason          text,
  recurring_template_id    uuid REFERENCES event_recurring_templates (id) ON DELETE SET NULL,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX supply_events_city_start_at_idx ON supply_events (city, start_at);
CREATE INDEX supply_events_status_idx ON supply_events (status);
CREATE INDEX supply_events_venue_entity_id_idx ON supply_events (venue_entity_id);
CREATE INDEX supply_events_created_by_entity_id_idx ON supply_events (created_by_entity_id);
CREATE INDEX supply_events_counterparty_entity_id_idx ON supply_events (counterparty_entity_id);

CREATE TRIGGER supply_events_updated_at
  BEFORE UPDATE ON supply_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE supply_events ENABLE ROW LEVEL SECURITY;

-- Herkese açık: yalnız confirmed. pending_counterparty'nin "oluşturanın kendi
-- profilinde onay bekleniyor ibaresiyle görünmesi" kuralı BURADA uygulanmıyor —
-- panel/projeksiyon katmanı service_role ile okuyup kendi filtresini uygular
-- (TASARIM §3.3: "bu görünürlük kuralı projeksiyon katmanının işi").
CREATE POLICY "Public read confirmed supply_events" ON supply_events
  FOR SELECT USING (status = 'confirmed');

-- Panel tarafı: oluşturan veya karşı taraf entity'sinin owner/manager/staff'ı
-- kendi (bekleyen dahil) etkinliklerini görebilir.
CREATE POLICY "Members read own side supply_events" ON supply_events
  FOR SELECT TO authenticated
  USING (
    public.is_entity_member(created_by_entity_id, ARRAY['owner', 'manager', 'staff'])
    OR (counterparty_entity_id IS NOT NULL AND public.is_entity_member(counterparty_entity_id, ARRAY['owner', 'manager', 'staff']))
  );

-- Etkinlik ekleme günlük operasyon — staff da ekleyebilir.
CREATE POLICY "Members create supply_events" ON supply_events
  FOR INSERT TO authenticated
  WITH CHECK (public.is_entity_member(created_by_entity_id, ARRAY['owner', 'manager', 'staff']));

-- Güncelleme: oluşturan taraf (düzeltme) veya karşı taraf (onay/red) —
-- durum makinesinin GEÇERLİ geçişleri (örn. draft'tan doğrudan confirmed'e
-- atlanamaz) burada enforce EDİLMİYOR; bu panel API/servis katmanının işi.
CREATE POLICY "Members update own side supply_events" ON supply_events
  FOR UPDATE TO authenticated
  USING (
    public.is_entity_member(created_by_entity_id, ARRAY['owner', 'manager', 'staff'])
    OR (counterparty_entity_id IS NOT NULL AND public.is_entity_member(counterparty_entity_id, ARRAY['owner', 'manager', 'staff']))
  )
  WITH CHECK (
    public.is_entity_member(created_by_entity_id, ARRAY['owner', 'manager', 'staff'])
    OR (counterparty_entity_id IS NOT NULL AND public.is_entity_member(counterparty_entity_id, ARRAY['owner', 'manager', 'staff']))
  );

CREATE POLICY "Owners delete supply_events" ON supply_events
  FOR DELETE TO authenticated
  USING (public.is_entity_member(created_by_entity_id, ARRAY['owner', 'manager']));

CREATE POLICY "Admin full access supply_events" ON supply_events
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Service role full access supply_events" ON supply_events
  TO service_role USING (true) WITH CHECK (true);

-- ── supply_events durum makinesi koruması (güvenlik incelemesi eki) ──────────
-- RLS taraf üyeliğini kontrol ediyor ama kolon seviyesinde ayrım yapamıyor:
-- onsuz, oluşturan tarafın staff üyesi bile satırı doğrudan 'confirmed'e
-- çekebilirdi — karşılıklı onay mekanizması delinirdi (v2 denetimindeki
-- kural-katmanı derslerinin birebir karşılığı). Bu trigger:
--   1. Geçiş grafiğini zorlar (draft→pending, pending→confirmed/rejected/
--      expired/cancelled, confirmed→cancelled; draft→cancelled).
--   2. confirmed/rejected/expired geçişlerini YALNIZ sunucuya (service_role,
--      onay-token/panel API akışı) ve admin'e bırakır — istemci onayı
--      DB seviyesinde imkânsızdır.
--   3. INSERT'te istemcinin 'confirmed' doğmuş etkinlik yaratmasını engeller.
--   4. Taraf/kimlik alanlarını oluşturma sonrası değişmez kılar.
--   5. confirmed_at'i sunucu geçişinde otomatik damgalar.
CREATE OR REPLACE FUNCTION public.supply_events_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  is_privileged boolean := (auth.role() = 'service_role' OR public.is_admin());
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NOT is_privileged AND NEW.status NOT IN ('draft', 'pending_counterparty') THEN
      RAISE EXCEPTION 'supply_events: yeni etkinlik yalnız draft/pending_counterparty durumunda oluşturulabilir';
    END IF;
    IF NOT is_privileged THEN
      NEW.confirmed_at := NULL;
    END IF;
    RETURN NEW;
  END IF;

  IF NOT is_privileged AND (
       NEW.created_by_entity_id   IS DISTINCT FROM OLD.created_by_entity_id
    OR NEW.created_by_side        IS DISTINCT FROM OLD.created_by_side
    OR NEW.counterparty_entity_id IS DISTINCT FROM OLD.counterparty_entity_id
  ) THEN
    RAISE EXCEPTION 'supply_events: taraf alanları oluşturma sonrası değiştirilemez';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NOT (
         (OLD.status = 'draft' AND NEW.status IN ('pending_counterparty', 'cancelled'))
      OR (OLD.status = 'pending_counterparty' AND NEW.status IN ('confirmed', 'rejected', 'expired', 'cancelled'))
      OR (OLD.status = 'confirmed' AND NEW.status = 'cancelled')
    ) THEN
      RAISE EXCEPTION 'supply_events: geçersiz durum geçişi: % -> %', OLD.status, NEW.status;
    END IF;

    IF NEW.status IN ('confirmed', 'rejected', 'expired') AND NOT is_privileged THEN
      RAISE EXCEPTION 'supply_events: % durumuna geçiş yalnız sunucu (onay akışı) tarafından yapılabilir', NEW.status;
    END IF;

    IF NEW.status = 'confirmed' AND NEW.confirmed_at IS NULL THEN
      NEW.confirmed_at := now();
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER supply_events_guard
  BEFORE INSERT OR UPDATE ON supply_events
  FOR EACH ROW EXECUTE FUNCTION public.supply_events_guard();

-- ── claims ────────────────────────────────────────────────────────────────────
-- Profil sahiplenme başvuruları (IG DM kod / telefon kod / elle / YouTube OAuth
-- — TASARIM §0.7, §3.4). Yalnız service_role + admin: başvuru akışı panel API'si
-- (service_role) üzerinden yürür, kullanıcı tarafı doğrudan Supabase client'la
-- yazmaz — istismar/kod tahmin riskini API katmanında (rate limit vb.) yönetiriz.
CREATE TABLE claims (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id          uuid NOT NULL REFERENCES entities (id),
  claimant_user_id   uuid NOT NULL REFERENCES auth.users (id),
  method             text NOT NULL CHECK (method IN ('ig_dm_code', 'phone_code', 'manual', 'youtube_oauth')),
  code               text,
  -- Kodun gönderildiği RESMİ kanalın tanımı (ör. "instagram:@mekanadi",
  -- "phone:+905..."), başvuranın verdiği iletişim DEĞİL (bkz. contact_leads).
  code_sent_to       text,
  status             text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by        uuid REFERENCES auth.users (id),
  notes              text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  resolved_at        timestamptz
);

CREATE INDEX claims_entity_id_status_idx ON claims (entity_id, status);

ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access claims" ON claims
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Service role full access claims" ON claims
  TO service_role USING (true) WITH CHECK (true);

-- ── invites ───────────────────────────────────────────────────────────────────
-- Davet/dönüşüm hunisi ölçümü (gönderildi → tıklandı → claim edildi). sent_to
-- iletişim kanalı bilgisi taşıdığı için (claims.code_sent_to gibi) yalnız
-- service_role + admin — huni istatistikleri panelde AGREGE (sayı) olarak
-- gösterilecek, ham satırlar client'a hiç dönmeyecek.
CREATE TABLE invites (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_entity_id   uuid NOT NULL REFERENCES entities (id),
  invited_via        text NOT NULL CHECK (invited_via IN ('sms', 'whatsapp', 'ig', 'email')),
  sent_to            text NOT NULL,
  sent_at            timestamptz NOT NULL DEFAULT now(),
  clicked_at         timestamptz,
  claimed_at         timestamptz,
  related_event_id   uuid REFERENCES supply_events (id) ON DELETE SET NULL,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX invites_target_entity_id_idx ON invites (target_entity_id);

ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access invites" ON invites
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Service role full access invites" ON invites
  TO service_role USING (true) WITH CHECK (true);

-- ── contact_leads ─────────────────────────────────────────────────────────────
-- KVKK-izole iletişim bilgileri. En sıkı RLS: entity'nin kendi owner/manager'ı
-- BİLE okuyamaz — yalnız service_role + admin (istekten daha da katı olması
-- gerekmiyor, tam olarak istendiği gibi). Bu tablo hiçbir sync worker/Firestore
-- projeksiyonu tarafından OKUNMAYACAK (worker kodu bu satırı ayrıca ele almalı —
-- şema seviyesinde garanti edilemez, yalnız burada not düşülüyor).
CREATE TABLE contact_leads (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id              uuid NOT NULL REFERENCES entities (id),
  contact_name           text,
  contact_phone          text,
  contact_email          text,
  is_business_contact    boolean NOT NULL DEFAULT false,
  provided_by_user_id    uuid REFERENCES auth.users (id),
  -- v1'de tek değer; yeni amaç eklenirse CHECK genişletilir.
  purpose                text NOT NULL DEFAULT 'claim_invite' CHECK (purpose = 'claim_invite'),
  created_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX contact_leads_entity_id_idx ON contact_leads (entity_id);

ALTER TABLE contact_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access contact_leads" ON contact_leads
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Service role full access contact_leads" ON contact_leads
  TO service_role USING (true) WITH CHECK (true);

-- ── approval_tokens ───────────────────────────────────────────────────────────
-- Hesapsız tek kullanımlık onay linkleri (TASARIM §3.4). Ham token DB'ye asla
-- yazılmaz — yalnız hash. Doğrulama server route'unda (service_role) yapılır;
-- client'ın bu tabloyu hiç görmemesi gerekir, bu yüzden authenticated policy
-- bile eklenmedi (admin dahil — incelemek gerekirse service_role ile yapılır).
CREATE TABLE approval_tokens (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supply_event_id    uuid NOT NULL REFERENCES supply_events (id) ON DELETE CASCADE,
  token_hash         text NOT NULL,
  -- v1'de tek eylem; yeni kapsam eklenirse CHECK genişletilir.
  action_scope       text NOT NULL DEFAULT 'confirm_event' CHECK (action_scope = 'confirm_event'),
  sent_to_channel    text,
  expires_at         timestamptz NOT NULL,
  used_at            timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX approval_tokens_token_hash_idx ON approval_tokens (token_hash);
CREATE INDEX approval_tokens_supply_event_id_idx ON approval_tokens (supply_event_id);

ALTER TABLE approval_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access approval_tokens" ON approval_tokens
  TO service_role USING (true) WITH CHECK (true);

-- ── auto_approve_rules ───────────────────────────────────────────────────────
-- "Bu mekandan/sanatçıdan gelenleri otomatik onayla" (TASARIM §1, §2). Yalnız
-- ilgili entity'nin owner/manager'ı kendi kurallarını yönetir.
CREATE TABLE auto_approve_rules (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id              uuid NOT NULL REFERENCES entities (id),
  trusted_entity_id      uuid NOT NULL REFERENCES entities (id),
  created_by_user_id     uuid NOT NULL REFERENCES auth.users (id),
  created_at             timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_id, trusted_entity_id)
);

CREATE INDEX auto_approve_rules_entity_id_idx ON auto_approve_rules (entity_id);

ALTER TABLE auto_approve_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners and managers manage auto_approve_rules" ON auto_approve_rules
  FOR ALL TO authenticated
  USING (public.is_entity_member(entity_id, ARRAY['owner', 'manager']))
  WITH CHECK (public.is_entity_member(entity_id, ARRAY['owner', 'manager']));

CREATE POLICY "Admin full access auto_approve_rules" ON auto_approve_rules
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Service role full access auto_approve_rules" ON auto_approve_rules
  TO service_role USING (true) WITH CHECK (true);

-- ── trust_scores ──────────────────────────────────────────────────────────────
-- Gizli güven puanı (TASARIM §3.5). Entity sahibi BİLE göremez — yalnız
-- service_role + admin (aynen istendiği gibi: "Gizli, yalnız admin/service okur").
CREATE TABLE trust_scores (
  entity_id   uuid PRIMARY KEY REFERENCES entities (id),
  score       integer NOT NULL DEFAULT 0,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trust_scores_updated_at
  BEFORE UPDATE ON trust_scores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE trust_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access trust_scores" ON trust_scores
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Service role full access trust_scores" ON trust_scores
  TO service_role USING (true) WITH CHECK (true);

-- ── onboarding_surveys ───────────────────────────────────────────────────────
-- Claim sonrası opsiyonel dert anketi (TASARIM §2.7): yol haritası + lead
-- sinyali. Cevaplar serbest metin iş bilgisi içerebilir → okuma yalnız
-- service_role + admin (panelde lead etiketi olarak yüzeye çıkar). Yazma:
-- ilgili entity'nin owner/manager'ı, yalnız kendi adına (created_by_user_id
-- = auth.uid() şartı — başkası adına anket doldurulamaz).
CREATE TABLE onboarding_surveys (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id            uuid NOT NULL REFERENCES entities (id),
  role_side            text NOT NULL CHECK (role_side IN ('venue', 'artist', 'manager')),
  answers              jsonb NOT NULL DEFAULT '{}',
  created_by_user_id   uuid NOT NULL REFERENCES auth.users (id),
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX onboarding_surveys_entity_id_idx ON onboarding_surveys (entity_id);

ALTER TABLE onboarding_surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members submit onboarding survey" ON onboarding_surveys
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by_user_id = auth.uid()
    AND public.is_entity_member(entity_id, ARRAY['owner', 'manager'])
  );

CREATE POLICY "Admin full access onboarding_surveys" ON onboarding_surveys
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Service role full access onboarding_surveys" ON onboarding_surveys
  TO service_role USING (true) WITH CHECK (true);
