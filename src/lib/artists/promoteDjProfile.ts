// Onaylanan web başvurusunu (dj_profiles) uygulama arzına (artist_profiles)
// taşır. Saf eşleme djProfileToArtistProfile.ts'te; burası yan etkili yarı:
// entities kaydı, slug çakışma çözümü, idempotens ve service_role yazımı.
//
// Yetki: BU DOSYA KENDİ BAŞINA YETKİ KONTROLÜ YAPMAZ — service_role client'la
// çalışır ve yalnız requireAdmin() geçmiş server action'lardan çağrılır
// (src/app/admin/djler/actions.ts). Repo genelindeki desen bu.

import { createServiceClient } from "@/lib/supabase";
import { slugify } from "@/lib/panel/slug";
import {
  djProfileToArtistProfile,
  pickUniqueArtistSlug,
  type DjProfileRowForArtist,
} from "./djProfileToArtistProfile";

// Eşlemede gereken alanlar + entity bağı. E-posta/telefon BİLEREK seçilmiyor.
const DJ_SELECT =
  "id,name,bio,city,performer_type,speciality,repertoire,concept_tags,photos,photo_url," +
  "videos,youtube_links,instagram_url,spotify_url,soundcloud_url,website_url,youtube_url," +
  "entity_id,application_status";

export type PromoteResult = {
  /** created: yeni artist_profiles satırı; updated: mevcut satır yayına alındı;
   *  skipped: zaten onaylı+yayında, hiçbir şey yazılmadı. */
  outcome: "created" | "updated" | "skipped";
  artistEntityId: string;
};

type DjRow = DjProfileRowForArtist & { entity_id: string | null; application_status: string };

/**
 * Verilen dj_profiles id'si için idempotent taşıma.
 *
 * - dj_profiles.entity_id yoksa entities'te 'person' kaydı açar ve bağlar.
 * - Aynı entity_id (ya da legacy_dj_profile_id) ile artist_profiles satırı
 *   VARSA yalnız review_status/is_published alanları approved/true'ya çekilir —
 *   diğer alanlara DOKUNULMAZ (kurucu panelden düzenlemiş olabilir; medya ve
 *   Spotify zenginleştirmesi de o satırda yaşıyor).
 * - Yoksa insert.
 */
export async function promoteDjProfile(djProfileId: string): Promise<PromoteResult> {
  const supabase = createServiceClient();

  const { data: dj, error: djError } = await supabase
    .from("dj_profiles")
    .select(DJ_SELECT)
    .eq("id", djProfileId)
    .maybeSingle<DjRow>();
  if (djError) throw new Error(djError.message);
  if (!dj) throw new Error("Başvuru bulunamadı.");

  // entity bağı: yoksa kur. (20260720010642 — dj_profiles.entity_id nullable FK)
  let entityId = dj.entity_id;
  if (!entityId) {
    // Bu başvuru daha önce taşınmış olabilir (entity_id yazımı yarıda kalmışsa):
    // legacy_dj_profile_id köprüsünden geri bul, boşuna ikinci entity açma.
    const { data: legacyRow, error: legacyError } = await supabase
      .from("artist_profiles")
      .select("entity_id")
      .eq("legacy_dj_profile_id", dj.id)
      .maybeSingle<{ entity_id: string }>();
    if (legacyError) throw new Error(legacyError.message);

    if (legacyRow) {
      entityId = legacyRow.entity_id;
    } else {
      const { data: entity, error: entityError } = await supabase
        .from("entities")
        .insert({ kind: "person" })
        .select("id")
        .single<{ id: string }>();
      if (entityError) throw new Error(entityError.message);
      entityId = entity.id;
    }

    const { error: linkError } = await supabase
      .from("dj_profiles")
      .update({ entity_id: entityId })
      .eq("id", dj.id);
    if (linkError) throw new Error(linkError.message);
  }

  const { data: existing, error: existingError } = await supabase
    .from("artist_profiles")
    .select("entity_id,review_status,is_published")
    .eq("entity_id", entityId)
    .maybeSingle<{ entity_id: string; review_status: string; is_published: boolean }>();
  if (existingError) throw new Error(existingError.message);

  if (existing) {
    if (existing.review_status === "approved" && existing.is_published) {
      await markPromoted(supabase, dj.id);
      return { outcome: "skipped", artistEntityId: entityId };
    }
    // Yalnız yayın bayrakları. CHECK artist_profiles_publish_requires_approved
    // ikisinin birlikte yazılmasını zaten zorunlu kılıyor.
    const { error } = await supabase
      .from("artist_profiles")
      .update({ review_status: "approved", is_published: true })
      .eq("entity_id", entityId);
    if (error) throw new Error(error.message);
    await markPromoted(supabase, dj.id);
    return { outcome: "updated", artistEntityId: entityId };
  }

  const slug = await resolveArtistSlug(supabase, dj.name);
  const payload = djProfileToArtistProfile(dj, { entityId, slug });

  const { error: insertError } = await supabase.from("artist_profiles").insert(payload);
  if (insertError) throw new Error(insertError.message);

  await markPromoted(supabase, dj.id);
  return { outcome: "created", artistEntityId: entityId };
}

