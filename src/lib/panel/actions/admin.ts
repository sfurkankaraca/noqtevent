"use server";

import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase";
import { requirePanelAdminUser } from "@/lib/panel/adminAuth";
import { ENTRY_POLICY_OPTIONS, PERFORMER_TYPE_OPTIONS, VENUE_TYPE_OPTIONS } from "@/lib/panel/format";
import { parsePhotoUrlList, parseVideoUrlList } from "@/lib/panel/media";

// redirectTo alanı formlardan geliyor (mevcut sekme/filtre querystring'ini
// korumak için) — açık yönlendirme riskine karşı yalnız beklenen path'lerle
// başlıyorsa güveniliyor, aksi halde güvenli bir varsayılana düşülüyor.
function safeAdminRedirect(redirectTo: FormDataEntryValue | null, allowedPrefix: string, fallback: string): never {
  const value = String(redirectTo ?? "");
  redirect(value.startsWith(allowedPrefix) ? value : fallback);
}

// Admin kuyruk işlemleri — hepsi requirePanelAdminUser() ile açılıyor (ADMIN_EMAILS
// kapısı, bkz. src/lib/panel/adminAuth.ts). is_admin() SQL zinciri henüz
// bağlanmadığı için RLS'in "Admin full access" politikaları bugün işlemiyor;
// bu action'lar service_role client'la, uygulama katmanındaki bu kontrole
// güvenerek yazıyor.

export async function approveClaimAdminAction(formData: FormData): Promise<void> {
  const admin = await requirePanelAdminUser();
  const claimId = String(formData.get("claimId") ?? "");

  const supabase = createServiceClient();
  const { data: claim, error: claimError } = await supabase
    .from("claims")
    .select("id, entity_id, claimant_user_id, status")
    .eq("id", claimId)
    .maybeSingle();
  if (claimError) throw new Error(claimError.message);
  if (!claim || claim.status !== "pending") throw new Error("Başvuru bekleyen durumda değil.");

  const { data: entity } = await supabase.from("entities").select("kind").eq("id", claim.entity_id).maybeSingle();
  if (!entity) throw new Error("Profil bulunamadı.");

  const { error: memberError } = await supabase.from("entity_members").upsert(
    {
      entity_id: claim.entity_id,
      user_id: claim.claimant_user_id,
      member_role: "owner",
      invited_by: null,
    },
    { onConflict: "entity_id,user_id" }
  );
  if (memberError) throw new Error(memberError.message);

  const table = entity.kind === "venue" ? "venue_details" : "artist_profiles";
  // Claim edilmiş bir profil tanım gereği gerçek/onaylı — review_status'u da
  // 'approved'a çekiyoruz (20260801160000_add_supply_review_status.sql,
  // kurucu talimatı). is_published'a DOKUNULMUYOR: yayınlamak hâlâ ayrı,
  // bilinçli bir admin kararı.
  const { error: profileError } = await supabase
    .from(table)
    .update({ claim_status: "claimed", review_status: "approved" })
    .eq("entity_id", claim.entity_id);
  if (profileError) throw new Error(profileError.message);

  const { error: updateClaimError } = await supabase
    .from("claims")
    .update({ status: "approved", reviewed_by: admin.id, resolved_at: new Date().toISOString() })
    .eq("id", claimId);
  if (updateClaimError) throw new Error(updateClaimError.message);

  await supabase
    .from("invites")
    .update({ claimed_at: new Date().toISOString() })
    .eq("target_entity_id", claim.entity_id)
    .is("claimed_at", null);

  redirect("/panel/admin/claims?islem=onaylandi");
}

export async function rejectClaimAdminAction(formData: FormData): Promise<void> {
  const admin = await requirePanelAdminUser();
  const claimId = String(formData.get("claimId") ?? "");
  const notes = String(formData.get("notes") ?? "").trim().slice(0, 500) || null;

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("claims")
    .update({ status: "rejected", reviewed_by: admin.id, notes, resolved_at: new Date().toISOString() })
    .eq("id", claimId)
    .eq("status", "pending");
  if (error) throw new Error(error.message);

  redirect("/panel/admin/claims?islem=reddedildi");
}

