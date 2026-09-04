"use server";

import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase";
import { requireEntityEditAccess, UUID_RE } from "@/lib/panel/enrichAuth";
import { parsePhotoUrlList, parseVideoUrlList } from "@/lib/panel/media";

// Sahiplenen mekan/sanatçı sahibinin KENDİ profilini düzenlemesi — admin.ts
// içindeki updateVenueAdminAction/updateArtistAdminAction'ın AKSİNE
// requirePanelAdminUser() değil, requireEntityEditAccess() kullanır (admin
// VEYA ilgili entity'nin owner/manager'ı — bkz. enrichAuth.ts).
//
// KASITLI OLARAK DAR KAPSAM (kurucu kararı, 2026-08-07): bu action yalnız
// MEDYA alanlarına (photoUrl, photoUrls, videoUrls) dokunur. name, address,
// is_published, claim_status, review_status gibi alanlar BURADAN
// DEĞİŞTİRİLEMEZ — onlar hâlâ admin onayı gerektiren, itibar/doğruluk
// riski taşıyan alanlar. Sahiplenen kişiye "kendi fotoğraf/videosunu
// yönetme" yetkisi vermek, "profilin görünürlüğünü/temel bilgisini
// değiştirme" yetkisinden AYRI bir güven seviyesi.

const TABLE_BY_KIND = { venue: "venue_details", artist: "artist_profiles" } as const;

export async function updateOwnMediaAction(formData: FormData): Promise<void> {
  const entityId = String(formData.get("entityId") ?? "").trim();
  const kind = String(formData.get("kind") ?? "");

  if (!entityId || !UUID_RE.test(entityId)) throw new Error("Geçersiz profil.");
  if (kind !== "venue" && kind !== "artist") throw new Error("Geçersiz profil türü.");

  const auth = await requireEntityEditAccess(entityId);
  if (!auth.ok) throw new Error(auth.error);

  const photoUrls = parsePhotoUrlList(formData.get("photoUrls"));
  const videoUrls = parseVideoUrlList(formData.get("videoUrls"));

  const update: Record<string, unknown> = { photo_urls: photoUrls, video_urls: videoUrls };
  // Yalnız sanatçıda ayrı bir kapak alanı var (mekanda kapak = galerinin
  // ilk fotoğrafı, bkz. MediaManager kind="venue" davranışı).
  if (kind === "artist") {
    update.photo_url = String(formData.get("photoUrl") ?? "").trim() || null;
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from(TABLE_BY_KIND[kind]).update(update).eq("entity_id", entityId);
  if (error) throw new Error(error.message);

  redirect(`/panel/sahiplen/${kind}/${entityId}?kaydedildi=1`);
}
