import { NextRequest, NextResponse } from "next/server";
import { requireEntityEditAccess, UUID_RE } from "@/lib/panel/enrichAuth";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { createServiceClient } from "@/lib/supabase";
import { getGooglePlaceDetails, downloadGooglePlacePhoto } from "@/lib/panel/googlePlaces";

export const runtime = "nodejs";

// Kürasyon akışında bir mekana bağlanacak Google fotoğrafı üst sınırı —
// maliyet/kota (Places Photo API her indirmede ayrı faturalanır).
const MAX_PHOTOS = 6;
const PLACE_ID_RE = /^[A-Za-z0-9_-]{10,255}$/;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { ok: withinLimit } = rateLimit(ip, "panel-enrich-venue-google-apply", { max: 20, windowMs: 60_000 });
  if (!withinLimit) {
    return NextResponse.json({ error: "Çok fazla istek. Lütfen bekleyin." }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const entityId = String((body as Record<string, unknown>).entityId ?? "").trim();
  const placeId = String((body as Record<string, unknown>).placeId ?? "").trim();

  if (!entityId || !UUID_RE.test(entityId)) {
    return NextResponse.json({ error: "Geçersiz entityId." }, { status: 400 });
  }
  if (!placeId || !PLACE_ID_RE.test(placeId)) {
    return NextResponse.json({ error: "Geçersiz placeId." }, { status: 400 });
  }

  const auth = await requireEntityEditAccess(entityId);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const details = await getGooglePlaceDetails(placeId).catch((error) => {
    console.error("Panel Google Places detay hatası:", error);
    return null;
  });
  if (!details) return NextResponse.json({ error: "Google Places mekanı bulunamadı." }, { status: 502 });

  const supabase = createServiceClient();
  const { data: current, error: fetchError } = await supabase
    .from("venue_details")
    .select("address, google_maps_phone, photo_urls")
    .eq("entity_id", entityId)
    .maybeSingle();
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  if (!current) return NextResponse.json({ error: "Mekan bulunamadı." }, { status: 404 });

  // Fotoğraflar — en fazla MAX_PHOTOS, SABİT yollara ({entityId}/gp-{i}.jpg)
  // server-side indirilip Supabase Storage'a yüklenir. upsert:true olduğu
  // için aynı mekanı tekrar "Uygula" ile çalıştırmak mevcut dosyaların
  // ÜZERİNE yazar — yeni bir obje oluşturmaz, bu da mükerrer indirmeyi/depoyu
  // önler. Hotlink YASAK: Google'ın foto URL'si API anahtarını query param'da
  // taşır, doğrudan client'a/DB'ye yazılamaz.
  const uploadedUrls: string[] = [];
  const refs = details.photoReferences.slice(0, MAX_PHOTOS);
  for (let i = 0; i < refs.length; i++) {
    try {
      const buffer = await downloadGooglePlacePhoto(refs[i], 1200);
      if (!buffer) continue;
      const path = `${entityId}/gp-${i}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(path, buffer, { contentType: "image/jpeg", upsert: true });
      if (uploadError) {
        console.error(`Panel Google foto yükleme hatası (${path}):`, uploadError);
        continue;
      }
      const { data: urlData } = supabase.storage.from("images").getPublicUrl(path);
      uploadedUrls.push(urlData.publicUrl);
    } catch (error) {
      console.error(`Panel Google foto indirme hatası (ref index ${i}):`, error);
    }
  }

  // Mevcut galeriyi KORU — yalnız önceki Google indirmelerinin (gp-N) yerini
  // yeni indirilenlerle değiştir, kurucunun elle yüklediği fotoğraflara
  // dokunma. Hiç yeni foto indirilemediyse (hepsi hata verdiyse) galeriye
  // dokunulmaz.
  const existingUrls: string[] = Array.isArray(current.photo_urls) ? current.photo_urls : [];
  const gpMarker = `/${entityId}/gp-`;
  const keptUrls = existingUrls.filter((u) => !u.includes(gpMarker));
  const mergedPhotoUrls = uploadedUrls.length > 0 ? [...keptUrls, ...uploadedUrls] : existingUrls;

  const update: Record<string, unknown> = {
    google_place_id: details.placeId,
    google_rating: details.rating,
    google_ratings_total: details.ratingsTotal,
    enriched_at: new Date().toISOString(),
    photo_urls: mergedPhotoUrls,
  };
  // Kurucunun elle girdiği adres/telefonu EZME — yalnız hâlâ boşsa doldur
  // (spotify-apply route'undaki photo_url kuralıyla AYNI mantık).
  if (!current.address && details.address) update.address = details.address;
  if (!current.google_maps_phone && details.phone) update.google_maps_phone = details.phone;

  const { error: updateError } = await supabase.from("venue_details").update(update).eq("entity_id", entityId);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ ok: true, details, photosApplied: uploadedUrls.length });
}
