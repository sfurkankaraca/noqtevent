// Web başvurusu (dj_profiles) → uygulama arzı (artist_profiles) SAF eşlemesi.
//
// Gerekçe (Furkan, 2026-09-04): "başvuru onaylanınca uygulamaya otomatik
// taşınsın". Web'deki sanatçı başvurusu dj_profiles'a yazılıyor
// (src/app/api/basvuru/route.ts), noqt Social uygulaması ise yalnız
// artist_profiles'ın review_status='approved' + is_published=true satırlarını
// görüyor (eventmatch/functions/src/supplySync.ts). İki tablo arasında köprü
// yoktu — bu dosya o köprünün saf/deterministik yarısı.
//
// TASARIM KURALI: bu dosyada YAN ETKİ YOK, import YOK. Böylece `node --test`
// tip-soyma ile doğrudan çalıştırabiliyor (repoda test aracı yok) ve eşleme
// mantığı DB'ye dokunmadan doğrulanabiliyor. Slug ÜRETİMİ çağırana bırakıldı
// (bkz. pickUniqueArtistSlug + promoteDjProfile.ts): mevcut slugify()
// yardımcısı @/lib/panel/slug içinde ve import etmek bu dosyanın saflığını
// bozardı.
//
// GİZLİLİK: dj_profiles.email ve dj_profiles.phone ASLA taşınmaz.
// artist_profiles herkese açık okunabilir ("Public read artist_profiles" RLS
// politikası) ve uygulama projeksiyonuna aynen düşer.

/** Eşlemede kullanılan dj_profiles alanları (tam satır değil, yalnız gerekli olanlar). */
export type DjProfileRowForArtist = {
  id: string;
  name: string;
  bio?: string | null;
  city?: string | null;
  performer_type?: string | null;
  speciality?: string | null;
  repertoire?: string | null;
  concept_tags?: string[] | null;
  photos?: string[] | null;
  photo_url?: string | null;
  videos?: string[] | null;
  youtube_links?: string[] | null;
  instagram_url?: string | null;
  spotify_url?: string | null;
  soundcloud_url?: string | null;
  website_url?: string | null;
  youtube_url?: string | null;
};

/** artist_profiles insert gövdesi (20260801130000 + 150000/160000 + 090000 migration'ları). */
export type ArtistProfileInsert = {
  entity_id: string;
  entity_kind: "person";
  slug: string;
  display_name: string;
  bio: string | null;
  city: string | null;
  performer_type: ArtistPerformerType;
  genres: string[];
  photo_url: string | null;
  photo_urls: string[];
  video_urls: string[];
  links: ArtistLinks;
  spotify_artist_id: string | null;
  claim_status: "unclaimed";
  review_status: "approved";
  is_published: true;
  legacy_dj_profile_id: string;
};

export type ArtistPerformerType = "dj" | "band" | "solo" | "acoustic" | "other";

// artist_profiles.links şemadaki yorumda {instagram, spotify, youtube, soundcloud}
// olarak tanımlı; website kurucu isteğiyle EKLENDİ. links jsonb ve uygulama
// tarafında ham nesne olarak taşınıyor (supplySync: plainObject(row,"links")),
// fazladan anahtar hiçbir tüketiciyi bozmaz.
export type ArtistLinks = Partial<
  Record<"instagram" | "spotify" | "youtube" | "soundcloud" | "website", string>
>;

// dj_profiles.performer_type sözlüğü (src/lib/performerTypes.ts, 9 değer) ile
// artist_profiles.performer_type CHECK'i (5 değer) AYNI DEĞİL — burada eşleniyor:
//   artist (solo sanatçı) → solo
//   trio/grup/bando/orkestra → band (hepsi çok kişilik canlı topluluk)
//   dance/host/moderator → other (müzisyen değil; "acoustic" yanıltıcı olurdu)
// "acoustic" web tarafında hiç üretilmiyor, bu yüzden hedefte kullanılmıyor.
const PERFORMER_TYPE_MAP: Record<string, ArtistPerformerType> = {
  dj: "dj",
  artist: "solo",
  trio: "band",
  grup: "band",
  bando: "band",
  orkestra: "band",
  dance: "other",
  host: "other",
  moderator: "other",
};

export function mapPerformerType(raw: string | null | undefined): ArtistPerformerType {
  return PERFORMER_TYPE_MAP[(raw ?? "").trim().toLowerCase()] ?? "other";
}

/**
 * Spotify sanatçı linkinden id ayıklar.
 * Desteklenen biçimler: https://open.spotify.com/artist/<id>[?si=...],
 * https://open.spotify.com/intl-tr/artist/<id>, spotify:artist:<id>.
 * Çıkarılamıyorsa null (uydurma yapılmaz — panel "Spotify'dan doldur" akışı
 * ve enrich-spotify.mjs bu alanı ayrıca doldurabiliyor).
 */
export function extractSpotifyArtistId(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = /(?:artist[/:])([A-Za-z0-9]{22})/.exec(url.trim());
  return m ? m[1] : null;
}

const MAX_GENRES = 10;
const MAX_GENRE_LEN = 40;

/**
 * genres türetimi. artist_profiles.genres serbest metin dizisi (Spotify
 * zenginleştirmesi de aynı alana yazıyor). Başvuruda hazır bir tür listesi yok,
 * bu yüzden makul bir türetim yapılıyor:
 *   1) speciality + repertoire virgül / eğik çizgi / nokta / tire ile bölünür
 *      (kullanıcılar "Pop, Rock / Türkçe Slow" gibi yazıyor),
 *   2) 40 karakterden uzun parçalar ATILIR — repertoire çoğu zaman serbest bir
 *      cümle, cümleyi "tür" diye yazmak keşif akışını kirletir,
 *   3) ikisi de boşsa concept_tags'e düşülür. concept_tags aslında MÜZİK TÜRÜ
 *      değil etkinlik konsept id'si ("sohbet-arasi") — bu yüzden yalnız
 *      yedek olarak ve okunur başlığa çevrilerek kullanılıyor.
 * Hiçbir şey çıkmazsa [] (şemada NOT NULL DEFAULT '{}').
 */