type ServiceClient = ReturnType<typeof createServiceClient>;

// artist_profiles.slug NOT NULL + UNIQUE. Mevcut uniqueSlug() rastgele hex ek
// kullanıyor; burada kurucunun istediği okunur biçim (-2, -3) tercih edildi —
// başvuru slug'ı uygulamada görünür bir kimlik. Aynı önekle başlayan slug'lar
// çekilip pickUniqueArtistSlug() ile çakışmasız olan seçiliyor.
async function resolveArtistSlug(supabase: ServiceClient, name: string): Promise<string> {
  const base = slugify(name);
  const { data, error } = await supabase
    .from("artist_profiles")
    .select("slug")
    .like("slug", `${base}%`);
  if (error) throw new Error(error.message);
  return pickUniqueArtistSlug(base, (data ?? []).map((r: { slug: string }) => r.slug));
}

// promoted_at yalnız izleme/raporlama için (bkz. migration
// 20260904120000_add_dj_profile_promotion_link.sql). Kolon henüz uygulanmamış
// olabileceği için hata YUTULUYOR: taşımanın kendisi başarılı, damga şart değil.
async function markPromoted(supabase: ServiceClient, djProfileId: string): Promise<void> {
  const { error } = await supabase
    .from("dj_profiles")
    .update({ promoted_at: new Date().toISOString() })
    .eq("id", djProfileId);
  if (error) {
    console.warn("[promoteDjProfile] promoted_at yazılamadı (migration uygulandı mı?):", error.message);
  }
}

export type BulkPromoteSummary = {
  /** Taşınacak (application_status='approved' ama artist_profiles karşılığı yok) başvuru sayısı. */
  pending: number;
  created: number;
  updated: number;
  skipped: number;
  failed: { id: string; name: string; message: string }[];
};

const BULK_PAGE_SIZE = 50;

/**
 * application_status='approved' olup uygulamada karşılığı olmayan başvuruları
 * listeler. `apply=false` yalnız SAYAR (kurucu önce görsün), `apply=true`
 * 50'şerlik sayfalarla taşır. Tek bir satırın hatası döngüyü kesmez.
 */
export async function bulkPromoteApprovedDjProfiles(apply: boolean): Promise<BulkPromoteSummary> {
  const supabase = createServiceClient();

  const { data: approved, error } = await supabase
    .from("dj_profiles")
    .select("id,name,entity_id")
    .eq("application_status", "approved")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);

  const rows = (approved ?? []) as { id: string; name: string; entity_id: string | null }[];

  // Karşılığı olanları tek sorguda ele: entity_id VEYA legacy_dj_profile_id
  // eşleşmesi "uygulamada zaten var" demek.
  const { data: artists, error: artistError } = await supabase
    .from("artist_profiles")
    .select("entity_id,legacy_dj_profile_id,review_status,is_published");
  if (artistError) throw new Error(artistError.message);

  const publishedEntityIds = new Set<string>();
  const publishedLegacyIds = new Set<string>();
  for (const a of (artists ?? []) as {
    entity_id: string;
    legacy_dj_profile_id: string | null;
    review_status: string;
    is_published: boolean;
  }[]) {
    if (a.review_status !== "approved" || !a.is_published) continue;
    publishedEntityIds.add(a.entity_id);
    if (a.legacy_dj_profile_id) publishedLegacyIds.add(a.legacy_dj_profile_id);
  }

  const todo = rows.filter(
    (r) => !publishedLegacyIds.has(r.id) && !(r.entity_id && publishedEntityIds.has(r.entity_id))
  );

  const summary: BulkPromoteSummary = {
    pending: todo.length,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: [],
  };
  if (!apply) return summary;

  for (let i = 0; i < todo.length; i += BULK_PAGE_SIZE) {
    for (const row of todo.slice(i, i + BULK_PAGE_SIZE)) {
      try {
        const res = await promoteDjProfile(row.id);
        if (res.outcome === "created") summary.created++;
        else if (res.outcome === "updated") summary.updated++;
        else summary.skipped++;
      } catch (e) {
        summary.failed.push({
          id: row.id,
          name: row.name,
          message: e instanceof Error ? e.message : "Bilinmeyen hata",
        });
      }
    }
  }

  return summary;
}
