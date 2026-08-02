#!/usr/bin/env node
/**
 * scripts/supply-import/import-external.mjs
 *
 * Uygulamanın (eventmatch) zaten Ticketmaster ve ra.co'dan gösterdiği Türkiye
 * geneli mekan/sanatçıları NOQT kürasyon sistemine (entities + venue_details /
 * artist_profiles, review_status='potential', is_published=false) aktarır.
 * Kurucu bunları /panel/admin/mekanlar ve /panel/admin/sanatcilar "Potansiyel"
 * sekmesinden inceleyip onaylar/arşivler.
 *
 * Bu script HİÇBİR ŞEYİ OTOMATİK YAZMAZ — varsayılan DRY RUN'dır (yalnız
 * rapor). Gerçek yazım yalnız --apply bayrağıyla olur.
 *
 * Kaynaklar:
 *   Ticketmaster Discovery API v2 — events.json?countryCode=TR (bkz.
 *     eventmatch/functions/src/ticketmaster-proxy.ts, eventmatch/lib/services/api_service.dart).
 *     Anahtar env: TICKETMASTER_API_KEY — koda GÖMÜLMEZ, yalnız env'den okunur.
 *     Firebase Functions'ta secret olarak tutuluyor (`defineSecret`), üretim
 *     değeri Secret Manager'da. Lokal geliştirme değeri eventmatch/.env
 *     içinde (repo dışı, git'e gitmiyor) — ops/IMPORT_REHBERI.md'de nereden
 *     alınacağı anlatılıyor, DEĞER burada YOK.
 *   Resident Advisor — halka açık GraphQL uç noktası (https://ra.co/graphql),
 *     anahtar gerekmez (bkz. eventmatch/lib/services/ra_service.dart).
 *     Türkiye alan id'si 378 (RA "Turkey/All").
 *
 * Kullanım:
 *   node scripts/supply-import/import-external.mjs                       # dry-run, both
 *   node scripts/supply-import/import-external.mjs --source=tm           # yalnız Ticketmaster
 *   node scripts/supply-import/import-external.mjs --source=ra --verbose
 *   node scripts/supply-import/import-external.mjs --apply               # GERÇEK YAZIM
 *
 * Env (.env.local otomatik yüklenir, repo kökünden çalıştırılmalı):
 *   TICKETMASTER_API_KEY        (yalnız --source=tm|both için gerekli)
 *   SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL   (ikisi de kabul edilir — repo
 *                                               konvansiyonu NEXT_PUBLIC_ öneki
 *                                               kullanıyor, bkz. src/lib/supabase.ts)
 *   SUPABASE_SERVICE_ROLE_KEY   (--apply ve DB karşılaştırmalı dry-run için)
 *
 * Dedup / idempotentlik (ops/kayseri-seed.sql desenine paralel, PostgREST ile):
 *   - Her aday için slug = Türkçe karaktersiz kebab-case isim.
 *   - Aynı koşuda aynı temel slug'a çarpan farklı adaylar şehir ekiyle ayrılır
 *     (ör. "sahne" / "sahne-izmir"), hâlâ çakışıyorsa "-2", "-3" ... eklenir.
 *   - Hesaplanan slug (veya onun şehirsiz temel hâli) VERİTABANINDA zaten
 *     varsa aday atlanır — mevcut satıra (Kayseri seed'i dahil, elle
 *     girilenler dahil) DOKUNULMAZ, üstüne yazılmaz, yanına da eklenmez.
 *   - Yazım INSERT ... ON CONFLICT (slug) DO NOTHING (PostgREST
 *     `Prefer: resolution=ignore-duplicates`) ile ikinci bir güvenlik ağı
 *     olarak da korunur (aynı koşuyu iki kez çalıştırmak güvenlidir).
 *   - entities satırı, venue_details/artist_profiles insert'i slug
 *     çakışmasıyla atlanırsa (ör. iki koşu arası yeni bir satır eklendiyse)
 *     hemen SİLİNİR — yetim entities satırı bırakılmaz.
 *
 * Bilinçli sınırlamalar (bkz. ops/IMPORT_REHBERI.md ve final rapor):
 *   - district/venue_type/entry_policy/capacity TAHMİN EDİLMEZ, NULL kalır —
 *     kurucu panelden doldurur (Kayseri seed'indeki "tahmin edilmedi" ilkesiyle aynı).
 *   - artist_profiles.entity_kind her zaman 'person' ile oluşturulur (TM/RA
 *     bir sanatçının solo mu grup mu olduğunu güvenilir vermiyor); yanlışsa
 *     kurucu panelden ayrı bir DB düzeltmesiyle çevirebilir (panel formu bu
 *     alanı düzenlemiyor — bkz. rapor).
 *   - performer_type: Ticketmaster kaynaklı adaylarda 'other' (segment çok
 *     geniş — Music/Theatre/Comedy hepsi attraction üretebiliyor, 'dj'
 *     varsaymak yanıltıcı olurdu), RA kaynaklılarda 'dj' (RA tanım gereği
 *     elektronik müzik/DJ odaklı).
 *   - TM ve RA aynı mekanı farklı şehir yazımıyla (İstanbul/Istanbul gibi)
 *     ayrı aday olarak getirebilir — otomatik birleştirilmez, kürasyon
 *     sırasında görülüp arşivlenebilir.
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

// ── .env.local yükleme (script'ler Next.js dışında çalışır) ─────────────────
function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadEnvLocal();

// ── CLI argümanları ───────────────────────────────────────────────────────
const argv = process.argv.slice(2);
function hasFlag(name) {
  return argv.includes(`--${name}`);
}
function getOpt(name, def) {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : def;
}

const SOURCE = getOpt("source", "both");
const APPLY = hasFlag("apply");
const VERBOSE = hasFlag("verbose");
const TM_MAX_PAGES = Number(getOpt("tm-max-pages", "50"));
const TM_PAGE_SIZE = Number(getOpt("tm-page-size", "200")); // TM Discovery'nin izin verdiği azami sayfa boyutu
const RA_MAX_PAGES = Number(getOpt("ra-max-pages", "30"));
const SAMPLE_LIMIT = Number(getOpt("sample", "8"));

if (!["tm", "ra", "both"].includes(SOURCE)) {
  console.error(`Geçersiz --source=${SOURCE} (tm | ra | both olmalı)`);
  process.exit(1);
}
if (hasFlag("help")) {
  console.log(readFileSync(new URL(import.meta.url), "utf-8").split("*/")[0]);
  process.exit(0);
}

