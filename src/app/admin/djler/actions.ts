"use server";

import { requireAdmin } from "@/lib/adminAuth";
import { createServiceClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import type { FocalPoint } from "@/components/admin/FocalPointPicker";
import { sendArtistApprovalNotification } from "@/lib/email";
import { RIDER_TEMPLATES } from "@/lib/riderTypes";
import { bulkPromoteApprovedDjProfiles, promoteDjProfile, type BulkPromoteSummary } from "@/lib/artists/promoteDjProfile";

// Kaydetme sonucu: taşıma (promoteDjProfile) hata verirse ONAY YİNE KAYDEDİLİR,
// hata burada uyarı olarak forma taşınır (bkz. DjForm.tsx) ve loglanır.
export type UpsertDjResult = { promotionWarning?: string };

export async function upsertDj(formData: FormData): Promise<UpsertDjResult> {
  await requireAdmin();
  const supabase = createServiceClient();
  const id = formData.get("id") as string | null;
  let promotionWarning: string | undefined;

  const photos: string[] = JSON.parse((formData.get("photos_json") as string) || "[]");
  const focal_points: Record<string, FocalPoint> = JSON.parse(
    (formData.get("focal_points_json") as string) || "{}"
  );

  const rider: unknown[] = (() => { try { return JSON.parse(formData.get("rider_json") as string ?? "[]"); } catch { return []; } })();

  const concept_tags = (formData.get("concept_tags") as string)
    .split(",").map((t) => t.trim()).filter(Boolean);
  const busy_dates = (formData.get("busy_dates") as string)
    .split(",").map((d) => d.trim()).filter(Boolean);
  const event_types: string[] = JSON.parse((formData.get("event_types_json") as string) || "[]");
  const youtube_links: string[] = JSON.parse((formData.get("youtube_links_json") as string) || "[]");
  const event_type_fees: Record<string, { min: number; max: number }> = (() => {
    try { return JSON.parse((formData.get("event_type_fees_json") as string) || "{}"); } catch { return {}; }
  })();
  const base_fee_min_raw = formData.get("base_fee_min") as string;
  const base_fee_max_raw = formData.get("base_fee_max") as string;
  // Boş bırakılırsa dokunma: yeni kayıt DB default'u ile listenin sonuna düşer
  const sort_order_raw = formData.get("sort_order") as string | null;

  const payload = {
    ...(sort_order_raw !== null && sort_order_raw !== "" ? { sort_order: Number(sort_order_raw) } : {}),
    name: formData.get("name") as string,
    bio: (formData.get("bio") as string) || null,
    performer_type: (formData.get("performer_type") as string) || "dj",
    speciality: (formData.get("speciality") as string) || null,
    city: (formData.get("city") as string) || null,
    soundcloud_url: (formData.get("soundcloud_url") as string) || null,
    mixcloud_url: (formData.get("mixcloud_url") as string) || null,
    youtube_url: (formData.get("youtube_url") as string) || null,
    instagram_url: (formData.get("instagram_url") as string) || null,
    spotify_url: (formData.get("spotify_url") as string) || null,
    website_url: (formData.get("website_url") as string) || null,
    slug: (formData.get("slug") as string) || null,
    rider_url: (formData.get("rider_url") as string) || null,
    rider,
    media_drive_url: (formData.get("media_drive_url") as string) || null,
    base_fee_min: base_fee_min_raw ? Number(base_fee_min_raw) : null,
    base_fee_max: base_fee_max_raw ? Number(base_fee_max_raw) : null,
    event_type_fees,
    application_status: (formData.get("application_status") as string) || "approved",
    repertoire: (formData.get("repertoire") as string) || null,
    email: (formData.get("email") as string) || null,
    phone: (formData.get("phone") as string) || null,
    event_types,
    youtube_links,
    concept_tags,
    busy_dates,
    is_active: formData.get("is_active") === "true",
    photos,
    focal_points,
    photo_url: photos[0] ?? null,
    preview_video_url: (formData.get("preview_video_url") as string) || null,
    videos: (() => { try { return JSON.parse(formData.get("videos_json") as string); } catch { return []; } })(),
  };

  if (id) {
    // Onay durumu değişiyor mu kontrol et
    const { data: prev } = await supabase
      .from("dj_profiles")
      .select("application_status, email, name")
      .eq("id", id)
      .single();

    const { error } = await supabase.from("dj_profiles").update(payload).eq("id", id);
    if (error) {
      if (error.message.includes("photos") || error.message.includes("focal_points") || error.message.includes("base_fee") || error.message.includes("event_type_fees") || error.message.includes("sort_order")) {
        const { photos: _p, focal_points: _fp, base_fee_min: _bmin, base_fee_max: _bmax, event_type_fees: _etf, sort_order: _so, ...safe } = payload;
        const { error: e2 } = await supabase.from("dj_profiles").update(safe).eq("id", id);
        if (e2) throw new Error(e2.message);
      } else {
        throw new Error(error.message);
      }
    }

    // Pending → approved geçişinde sanatçıya mail at
    if (
      prev &&
      prev.application_status === "pending" &&
      payload.application_status === "approved" &&
      prev.email
    ) {
      await sendArtistApprovalNotification({ name: prev.name, email: prev.email });
    }

    // Kurucu kararı (2026-09-04): "başvuru onaylanınca uygulamaya otomatik
    // taşınsın". Onay geçişinde dj_profiles satırı artist_profiles'a taşınır
    // (onaylı + yayında) — noqt Social yalnız o tabloyu görüyor.
    // application_status'u YAZAN TEK YOL bu action (web başvurusu route'u hep
    // 'pending' yazar), bu yüzden tetik burada.
    if (prev && prev.application_status !== "approved" && payload.application_status === "approved") {
      promotionWarning = await promoteSafely(id, payload.name);
    }
  } else {
    // Yeni kayıtta taşıma tetiklenmiyor: burası web başvurusu değil, kurucunun
    // elle eklediği iç kadro kaydı (form varsayılanı zaten 'approved'). Bunları
    // uygulamaya almak bilinçli bir karar — "Onaylı başvuruları uygulamaya taşı"
    // düğmesi (promoteApprovedDjProfiles) hepsini kapsıyor.
    const { error } = await supabase.from("dj_profiles").insert({
      ...payload,
      clerk_id: `admin-${Date.now()}`,
    });
    if (error) {
      if (error.message.includes("photos") || error.message.includes("focal_points") || error.message.includes("base_fee") || error.message.includes("event_type_fees") || error.message.includes("sort_order")) {
        const { photos: _p, focal_points: _fp, base_fee_min: _bmin, base_fee_max: _bmax, event_type_fees: _etf, sort_order: _so, ...safe } = payload;
        const { error: e2 } = await supabase.from("dj_profiles").insert({
          ...safe,
          clerk_id: `admin-${Date.now()}`,
        });
        if (e2) throw new Error(e2.message);
      } else {
        throw new Error(error.message);
      }
    }
  }

  revalidatePath("/admin/djler");
  return promotionWarning ? { promotionWarning } : {};
}

// Taşıma HİÇBİR ZAMAN onayı bloklamaz: hata yalnız loglanır ve panelde uyarı
// olarak gösterilir (toplu taşıma düğmesiyle sonradan tekrar denenebilir).
async function promoteSafely(djProfileId: string, name: string): Promise<string | undefined> {
  try {
    await promoteDjProfile(djProfileId);
    return undefined;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Bilinmeyen hata";
    console.error(`[upsertDj] uygulamaya taşıma başarısız (dj_profiles.id=${djProfileId}, ${name}):`, message);
    return `Onay kaydedildi, ancak sanatçı uygulamaya taşınamadı: ${message} — "Onaylı başvuruları uygulamaya taşı" düğmesiyle tekrar deneyebilirsin.`;
  }
}

// Toplu taşıma (yalnız SAYAR). Kurucu önce kaç kayıt taşınacağını görsün.
export async function countPromotableDjProfiles(): Promise<BulkPromoteSummary> {
  await requireAdmin();
  return bulkPromoteApprovedDjProfiles(false);
}

// Toplu taşıma (uygular). 50'şerlik sayfalarla ilerler, tek satırın hatası
// döngüyü kesmez — özet döner.
export async function promoteApprovedDjProfiles(): Promise<BulkPromoteSummary> {
  await requireAdmin();
  const summary = await bulkPromoteApprovedDjProfiles(true);
  revalidatePath("/admin/djler");
  return summary;
}

// Sanatçıyı görünen listede bir yukarı/aşağı taşır. scopeTypes verilirse
// (ör. Canlı Müzik sekmesi: artist+grup+orkestra) taşıma o alt küme içinde
// yapılır; sort_order global tutulduğu için public sayfadaki sıra da değişir.
export async function moveDj(
  id: string,
  direction: "up" | "down",
  scopeTypes?: string[]
): Promise<{ error?: string }> {
  await requireAdmin();
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("dj_profiles")
    .select("id, performer_type, sort_order")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) {
    return {
      error: error.message.includes("sort_order")
        ? "Sıralama için önce supabase-migration-dj-sort-order.sql migration'ını çalıştırın."
        : error.message,
    };
  }

  const all = data ?? [];
  // Global normalizasyon: 0..n, mevcut görünen sıra korunur
  const updates: PromiseLike<unknown>[] = [];
  all.forEach((row, i) => {
    if (row.sort_order !== i) {
      row.sort_order = i;
      updates.push(supabase.from("dj_profiles").update({ sort_order: i }).eq("id", row.id));
    }
  });
  await Promise.all(updates);

  const subset = scopeTypes?.length
    ? all.filter((r) => scopeTypes.includes(r.performer_type ?? "dj"))
    : all;
  const idx = subset.findIndex((r) => r.id === id);
  if (idx === -1) return { error: "Sanatçı bulunamadı" };
  const other = subset[direction === "up" ? idx - 1 : idx + 1];
  if (!other) return {}; // zaten en başta/sonda

  const current = subset[idx];
  const [a, b] = [current.sort_order, other.sort_order];
  const { error: e1 } = await supabase.from("dj_profiles").update({ sort_order: b }).eq("id", current.id);
  const { error: e2 } = await supabase.from("dj_profiles").update({ sort_order: a }).eq("id", other.id);
  if (e1 || e2) return { error: (e1 ?? e2)!.message };

  revalidatePath("/admin/djler");
  revalidatePath("/sanatcilar");
  return {};
}

