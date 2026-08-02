// Google Places — mekan zenginleştirmesi (src/lib/panel/spotify.ts'in mekan
// eşi). eventmatch/functions/src/places-proxy.ts'in AKSİNE burada LEGACY
// Text Search / Place Details / Place Photo uç noktaları kullanılıyor —
// BİLİNÇLİ bir seçim, rastgele değil:
//
//   Bu görev sırasında mevcut GOOGLE_PLACES_API_KEY (eventmatch/.env'de
//   tanımlı, "kurucu daha önce yapmıştık" dediği anahtar) hem Places API (New)
//   `searchText`'e hem de legacy `textsearch/json`'a karşı canlı keşif
//   çağrısıyla denendi:
//     - New API  -> HTTP 403 PERMISSION_DENIED / API_KEY_SERVICE_BLOCKED
//       ("Requests to this API places.googleapis.com method
//       google.maps.places.v1.Places.SearchText are blocked.")
//     - Legacy   -> HTTP 200 OK, place_id/name/formatted_address/rating/
//       user_ratings_total/photos hepsi geldi; Place Details ve Photo API de
//       aynı anahtarla 200 döndü.
//   Google Cloud Console'da yalnız legacy "Places API" etkin, "Places API
//   (New)" DEĞİL — eventmatch/.env'deki yorum ("legacy, New değil") doğru
//   çıktı. Bu yüzden eventmatch/functions/src/places-proxy.ts'in (New API
//   searchText'i çağıran) prod'da da aynı 403'le başarısız olması muhtemel —
//   bu görevin kapsamı dışında, ayrı olarak bildirildi (ayrı düzeltme gerekir).
//
// Anahtar adı eventmatch ile AYNI: GOOGLE_PLACES_API_KEY. Vercel ortamında
// (production/preview) bu değişken HENÜZ TANIMLI DEĞİL — panel bu route'ları
// çağırmadan önce eklenmeli.

const LEGACY_BASE = "https://maps.googleapis.com/maps/api/place";

export interface GooglePlaceCandidate {
  placeId: string;
  name: string;
  address: string | null;
  rating: number | null;
  ratingsTotal: number | null;
  hasPhoto: boolean;
}

export interface GooglePlaceDetails {
  placeId: string;
  name: string;
  address: string | null;
  phone: string | null;
  rating: number | null;
  ratingsTotal: number | null;
  photoReferences: string[];
}

function getApiKey(): string {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) throw new Error("GOOGLE_PLACES_API_KEY tanımlı değil.");
  return key;
}

interface RawTextSearchResult {
  place_id?: unknown;
  name?: unknown;
  formatted_address?: unknown;
  rating?: unknown;
  user_ratings_total?: unknown;
  photos?: unknown;
}

export async function searchGooglePlaces(query: string, limit = 8): Promise<GooglePlaceCandidate[]> {
  const url = new URL(`${LEGACY_BASE}/textsearch/json`);
  url.searchParams.set("query", query);
  url.searchParams.set("language", "tr");
  url.searchParams.set("region", "tr");
  url.searchParams.set("key", getApiKey());

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Google Places arama başarısız: HTTP ${res.status}`);
  const data = await res.json();
  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(`Google Places arama hatası: ${data.status}${data.error_message ? ` — ${data.error_message}` : ""}`);
  }

  const results: RawTextSearchResult[] = Array.isArray(data.results) ? data.results : [];
  return results
    .slice(0, limit)
    .map((r) => ({
      placeId: typeof r.place_id === "string" ? r.place_id : "",
      name: typeof r.name === "string" ? r.name : "",
      address: typeof r.formatted_address === "string" ? r.formatted_address : null,
      rating: typeof r.rating === "number" ? r.rating : null,
      ratingsTotal: typeof r.user_ratings_total === "number" ? r.user_ratings_total : null,
      hasPhoto: Array.isArray(r.photos) && r.photos.length > 0,
    }))
    .filter((p) => p.placeId && p.name);
}

// Google place_id'ler her zaman "ChIJ..." gibi başlamaz (bazı eski/özel
// kayıtlarda farklı önekler olabilir) — bu yüzden geniş ama makul bir karakter
// seti + uzunluk sınırıyla doğrulanıyor, sabit önek aranmıyor.
const PLACE_ID_RE = /^[A-Za-z0-9_-]{10,255}$/;

interface RawPlaceDetailsResult {
  place_id?: unknown;
  name?: unknown;
  formatted_address?: unknown;
  formatted_phone_number?: unknown;
  rating?: unknown;
  user_ratings_total?: unknown;
  photos?: unknown;
}

export async function getGooglePlaceDetails(placeId: string): Promise<GooglePlaceDetails | null> {
  if (!PLACE_ID_RE.test(placeId)) return null;

  const url = new URL(`${LEGACY_BASE}/details/json`);
  url.searchParams.set("place_id", placeId);
  url.searchParams.set(
    "fields",
    "place_id,name,formatted_address,formatted_phone_number,rating,user_ratings_total,photo"
  );
  url.searchParams.set("language", "tr");
  url.searchParams.set("key", getApiKey());

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Google Places detay başarısız: HTTP ${res.status}`);
  const data = await res.json();
  if (data.status !== "OK") return null;

  const r = (data.result ?? {}) as RawPlaceDetailsResult;
  const photos = Array.isArray(r.photos) ? (r.photos as Array<{ photo_reference?: unknown }>) : [];

  return {
    placeId: typeof r.place_id === "string" ? r.place_id : placeId,
    name: typeof r.name === "string" ? r.name : "",
    address: typeof r.formatted_address === "string" ? r.formatted_address : null,
    phone: typeof r.formatted_phone_number === "string" ? r.formatted_phone_number : null,
    rating: typeof r.rating === "number" ? r.rating : null,
    ratingsTotal: typeof r.user_ratings_total === "number" ? r.user_ratings_total : null,
    photoReferences: photos
      .map((p) => (typeof p.photo_reference === "string" ? p.photo_reference : ""))
      .filter(Boolean),
  };
}

// Place Photo API'den SERVER-SIDE indirir — hotlink YASAK, çünkü Google'ın
// foto URL'si `key=` query param'ında API anahtarını taşır (client'a
// sızdırılırsa anahtar herkese açık hale gelir). Yalnız image/* content-type
// kabul edilir; aksi halde null döner.
export async function downloadGooglePlacePhoto(photoReference: string, maxWidth = 1200): Promise<Buffer | null> {
  const url = new URL(`${LEGACY_BASE}/photo`);
  url.searchParams.set("photo_reference", photoReference);
  url.searchParams.set("maxwidth", String(maxWidth));
  url.searchParams.set("key", getApiKey());

  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) return null;
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) return null;
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