export function deriveGenres(dj: DjProfileRowForArtist): string[] {
  const fromText = [dj.speciality, dj.repertoire]
    .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
    .flatMap((t) => t.split(/[,/|;•·\n]+/))
    .map(cleanGenreToken)
    .filter(Boolean);

  const picked = fromText.length > 0 ? fromText : (dj.concept_tags ?? []).map(conceptIdToLabel);

  const seen = new Set<string>();
  const out: string[] = [];
  for (const g of picked) {
    if (!g || g.length > MAX_GENRE_LEN) continue;
    const key = g.toLocaleLowerCase("tr");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(g);
    if (out.length >= MAX_GENRES) break;
  }
  return out;
}

function cleanGenreToken(raw: string): string {
  return raw.replace(/^[\s#-]+|[\s.-]+$/g, "").trim();
}

// "sohbet-arasi" → "Sohbet Arasi". MUSIC_CONCEPTS sözlüğünü import etmiyoruz
// (bu dosya saf kalmalı); yedek yol olduğu için kaba çeviri yeterli.
function conceptIdToLabel(id: string): string {
  return id
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toLocaleUpperCase("tr") + w.slice(1))
    .join(" ");
}

function uniqueStrings(...lists: (string[] | null | undefined)[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const list of lists) {
    for (const item of list ?? []) {
      const v = typeof item === "string" ? item.trim() : "";
      if (!v || seen.has(v)) continue;
      seen.add(v);
      out.push(v);
    }
  }
  return out;
}

function trimOrNull(v: string | null | undefined): string | null {
  const t = (v ?? "").trim();
  return t.length > 0 ? t : null;
}

/**
 * Çakışmasız slug seçer: temel slug boşsa temel, doluysa "-2", "-3"... ekler.
 * `taken` çağıran tarafından (artist_profiles'ta aynı önekle başlayan mevcut
 * slug'lar sorgulanarak) verilir — bkz. promoteDjProfile.ts. UNIQUE index yine
 * son savunma hattı: yarış durumunda insert reddedilir ve çağıran hatayı taşır.
 */
export function pickUniqueArtistSlug(base: string, taken: Iterable<string>): string {
  const takenSet = new Set(taken);
  if (!takenSet.has(base)) return base;
  for (let i = 2; i < 1000; i++) {
    const candidate = `${base}-${i}`;
    if (!takenSet.has(candidate)) return candidate;
  }
  throw new Error(`Slug üretilemedi: ${base}`);
}

/**
 * dj_profiles satırını artist_profiles insert nesnesine çevirir.
 * entityId ve slug DIŞARIDAN verilir (ikisi de yan etki gerektiriyor).
 */
export function djProfileToArtistProfile(
  dj: DjProfileRowForArtist,
  opts: { entityId: string; slug: string }
): ArtistProfileInsert {
  const photoUrls = uniqueStrings(dj.photos);
  // Kapak: galerinin ilki; galeri boşsa başvurudaki tekil photo_url.
  const photoUrl = photoUrls[0] ?? trimOrNull(dj.photo_url);

  const links: ArtistLinks = {};
  const instagram = trimOrNull(dj.instagram_url);
  const spotify = trimOrNull(dj.spotify_url);
  const soundcloud = trimOrNull(dj.soundcloud_url);
  const website = trimOrNull(dj.website_url);
  // youtube_url tekil kanal linki; yoksa video listesinin ilkine düşülür.
  const youtube = trimOrNull(dj.youtube_url) ?? trimOrNull((dj.youtube_links ?? [])[0]);
  if (instagram) links.instagram = instagram;
  if (spotify) links.spotify = spotify;
  if (youtube) links.youtube = youtube;
  if (soundcloud) links.soundcloud = soundcloud;
  if (website) links.website = website;

  return {
    entity_id: opts.entityId,
    // entities.kind burada da "person" — mevcut hayalet-profil akışıyla aynı
    // basitleştirme (bkz. createArtistAdminAction, resolveCounterparty):
    // grup/orkestra da bugün 'person' entity ile temsil ediliyor.
    entity_kind: "person",
    slug: opts.slug,
    display_name: dj.name,
    bio: trimOrNull(dj.bio),
    city: trimOrNull(dj.city),
    performer_type: mapPerformerType(dj.performer_type),
    genres: deriveGenres(dj),
    photo_url: photoUrl,
    photo_urls: photoUrls,
    // Yüklenen videolar + YouTube linkleri tek galeride (20260802090000).
    video_urls: uniqueStrings(dj.videos, dj.youtube_links),
    links,
    spotify_artist_id: extractSpotifyArtistId(dj.spotify_url),
    // Şema varsayılanı ile aynı: taşınan profil henüz sahiplenilmedi.
    claim_status: "unclaimed",
    // Kurucu kararı: web başvurusunun onayı = uygulamada onaylı + yayında.
    // (CHECK artist_profiles_publish_requires_approved yalnız approved satırın
    // yayınlanmasına izin veriyor — ikisi birlikte yazılmalı.)
    review_status: "approved",
    is_published: true,
    // Tek seferlik taşımanın eşleştirme anahtarı (20260801130000'de bu amaçla
    // eklenmişti); idempotenslik için promoteDjProfile burayı da sorguluyor.
    legacy_dj_profile_id: dj.id,
    // E-POSTA/TELEFON BİLEREK YOK — bkz. dosya başındaki gizlilik notu.
  };
}