export async function confirmEventAdminAction(formData: FormData): Promise<void> {
  await requirePanelAdminUser();
  const eventId = String(formData.get("eventId") ?? "");

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("supply_events")
    .update({ status: "confirmed" })
    .eq("id", eventId)
    .eq("status", "pending_counterparty");
  if (error) throw new Error(error.message);

  redirect("/panel/admin/etkinlikler?islem=onaylandi");
}

export async function rejectEventAdminAction(formData: FormData): Promise<void> {
  await requirePanelAdminUser();
  const eventId = String(formData.get("eventId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 500) || null;

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("supply_events")
    .update({ status: "rejected", rejected_reason: reason })
    .eq("id", eventId)
    .eq("status", "pending_counterparty");
  if (error) throw new Error(error.message);

  redirect("/panel/admin/etkinlikler?islem=reddedildi");
}

// ── Mekan yönetimi (/panel/admin/mekanlar) ──────────────────────────────────
// Üç sekmeli kürasyon akışı (20260801160000_add_supply_review_status.sql):
// potential → approved → (yayınla/gizle) veya archived. DB CHECK
// (NOT is_published OR review_status = 'approved') yalnız approved satırların
// yayınlanmasına izin verir; arşivlerken is_published=false ile BİRLİKTE,
// tek update çağrısında yazılır (aksi halde constraint hatası fırlar).

export async function approveVenueAdminAction(formData: FormData): Promise<void> {
  await requirePanelAdminUser();
  const entityId = String(formData.get("entityId") ?? "");

  const supabase = createServiceClient();
  const { error } = await supabase.from("venue_details").update({ review_status: "approved" }).eq("entity_id", entityId);
  if (error) throw new Error(error.message);

  safeAdminRedirect(formData.get("redirectTo"), "/panel/admin/mekanlar", "/panel/admin/mekanlar?sekme=approved");
}

export async function archiveVenueAdminAction(formData: FormData): Promise<void> {
  await requirePanelAdminUser();
  const entityId = String(formData.get("entityId") ?? "");

  const supabase = createServiceClient();
  // is_published=false ZORUNLU olarak aynı update'te — constraint bunu ister.
  const { error } = await supabase
    .from("venue_details")
    .update({ review_status: "archived", is_published: false })
    .eq("entity_id", entityId);
  if (error) throw new Error(error.message);

  safeAdminRedirect(formData.get("redirectTo"), "/panel/admin/mekanlar", "/panel/admin/mekanlar?sekme=archived");
}

export async function restoreVenueAdminAction(formData: FormData): Promise<void> {
  await requirePanelAdminUser();
  const entityId = String(formData.get("entityId") ?? "");
  const target = String(formData.get("target") ?? "");
  if (target !== "potential" && target !== "approved") throw new Error("Geçersiz hedef durum.");

  const supabase = createServiceClient();
  const { error } = await supabase.from("venue_details").update({ review_status: target }).eq("entity_id", entityId);
  if (error) throw new Error(error.message);

  safeAdminRedirect(formData.get("redirectTo"), "/panel/admin/mekanlar", `/panel/admin/mekanlar?sekme=${target}`);
}

export async function toggleVenuePublishedAction(formData: FormData): Promise<void> {
  await requirePanelAdminUser();
  const entityId = String(formData.get("entityId") ?? "");
  const nextValue = formData.get("nextValue") === "true";

  const supabase = createServiceClient();
  // Yayına almayı yalnız approved satırlarla sınırlıyoruz (gizlemek her zaman
  // serbest) — UI zaten toggle'ı yalnız approved sekmesinde gösteriyor, bu
  // ikinci bir savunma katmanı. Satır dönmezse (approved değilse) sessizce
  // yutmak yerine açıkça hataya düşürüyoruz.
  let q = supabase.from("venue_details").update({ is_published: nextValue }).eq("entity_id", entityId);
  if (nextValue) q = q.eq("review_status", "approved");
  const { data, error } = await q.select("entity_id");
  if (error) throw new Error(error.message);
  if (nextValue && (!data || data.length === 0)) {
    throw new Error("Yalnız onaylı mekanlar yayınlanabilir.");
  }

  safeAdminRedirect(formData.get("redirectTo"), "/panel/admin/mekanlar", "/panel/admin/mekanlar?sekme=approved");
}

export async function updateVenueAdminAction(formData: FormData): Promise<void> {
  await requirePanelAdminUser();
  const entityId = String(formData.get("entityId") ?? "");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Mekan adı zorunlu.");

  const address = String(formData.get("address") ?? "").trim() || null;
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase() || null;
  const district = String(formData.get("district") ?? "").trim() || null;
  const instagramHandle = String(formData.get("instagramHandle") ?? "").trim().replace(/^@/, "") || null;
  const googleMapsPhone = String(formData.get("googleMapsPhone") ?? "").trim() || null;

  const venueTypeRaw = String(formData.get("venueType") ?? "").trim();
  if (venueTypeRaw && !(VENUE_TYPE_OPTIONS as readonly string[]).includes(venueTypeRaw)) {
    throw new Error("Geçersiz mekan türü.");
  }
  const venueType = venueTypeRaw || null;

  const entryPolicyRaw = String(formData.get("entryPolicy") ?? "").trim();
  if (entryPolicyRaw && !(ENTRY_POLICY_OPTIONS as readonly string[]).includes(entryPolicyRaw)) {
    throw new Error("Geçersiz giriş politikası.");
  }
  const entryPolicy = entryPolicyRaw || null;

  const capacityRaw = String(formData.get("capacity") ?? "").trim();
  let capacity: number | null = null;
  if (capacityRaw) {
    capacity = Number.parseInt(capacityRaw, 10);
    if (!Number.isFinite(capacity) || capacity < 0) throw new Error("Geçersiz kapasite.");
  }

  const photoUrls = parsePhotoUrlList(formData.get("photoUrls"));
  // Video URL'leri, MediaManager istemci tarafında zaten youtube/vimeo'ya
  // kısıtlıyor (bkz. src/components/panel/MediaManager.tsx) — burada aynı
  // kural sunucu tarafında TEKRAR uygulanıyor (asıl güvenlik sınırı).
  const videoUrls = parseVideoUrlList(formData.get("videoUrls"));

  const update: Record<string, unknown> = {
    name,
    address,
    slug,
    district,
    venue_type: venueType,
    capacity,
    entry_policy: entryPolicy,
    instagram_handle: instagramHandle,
    google_maps_phone: googleMapsPhone,
    photo_urls: photoUrls,
    video_urls: videoUrls,
  };

  // is_published yalnız form bu alanı editable olarak sunduysa (marker ile
  // işaretli — bkz. edit sayfası) gövdeye dahil edilir; review_status'u bu
  // action DEĞİŞTİRMEZ (onayla/arşivle ayrı, kasıtlı action'lar).
  if (formData.get("isPublishedEditable") === "true") {
    update.is_published = formData.get("isPublished") === "on";
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("venue_details").update(update).eq("entity_id", entityId);
  if (error) throw new Error(error.message);

  // "listRedirectTo" liste sekmesine dönüş linkini taşır (kaydet sonrası
  // KALDIĞIMIZ sayfa yine düzenleme formu — kurucu art arda alan düzeltebilsin);
  // "redirectTo" alanıyla karıştırılmasın diye ayrı isim (o alan diğer
  // action'larda ANINDA yönlendirme hedefi anlamına geliyor).
  const listRedirectTo = String(formData.get("listRedirectTo") ?? "");
  const back = listRedirectTo.startsWith("/panel/admin/mekanlar") ? `&redirectTo=${encodeURIComponent(listRedirectTo)}` : "";
  redirect(`/panel/admin/mekanlar/${entityId}?kaydedildi=1${back}`);
}

// ── Sanatçı yönetimi (/panel/admin/sanatcilar) ──────────────────────────────
// Aynı desen — bkz. yukarıdaki mekan action'larının yorumları.

export async function approveArtistAdminAction(formData: FormData): Promise<void> {
  await requirePanelAdminUser();
  const entityId = String(formData.get("entityId") ?? "");

  const supabase = createServiceClient();
  const { error } = await supabase.from("artist_profiles").update({ review_status: "approved" }).eq("entity_id", entityId);
  if (error) throw new Error(error.message);

  safeAdminRedirect(formData.get("redirectTo"), "/panel/admin/sanatcilar", "/panel/admin/sanatcilar?sekme=approved");
}

export async function archiveArtistAdminAction(formData: FormData): Promise<void> {
  await requirePanelAdminUser();
  const entityId = String(formData.get("entityId") ?? "");

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("artist_profiles")
    .update({ review_status: "archived", is_published: false })
    .eq("entity_id", entityId);
  if (error) throw new Error(error.message);

  safeAdminRedirect(formData.get("redirectTo"), "/panel/admin/sanatcilar", "/panel/admin/sanatcilar?sekme=archived");
}

export async function restoreArtistAdminAction(formData: FormData): Promise<void> {
  await requirePanelAdminUser();
  const entityId = String(formData.get("entityId") ?? "");
  const target = String(formData.get("target") ?? "");
  if (target !== "potential" && target !== "approved") throw new Error("Geçersiz hedef durum.");

  const supabase = createServiceClient();
  const { error } = await supabase.from("artist_profiles").update({ review_status: target }).eq("entity_id", entityId);
  if (error) throw new Error(error.message);

  safeAdminRedirect(formData.get("redirectTo"), "/panel/admin/sanatcilar", `/panel/admin/sanatcilar?sekme=${target}`);
}

export async function toggleArtistPublishedAction(formData: FormData): Promise<void> {
  await requirePanelAdminUser();
  const entityId = String(formData.get("entityId") ?? "");
  const nextValue = formData.get("nextValue") === "true";

  const supabase = createServiceClient();
  let q = supabase.from("artist_profiles").update({ is_published: nextValue }).eq("entity_id", entityId);
  if (nextValue) q = q.eq("review_status", "approved");
  const { data, error } = await q.select("entity_id");
  if (error) throw new Error(error.message);
  if (nextValue && (!data || data.length === 0)) {
    throw new Error("Yalnız onaylı sanatçılar yayınlanabilir.");
  }

  safeAdminRedirect(formData.get("redirectTo"), "/panel/admin/sanatcilar", "/panel/admin/sanatcilar?sekme=approved");
}

export async function updateArtistAdminAction(formData: FormData): Promise<void> {
  await requirePanelAdminUser();
  const entityId = String(formData.get("entityId") ?? "");

  const displayName = String(formData.get("displayName") ?? "").trim();
  if (!displayName) throw new Error("Sanatçı adı zorunlu.");

  const bio = String(formData.get("bio") ?? "").trim() || null;
  const photoUrl = String(formData.get("photoUrl") ?? "").trim() || null;
  const photoUrls = parsePhotoUrlList(formData.get("photoUrls"));
  const videoUrls = parseVideoUrlList(formData.get("videoUrls"));
  const city = String(formData.get("city") ?? "").trim() || null;

  const performerTypeRaw = String(formData.get("performerType") ?? "").trim();
  if (!(PERFORMER_TYPE_OPTIONS as readonly string[]).includes(performerTypeRaw)) {
    throw new Error("Geçersiz sanatçı türü.");
  }

  const genres = String(formData.get("genres") ?? "")
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean);

  const links: Record<string, string> = {};
  const instagram = String(formData.get("linkInstagram") ?? "").trim();
  const spotify = String(formData.get("linkSpotify") ?? "").trim();
  const youtube = String(formData.get("linkYoutube") ?? "").trim();
  const soundcloud = String(formData.get("linkSoundcloud") ?? "").trim();
  if (instagram) links.instagram = instagram;
  if (spotify) links.spotify = spotify;
  if (youtube) links.youtube = youtube;
  if (soundcloud) links.soundcloud = soundcloud;

  const update: Record<string, unknown> = {
    display_name: displayName,
    bio,
    photo_url: photoUrl,
    photo_urls: photoUrls,
    video_urls: videoUrls,
    city,
    performer_type: performerTypeRaw,
    genres,
    links,
  };

  if (formData.get("isPublishedEditable") === "true") {
    update.is_published = formData.get("isPublished") === "on";
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("artist_profiles").update(update).eq("entity_id", entityId);
  if (error) throw new Error(error.message);

  const listRedirectTo = String(formData.get("listRedirectTo") ?? "");
  const back = listRedirectTo.startsWith("/panel/admin/sanatcilar") ? `&redirectTo=${encodeURIComponent(listRedirectTo)}` : "";
  redirect(`/panel/admin/sanatcilar/${entityId}?kaydedildi=1${back}`);
}