export async function deleteDj(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  const supabase = createServiceClient();
  await supabase.from("dj_profiles").delete().eq("id", id);
  revalidatePath("/admin/djler");
}

// Belirtilen performer_type'taki, henüz rider'ı boş olan tüm sanatçılara
// standart şablonu uygular. Zaten rider'ı olanlara dokunmaz (üzerine yazmaz).
export async function applyRiderTemplateToAll(
  performerType: "dj" | "artist"
): Promise<{ updated: number; skipped: number; names: string[] }> {
  await requireAdmin();
  const template = RIDER_TEMPLATES[performerType];
  if (!template) throw new Error("Şablon bulunamadı");

  const supabase = createServiceClient();
  const { data: djs, error } = await supabase
    .from("dj_profiles")
    .select("id, name, rider")
    .eq("performer_type", performerType);
  if (error) throw new Error(error.message);

  let updated = 0;
  let skipped = 0;
  const names: string[] = [];

  for (const dj of djs ?? []) {
    const hasRider = Array.isArray(dj.rider) && dj.rider.length > 0;
    if (hasRider) {
      skipped++;
      continue;
    }
    const { error: updateError } = await supabase
      .from("dj_profiles")
      .update({ rider: template.items })
      .eq("id", dj.id);
    if (!updateError) {
      updated++;
      names.push(dj.name);
    }
  }

  revalidatePath("/admin/djler");
  return { updated, skipped, names };
}