// ── yardımcılar ───────────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const TR_FOLD = { ç: "c", Ç: "c", ğ: "g", Ğ: "g", ı: "i", İ: "i", ö: "o", Ö: "o", ş: "s", Ş: "s", ü: "u", Ü: "u" };

function slugifyBase(input) {
  const folded = String(input || "")
    .split("")
    .map((ch) => TR_FOLD[ch] ?? ch)
    .join("");
  return folded
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// Çalışma içi çakışmaları şehir ekiyle, hâlâ çakışıyorsa -2/-3 ile ayırır.
// Adayın temel slug'ı veritabanında ZATEN varsa "existsInDb" işaretlenir —
// bu adaylar insert edilmez (mevcut satıra dokunulmaz).
function assignSlugs(candidates, existingSlugs) {
  const baseCounts = new Map();
  for (const c of candidates) {
    c._base = slugifyBase(c.name) || "kayit";
    baseCounts.set(c._base, (baseCounts.get(c._base) || 0) + 1);
  }
  const usedInRun = new Set();
  for (const c of candidates) {
    let slug = c._base;
    if (baseCounts.get(c._base) > 1 && c.city) {
      const withCity = `${c._base}-${slugifyBase(c.city)}`;
      if (!usedInRun.has(withCity)) slug = withCity;
    }
    if (usedInRun.has(slug)) {
      let n = 2;
      while (usedInRun.has(`${slug}-${n}`)) n++;
      slug = `${slug}-${n}`;
    }
    usedInRun.add(slug);
    c.slug = slug;
    c.existsInDb = existingSlugs.has(c.slug) || existingSlugs.has(c._base);
  }
  return candidates;
}

function topCities(candidates, limit = 12) {
  const counts = new Map();
  for (const c of candidates) {
    const key = c.city || "(şehir bilinmiyor)";
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
}

// ── Ticketmaster Discovery ───────────────────────────────────────────────
// TM attraction görsel seçimi eventmatch/lib/services/api_service.dart
// _findSuitableImageUrl mantığının aynısı: önce fallback olmayan ilk görsel,
// yoksa jenerik ARTIST_PAGE stok görseli OLMAYAN, makul en/boy oranlı bir
// fallback. Kalanların hepsi jenerik stoksa null (kart kategori zeminine düşer).
function findSuitableTmImage(images) {
  if (!Array.isArray(images) || images.length === 0) return null;
  const nonFallback = images.find((img) => img && img.fallback !== true);
  if (nonFallback?.url) return nonFallback.url;
  const decentFallback = images.find((img) => {
    if (!img) return false;
    const notStock = !(img.url || "").includes("ARTIST_PAGE");
    const ratioOk = img.ratio === "16_9" || img.ratio === "3_2" || img.ratio === "4_3";
    const widthOk = typeof img.width === "number" && img.width > 200;
    return notStock && ratioOk && widthOk;
  });
  return decentFallback?.url ?? null;
}

// TM attraction.externalLinks belgelenmiş biçimi: { spotify: [{url}], instagram: [{url}], ... }
// TR kataloğunda KEŞİF sırasında hep boş/null geldi (bkz. final rapor) — yine
// de büyük sanatçılarda dolabileceği için savunmacı biçimde okunuyor.
function extractExternalLinks(externalLinks) {
  const links = {};
  if (!externalLinks || typeof externalLinks !== "object") return links;
  const pick = (key) => externalLinks[key]?.[0]?.url;
  const instagram = pick("instagram");
  const spotify = pick("spotify");
  const youtube = pick("youtube");
  const soundcloud = pick("soundcloud");
  if (instagram) links.instagram = instagram;
  if (spotify) links.spotify = spotify;
  if (youtube) links.youtube = youtube;
  if (soundcloud) links.soundcloud = soundcloud;
  return links;
}

// TM Discovery "derin sayfalama" limiti: (page * size) < 1000 — yani tek
// sorguyla en fazla ~1000 etkinlik gezilebilir (DIS1035). TR kataloğu bunu
// aşıyor; çözüm TARİH PENCERELEME: katalog 61 günlük dilimlere bölünür, her
// dilim kendi 1000'lik sayfalama bütçesiyle taranır. Dedup zaten Map'lerde.
function tmDateWindows() {
  const windows = [];
  const start = new Date();
  const WINDOW_DAYS = 61;
  const WINDOW_COUNT = 6; // ~12 ay
  const fmt = (d) => d.toISOString().replace(/\.\d{3}Z$/, "Z"); // TM milisaniye kabul etmez
  for (let i = 0; i < WINDOW_COUNT; i++) {
    const from = new Date(start.getTime() + i * WINDOW_DAYS * 86400_000);
    const to = new Date(start.getTime() + (i + 1) * WINDOW_DAYS * 86400_000);
    windows.push({ startDateTime: fmt(from), endDateTime: fmt(to) });
  }
  // 12 aydan sonrası için açık uçlu son pencere (nadir ama kaybetmeyelim).
  windows.push({ startDateTime: fmt(new Date(start.getTime() + WINDOW_COUNT * WINDOW_DAYS * 86400_000)) });
  return windows;
}

async function fetchTicketmaster({ apiKey, maxPages, pageSize, verbose }) {
  const venues = new Map();
  const artists = new Map();
  let totalElements = 0;
  let rawVenueMentions = 0;
  let rawArtistMentions = 0;
  let pagesFetchedTotal = 0;
  let truncatedWindows = 0;

  for (const window of tmDateWindows()) {
  let page = 0;
  let totalPages = 1;

  // (page+1)*size <= 1000 şartı: DIS1035'e hiç çarpmadan pencere içinde kal.
  while (page < totalPages && pagesFetchedTotal < maxPages && (page + 1) * pageSize <= 1000) {
    const params = new URLSearchParams({
      apikey: apiKey,
      countryCode: "TR",
      size: String(pageSize),
      page: String(page),
      sort: "date,asc",
      startDateTime: window.startDateTime,
    });
    if (window.endDateTime) params.set("endDateTime", window.endDateTime);
    const url = `https://app.ticketmaster.com/discovery/v2/events.json?${params}`;

    let res;
    for (let attempt = 0; attempt < 4; attempt++) {
      res = await fetch(url);
      if (res.status !== 429) break;
      const wait = 1000 * (attempt + 1);
      if (verbose) console.warn(`  [tm] 429 alındı — ${wait}ms bekleniyor (deneme ${attempt + 1}/4)`);
      await sleep(wait);
    }
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[tm] sayfa ${page} hata: HTTP ${res.status} ${body.slice(0, 300)}`);
      break;
    }

    const data = await res.json();
    totalPages = Math.max(1, data.page?.totalPages ?? 1);
    if (page === 0) totalElements += data.page?.totalElements ?? 0;
    const events = data._embedded?.events ?? [];

    for (const e of events) {
      const genreName = e.classifications?.[0]?.genre?.name;
      const venue = e._embedded?.venues?.[0];
      if (venue?.name) {
        rawVenueMentions++;
        const cityName = venue.city?.name?.trim() || null;
        const key = `${venue.name.trim().toLowerCase()}|${(cityName || "").toLowerCase()}`;
        if (!venues.has(key)) {
          venues.set(key, {
            name: venue.name.trim(),
            city: cityName,
            address: venue.address?.line1?.trim() || null,
            source: "ticketmaster",
          });
        }
      }
      for (const attraction of e._embedded?.attractions ?? []) {
        if (!attraction?.name) continue;
        rawArtistMentions++;
        const key = attraction.name.trim().toLowerCase();
        if (!artists.has(key)) {
          artists.set(key, {
            name: attraction.name.trim(),
            display_name: attraction.name.trim(),
            city: null,
            photo_url: findSuitableTmImage(attraction.images),
            genres: genreName && genreName !== "Undefined" ? [genreName] : [],
            links: extractExternalLinks(attraction.externalLinks),
            performer_type: "other",
            source: "ticketmaster",
          });
        }
      }
    }

    if (verbose) console.log(`  [tm] ${window.startDateTime.slice(0, 10)} penceresi — sayfa ${page + 1}/${totalPages} — ${events.length} etkinlik`);
    page++;
    pagesFetchedTotal++;
    await sleep(220); // TM rate limitine (varsayılan ~5 istek/sn) nazik davran
  }

  if (page < totalPages && (page + 1) * pageSize > 1000) {
    truncatedWindows++;
    console.warn(
      `  UYARI: ${window.startDateTime.slice(0, 10)} penceresi 1000 etkinlik bütçesini aştı — ` +
      `pencere daraltılmalı (WINDOW_DAYS düşür) ya da kalanlar bir sonraki koşuda gelir.`,
    );
  }
  } // pencere döngüsü sonu

  return {
    venues,
    artists,
    pagesFetched: pagesFetchedTotal,
    totalPages: pagesFetchedTotal, // pencereli modda "kalan sayfa" kavramı pencere-içi; uyarılar yukarıda
    totalElements,
    rawVenueMentions,
    rawArtistMentions,
    truncatedWindows,
  };
}

// ── Resident Advisor GraphQL ─────────────────────────────────────────────
const RA_ENDPOINT = "https://ra.co/graphql";
const RA_TURKEY_AREA_ID = 378; // eventmatch/lib/services/ra_service.dart ile aynı

// RA "area.name" TM'nin "city" alanıyla aynı yazım kuralını (İstanbul, dotted İ)
// izlemiyor (Istanbul, Izmir gibi undotted döner) — bilinen küçük bir eşleştirme
// tablosuyla normalize ediyoruz; listede olmayanlar olduğu gibi bırakılır.
const RA_AREA_TO_CITY = {
  istanbul: "İstanbul",
  izmir: "İzmir",
  ankara: "Ankara",
  antalya: "Antalya",
  bursa: "Bursa",
  bodrum: "Muğla",
};
function normalizeRaCity(areaName) {
  if (!areaName) return null;
  const mapped = RA_AREA_TO_CITY[areaName.trim().toLowerCase()];
  return mapped || areaName.trim();
}

async function fetchRA({ maxPages, verbose }) {
  const venues = new Map();
  const artists = new Map();
  const pageSize = 20;
  const today = new Date().toISOString().slice(0, 10);
  let page = 1;
  let totalResults = Infinity;
  let rawVenueMentions = 0;
  let rawArtistMentions = 0;

  while ((page - 1) * pageSize < totalResults && page <= maxPages) {
    const query = `query {
      eventListings(filters: {areas: {eq: ${RA_TURKEY_AREA_ID}}, listingDate: {gte: "${today}"}}, pageSize: ${pageSize}, page: ${page}) {
        data { event { id title venue { name area { name } } artists { id name } } }
        totalResults
      }
    }`;

    const res = await fetch(RA_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "noqt-supply-import/1.0" },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) {
      console.error(`[ra] sayfa ${page} hata: HTTP ${res.status}`);
      break;
    }
    const json = await res.json();
    if (json.errors) {
      console.error(`[ra] GraphQL hatası: ${JSON.stringify(json.errors).slice(0, 300)}`);
      break;
    }
    const listing = json.data?.eventListings;
    totalResults = listing?.totalResults ?? 0;
    const items = listing?.data ?? [];

    for (const item of items) {
      const e = item.event;
      if (!e) continue;
      const venueName = e.venue?.name?.trim();
      const cityName = normalizeRaCity(e.venue?.area?.name);
      if (venueName) {
        rawVenueMentions++;
        const key = `${venueName.toLowerCase()}|${(cityName || "").toLowerCase()}`;
        if (!venues.has(key)) {
          venues.set(key, { name: venueName, city: cityName, address: null, source: "ra" });
        }
      }
      for (const a of e.artists ?? []) {
        if (!a?.name) continue;
        rawArtistMentions++;
        const key = a.name.trim().toLowerCase();
        if (!artists.has(key)) {
          artists.set(key, {
            name: a.name.trim(),
            display_name: a.name.trim(),
            city: null,
            photo_url: null,
            genres: ["Elektronik"],
            links: {},
            performer_type: "dj",
            source: "ra",
          });
        }
      }
    }

    if (verbose) console.log(`  [ra] sayfa ${page} — ${items.length} etkinlik (toplam ${totalResults})`);
    page++;
    await sleep(150);
  }

  return { venues, artists, pagesFetched: page - 1, totalResults, rawVenueMentions, rawArtistMentions };
}

// ── PostgREST istemcisi (Supabase) ───────────────────────────────────────
function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return { url, key };
}

async function postgrest(base, key, method, pathAndQuery, body, extraHeaders = {}) {
  const res = await fetch(`${base}/rest/v1${pathAndQuery}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...extraHeaders,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`PostgREST ${method} ${pathAndQuery} -> HTTP ${res.status}: ${text.slice(0, 400)}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function fetchExistingSlugs(base, key, table) {
  const slugs = new Set();
  const pageSize = 1000;
  let from = 0;
  for (;;) {
    const data = await postgrest(base, key, "GET", `/${table}?select=slug&slug=not.is.null`, undefined, {
      Range: `${from}-${from + pageSize - 1}`,
    });
    if (!data || data.length === 0) break;
    for (const row of data) if (row.slug) slugs.add(row.slug);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return slugs;
}

async function insertVenue(base, key, candidate) {
  const entityRows = await postgrest(base, key, "POST", "/entities", [{ kind: "venue" }], {
    Prefer: "return=representation",
  });
  const entityId = entityRows?.[0]?.id;
  if (!entityId) throw new Error("entities insert id döndürmedi");

  const row = {
    entity_id: entityId,
    name: candidate.name,
    address: candidate.address,
    slug: candidate.slug,
    district: null,
    venue_type: null,
    capacity: null,
    entry_policy: null,
    instagram_handle: null,
    google_maps_phone: null,
    photo_urls: [],
    claim_status: "unclaimed",
    is_published: false,
    review_status: "potential",
  };

  // NOT: on_conflict=slug KULLANILMIYOR — venue_details'in slug benzersizliği
  // KISMİ indeks (WHERE slug IS NOT NULL) ve PostgREST'in ON CONFLICT'i kısmi
  // indeksle eşleşemiyor (42P10). Script mevcut slug'ları zaten önden süzüyor;
  // yarış durumunda düz insert 23505/409 döner ve çakışma olarak ele alınır.
  try {
    await postgrest(base, key, "POST", "/venue_details", [row], {
      Prefer: "return=representation",
    });
  } catch (err) {
    await postgrest(base, key, "DELETE", `/entities?id=eq.${entityId}`).catch(() => {});
    if (isUniqueViolation(err)) return { status: "conflict" };
    throw err;
  }
  return { status: "inserted", entityId };
}

function isUniqueViolation(err) {
  const msg = String(err?.message ?? "");
  return msg.includes("23505") || msg.includes("HTTP 409");
}

async function insertArtist(base, key, candidate) {
  const entityRows = await postgrest(base, key, "POST", "/entities", [{ kind: "person" }], {
    Prefer: "return=representation",
  });
  const entityId = entityRows?.[0]?.id;
  if (!entityId) throw new Error("entities insert id döndürmedi");

  const row = {
    entity_id: entityId,
    entity_kind: "person",
    slug: candidate.slug,
    display_name: candidate.display_name,
    bio: null,
    photo_url: candidate.photo_url,
    city: candidate.city,
    genres: candidate.genres,
    performer_type: candidate.performer_type,
    links: candidate.links,
    claim_status: "unclaimed",
    managed_by_manager: false,
    is_published: false,
    review_status: "potential",
  };

  try {
    await postgrest(base, key, "POST", "/artist_profiles", [row], {
      Prefer: "return=representation",
    });
  } catch (err) {
    await postgrest(base, key, "DELETE", `/entities?id=eq.${entityId}`).catch(() => {});
    if (isUniqueViolation(err)) return { status: "conflict" };
    throw err;
  }
  return { status: "inserted", entityId };
}

// ── ana akış ──────────────────────────────────────────────────────────────
async function main() {
  console.log("================================================================");
  console.log(` NOQT kürasyon içe aktarım — ${APPLY ? "APPLY (yazılıyor)" : "DRY RUN (yazma yapılmıyor)"}`);
  console.log(`  Kaynak: ${SOURCE}`);
  console.log("================================================================\n");

  const wantsTm = SOURCE === "tm" || SOURCE === "both";
  const wantsRa = SOURCE === "ra" || SOURCE === "both";

  let tmResult = null;
  let raResult = null;

  if (wantsTm) {
    const apiKey = process.env.TICKETMASTER_API_KEY;
    if (!apiKey) {
      console.error("TICKETMASTER_API_KEY tanımlı değil — --source=tm|both için gerekli. ops/IMPORT_REHBERI.md'ye bakın.");
      process.exit(1);
    }
    console.log("[Ticketmaster] çekiliyor...");
    tmResult = await fetchTicketmaster({ apiKey, maxPages: TM_MAX_PAGES, pageSize: TM_PAGE_SIZE, verbose: VERBOSE });
    console.log(
      `[Ticketmaster] ${tmResult.pagesFetched}/${tmResult.totalPages} sayfa, ${tmResult.totalElements} toplam etkinlikten ` +
        `${tmResult.rawVenueMentions} mekan / ${tmResult.rawArtistMentions} sanatçı bahsi tarandı.\n` +
        `  Benzersiz mekan: ${tmResult.venues.size} | Benzersiz sanatçı: ${tmResult.artists.size}`
    );
    if (tmResult.pagesFetched >= TM_MAX_PAGES && tmResult.pagesFetched < tmResult.totalPages) {
      console.warn(
        `  UYARI: --tm-max-pages=${TM_MAX_PAGES} sınırına takıldı, TM'de hâlâ ${tmResult.totalPages - tmResult.pagesFetched} sayfa daha var. ` +
          `Tamamını çekmek için --tm-max-pages değerini artırın.`
      );
    }
    console.log("");
  }

  if (wantsRa) {
    console.log("[Resident Advisor] çekiliyor...");
    raResult = await fetchRA({ maxPages: RA_MAX_PAGES, verbose: VERBOSE });
    console.log(
      `[Resident Advisor] ${raResult.pagesFetched} sayfa, ${raResult.totalResults} toplam etkinlikten ` +
        `${raResult.rawVenueMentions} mekan / ${raResult.rawArtistMentions} sanatçı bahsi tarandı.\n` +
        `  Benzersiz mekan: ${raResult.venues.size} | Benzersiz sanatçı: ${raResult.artists.size}`
    );
    console.log("");
  }

  // Birleştir (TM önce eklenir — adres bilgisi olduğu için önceliklidir).
  const mergedVenuesMap = new Map();
  const mergedArtistsMap = new Map();
  for (const result of [tmResult, raResult]) {
    if (!result) continue;
    for (const [key, v] of result.venues) if (!mergedVenuesMap.has(key)) mergedVenuesMap.set(key, v);
    for (const [key, a] of result.artists) if (!mergedArtistsMap.has(key)) mergedArtistsMap.set(key, a);
  }
  const mergedVenues = [...mergedVenuesMap.values()];
  const mergedArtists = [...mergedArtistsMap.values()];

  console.log("----------------------------------------------------------------");
  console.log(`Birleştirilmiş benzersiz mekan adayı: ${mergedVenues.length}`);
  console.log(`Birleştirilmiş benzersiz sanatçı adayı: ${mergedArtists.length}`);
  console.log("Şehir kırılımı (mekan, ilk 12):");
  for (const [city, count] of topCities(mergedVenues)) console.log(`  ${city}: ${count}`);
  console.log("----------------------------------------------------------------\n");

  // Supabase — DB karşılaştırması (dry-run'da bilgi amaçlı, apply'da zorunlu).
  const { url: supabaseUrl, key: supabaseKey } = getSupabaseConfig();
  let existingVenueSlugs = new Set();
  let existingArtistSlugs = new Set();
  let dbCompared = false;

  if (supabaseUrl && supabaseKey) {
    console.log("Supabase'deki mevcut slug'lar okunuyor (karşılaştırma için, yazma yok)...");
    [existingVenueSlugs, existingArtistSlugs] = await Promise.all([
      fetchExistingSlugs(supabaseUrl, supabaseKey, "venue_details"),
      fetchExistingSlugs(supabaseUrl, supabaseKey, "artist_profiles"),
    ]);
    dbCompared = true;
    console.log(`  Mevcut mekan slug sayısı: ${existingVenueSlugs.size} | mevcut sanatçı slug sayısı: ${existingArtistSlugs.size}\n`);
  } else if (APPLY) {
    console.error("SUPABASE_URL (veya NEXT_PUBLIC_SUPABASE_URL) ve SUPABASE_SERVICE_ROLE_KEY gerekli (--apply için).");
    process.exit(1);
  } else {
    console.warn(
      "Supabase kimlik bilgisi verilmedi (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY) — " +
        "DB karşılaştırması yapılamadı, aşağıdaki sayılar TÜM adayları 'yeni' varsayıyor.\n"
    );
  }

  assignSlugs(mergedVenues, existingVenueSlugs);
  assignSlugs(mergedArtists, existingArtistSlugs);

  const newVenues = mergedVenues.filter((v) => !v.existsInDb);
  const skippedVenues = mergedVenues.filter((v) => v.existsInDb);
  const newArtists = mergedArtists.filter((a) => !a.existsInDb);
  const skippedArtists = mergedArtists.filter((a) => a.existsInDb);

  console.log("================================================================");
  console.log(" Özet");
  console.log("================================================================");
  console.log(
    `Mekan: ${mergedVenues.length} aday${dbCompared ? ` → ${newVenues.length} yeni, ${skippedVenues.length} zaten DB'de (atlanacak)` : ""}`
  );
  console.log(
    `Sanatçı: ${mergedArtists.length} aday${dbCompared ? ` → ${newArtists.length} yeni, ${skippedArtists.length} zaten DB'de (atlanacak)` : ""}`
  );
  console.log("");

  const sampleList = (list, formatter) => list.slice(0, SAMPLE_LIMIT).forEach((item) => console.log(`  - ${formatter(item)}`));
  console.log(`Örnek yeni mekanlar (ilk ${SAMPLE_LIMIT}):`);
  sampleList(newVenues, (v) => `${v.name}${v.city ? ` (${v.city})` : ""} -> slug: ${v.slug} [${v.source}]`);
  console.log(`\nÖrnek yeni sanatçılar (ilk ${SAMPLE_LIMIT}):`);
  sampleList(
    newArtists,
    (a) => `${a.display_name} -> slug: ${a.slug} [${a.source}]${a.photo_url ? " (görsel var)" : ""}`
  );
  console.log("");

  if (!APPLY) {
    console.log("Bu bir DRY RUN'dı — hiçbir şey yazılmadı. Gerçek yazım için --apply ekleyin.");
    return;
  }

  if (!dbCompared) {
    console.error("Beklenmeyen durum: --apply ile dbCompared=false. Durduruluyor.");
    process.exit(1);
  }

  console.log("================================================================");
  console.log(" Yazılıyor...");
  console.log("================================================================");

  let venuesInserted = 0;
  let venuesConflict = 0;
  let venuesFailed = 0;
  for (const v of newVenues) {
    try {
      const result = await insertVenue(supabaseUrl, supabaseKey, v);
      if (result.status === "inserted") venuesInserted++;
      else venuesConflict++;
    } catch (err) {
      venuesFailed++;
      console.error(`  [mekan hata] ${v.name}: ${err.message}`);
    }
  }

  let artistsInserted = 0;
  let artistsConflict = 0;
  let artistsFailed = 0;
  for (const a of newArtists) {
    try {
      const result = await insertArtist(supabaseUrl, supabaseKey, a);
      if (result.status === "inserted") artistsInserted++;
      else artistsConflict++;
    } catch (err) {
      artistsFailed++;
      console.error(`  [sanatçı hata] ${a.display_name}: ${err.message}`);
    }
  }

  console.log("\n================================================================");
  console.log(" Sonuç");
  console.log("================================================================");
  console.log(`Mekan: ${venuesInserted} eklendi, ${venuesConflict} çakışma (atlandı), ${venuesFailed} hata`);
  console.log(`Sanatçı: ${artistsInserted} eklendi, ${artistsConflict} çakışma (atlandı), ${artistsFailed} hata`);
  console.log("\nSonraki adım: /panel/admin/mekanlar ve /panel/admin/sanatcilar 'Potansiyel' sekmesinden incele.");
}

main().catch((err) => {
  console.error("\nBeklenmeyen hata:", err);
  process.exit(1);
});
