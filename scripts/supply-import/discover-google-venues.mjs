#!/usr/bin/env node
/**
 * scripts/supply-import/discover-google-venues.mjs
 *
 * Google Places'te ŞEHRE GÖRE canlı müzik mekanı KEŞFEDER ve bulduklarını
 * `review_status='potential'`, `is_published=false` olarak yazar. Kurucu
 * /panel/admin/mekanlar "Potansiyel" sekmesinden onaylar/arşivler.
 *
 * KOMŞU SCRIPT'LERDEN FARKI (karıştırılmamalı):
 *   - enrich-google-venues.mjs: ZATEN BİLDİĞİN mekanı adıyla arar, veri
 *     ekler. Yeni mekan BULMAZ.
 *   - import-external.mjs: Ticketmaster/RA'da BİLETLİ ETKİNLİK yapan
 *     mekanları bulur. Bilet satmayan küçük canlı müzik barları o ağdan
 *     geçmez — Kayseri envanterinin elle yazılmasının sebebi buydu.
 *   - bu script: "şu şehirde canlı müzik mekanı kim var" sorusunu sorar.
 *
 * NEDEN ŞEHİR PARAMETRE (81 il birden DEĞİL)
 * Google bir ilde yüzlerce "bar" döndürür ve canlı müzik yapanı ayırmaz;
 * her satır kurucunun onayını bekler. 81 ili tek seferde taramak binlerce
 * satırlık bir onay kuyruğu ve ciddi bir API faturası üretir — üstelik
 * kullanıcın olmayan şehirde katalog değer üretmez. Bu yüzden şehir ZORUNLU
 * argüman: kapsamı bilerek seçmek zorundasın.
 *
 * GÜVEN KURALI (enrich-google-venues.mjs'teki duruşun aynısı)
 * Otomatik yazılan her satır yanlışsa itibar riski. Bu yüzden bir aday
 * yalnız ŞU ÜÇÜ birden sağlanırsa yazılır:
 *   1. Adayın adresi aranan şehri içeriyor (Google komşu ile taşabiliyor),
 *   2. Google'ın yer türleri arasında müzikle ilişkili en az biri var
 *      (bkz. ACCEPTED_TYPES) — "restaurant" tek başına YETMEZ,
 *   3. Adı mevcut bir mekanla çakışmıyor (slug bazlı, aşağıdaki not).
 * Sağlanmayanlar rapora "şüpheli" olarak düşer, HİÇBİR ŞEY yazılmaz.
 *
 * KOORDİNAT: Google `geometry` alanını döndürüyor ve script bunu rapora
 * yazıyor, ama venue_details'te enlem/boylam KOLONU YOK (2026-08-06). Kolon
 * eklenirse (bkz. dosya sonundaki not) buradan doldurulabilir; o zamana
 * kadar koordinatlar yalnız raporda görünür ve eventmatch admin panelinden
 * elle girilir.
 *
 * İDEMPOTENT: mevcut slug'lar önden çekilip süzülür; aynı şehir için tekrar
 * çalıştırmak yeni satır üretmez (yalnız daha önce bulunmamışları ekler).
 *
 * MALİYET: her sorgu ayrı ücretlendirilir. Şehir başına
 * (SEARCH_TERMS.length × sayfa sayısı) Text Search çağrısı yapılır; --apply
 * ile ayrıca her YENİ aday için 1 Place Details çağrısı. Dry-run yalnız
 * Text Search harcar. Güncel tarifeyi Google Cloud faturasından doğrula.
 *
 * Kullanım:
 *   node scripts/supply-import/discover-google-venues.mjs --city=Ankara
 *   node scripts/supply-import/discover-google-venues.mjs --city=Ankara --verbose
 *   node scripts/supply-import/discover-google-venues.mjs --city=Ankara --apply
 *   node scripts/supply-import/discover-google-venues.mjs --city=İzmir --max-pages=1
 *
 * Env (.env.local otomatik yüklenir, repo kökünden çalıştırılmalı):
 *   SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   GOOGLE_PLACES_API_KEY
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

// ── .env.local yükleme (komşu script'lerle AYNI yardımcı) ──────────────────
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

// ── CLI ───────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const hasFlag = (name) => argv.includes(`--${name}`);
const getOpt = (name, def) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : def;
};

if (hasFlag("help")) {
  console.log(readFileSync(new URL(import.meta.url), "utf-8").split("*/")[0]);
  process.exit(0);
}

const CITY = getOpt("city", null);
const APPLY = hasFlag("apply");
const VERBOSE = hasFlag("verbose");
const MAX_PAGES = Number(getOpt("max-pages", "2"));

if (!CITY) {
  console.error("HATA: --city zorunlu. Örnek: --city=Ankara");
  console.error("(Gerekçesi dosya başındaki 'NEDEN ŞEHİR PARAMETRE' notunda.)");
  process.exit(1);
}

const LEGACY_BASE = "https://maps.googleapis.com/maps/api/place";
const PANEL_BASE_URL = "https://panel.noqt.social";

/**
 * Arama terimleri — canlı müzik + DJ etkinliklerine yakın olacak şekilde
 * dar tutuldu. "bar" ve "restaurant" gibi geniş terimler BİLEREK yok: bir
 * ilde yüzlerce sonuç döndürüp onay kuyruğunu kullanılamaz hale
 * getiriyorlar.
 */
const SEARCH_TERMS = [
  "canlı müzik",
  "canlı müzik bar",
  "türkü evi",
  "meyhane canlı müzik",
  "performance hall",
  "konser salonu",
  "gece kulübü",
  "dj bar",
  "dj gece kulübü",
];

/**
 * Google yer türlerinden müzikle ilişkili olanlar. Aday bunlardan EN AZ
 * BİRİNİ taşımalı — yalnız "restaurant"/"food" taşıyan bir sonuç canlı
 * müzik mekanı sayılmaz (adında "canlı müzik" geçse bile; Google metin
 * eşleşmesini menü/yorumlardan da yapabiliyor).
 */
const ACCEPTED_TYPES = new Set([
  "night_club",
  "bar",
  "performing_arts_theater",
  "concert_hall",
  "movie_theater", // bazı sahneler bu türle etiketlenmiş dönüyor
  "tourist_attraction",
]);

/** Google `types` -> venue_details.venue_type eşlemesi. */
function mapVenueType(types = []) {
  if (types.includes("night_club")) return "club";
  if (types.includes("concert_hall") || types.includes("performing_arts_theater")) {
    return "concert_hall";
  }
  if (types.includes("bar")) return "bar";
  if (types.includes("cafe")) return "stage_cafe";
  return "other";
}

// ── Türkçe katlama / slug (komşu script'lerle AYNI) ───────────────────────
const TR_FOLD = { ç: "c", Ç: "c", ğ: "g", Ğ: "g", ı: "i", İ: "i", ö: "o", Ö: "o", ş: "s", Ş: "s", ü: "u", Ü: "u" };

function fold(input) {
  return String(input || "")
    .split("")
    .map((ch) => TR_FOLD[ch] ?? ch)
    .join("")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "");
}

function normalizeName(input) {
  return fold(input).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function slugifyBase(input) {
  return fold(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Şehir başına ayrı dosya — aksi halde art arda çalıştırılan iki şehrin
// raporu birbirinin üzerine yazardı. (slugifyBase yukarıda tanımlı olmalı —
// bu satır TR_FOLD/fold/slugifyBase'den SONRA duruyor.)
const REPORT_PATH = `ops/google-mekan-kesif-raporu-${slugifyBase(CITY)}.md`;

// ── Google Places (legacy) ────────────────────────────────────────────────
async function placesGet(urlObj, attempt = 0) {
  const res = await fetch(urlObj);
  if (res.status === 429) {
    if (attempt >= 3) throw new Error(`Google Places 429 denemeleri tükendi (${urlObj.pathname})`);
    const wait = (attempt + 1) * 1000;
    if (VERBOSE) console.warn(`  [places] 429 — ${wait}ms bekleniyor`);
    await sleep(wait);
    return placesGet(urlObj, attempt + 1);
  }
  if (!res.ok) throw new Error(`Google Places HTTP ${res.status} (${urlObj.pathname})`);
  const data = await res.json();
  if (data.status === "OVER_QUERY_LIMIT") {
    if (attempt >= 3) throw new Error("Google Places OVER_QUERY_LIMIT denemeleri tükendi");
    const wait = (attempt + 1) * 1500;
    if (VERBOSE) console.warn(`  [places] OVER_QUERY_LIMIT — ${wait}ms bekleniyor`);
    await sleep(wait);
    return placesGet(urlObj, attempt + 1);
  }
  return data;
}

/// Text Search + sayfalama. `next_page_token` Google tarafında GECİKMELİ
/// aktifleşir; beklemeden istenirse INVALID_REQUEST döner — bu yüzden
/// sayfalar arasında sabit bekleme var.
async function textSearchAll(apiKey, query, maxPages) {
  const out = [];
  let pageToken = null;
  for (let page = 0; page < maxPages; page += 1) {
    const url = new URL(`${LEGACY_BASE}/textsearch/json`);
    if (pageToken) {
      url.searchParams.set("pagetoken", pageToken);
    } else {
      url.searchParams.set("query", query);
      url.searchParams.set("language", "tr");
      url.searchParams.set("region", "tr");
    }
    url.searchParams.set("key", apiKey);

    // `pagetoken` GECİKMELİ aktifleşir; Google belgelerinde net bir süre
    // vermiyor ("kısa bir gecikme"), 2sn bazen yetmiyor ve INVALID_REQUEST
    // dönüyor — bu, sonuçları SESSİZCE eksiltiyordu (döngü sayfayı atlayıp
    // devam ediyordu). Yalnız sayfalama isteğinde, yalnız bu duruma özel bir
    // kez daha uzun beklenip tekrar denenir.
    let data = await placesGet(url);
    if (pageToken && data.status === "INVALID_REQUEST") {
      if (VERBOSE) console.warn(`  [places] sayfa jetonu henüz hazır değil, 3sn daha bekleniyor`);
      await sleep(3000);
      data = await placesGet(url);
    }
    if (data.status === "ZERO_RESULTS") break;
    if (data.status !== "OK") {
      if (VERBOSE) console.warn(`  [places] "${query}" -> ${data.status}`);
      break;
    }
    out.push(...(Array.isArray(data.results) ? data.results : []));
    pageToken = data.next_page_token ?? null;
    if (!pageToken) break;
    await sleep(2000);
  }
  return out;
}

async function placeDetails(apiKey, placeId) {
  const url = new URL(`${LEGACY_BASE}/details/json`);
  url.searchParams.set("place_id", placeId);
  url.searchParams.set(
    "fields",
    "place_id,name,formatted_address,formatted_phone_number,rating,user_ratings_total,geometry,types",
  );
  url.searchParams.set("language", "tr");
  url.searchParams.set("key", apiKey);
  const data = await placesGet(url);
  return data.status === "OK" ? data.result : null;
}

// ── Supabase (PostgREST) ──────────────────────────────────────────────────
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

/// Mevcut mekanların slug'ları + google_place_id'leri. İkisi de dedup için:
/// slug ad çakışmasını, place_id ise adı değişmiş ama aynı olan mekanı yakalar.
async function fetchExisting(base, key) {
  const slugs = new Set();
  const placeIds = new Set();
  const PAGE = 1000;
  for (let offset = 0; ; offset += PAGE) {
    const rows = await postgrest(
      base,
      key,
      "GET",
      `/venue_details?select=slug,google_place_id&limit=${PAGE}&offset=${offset}`,
    );
    if (!rows || rows.length === 0) break;
    for (const row of rows) {
      if (row.slug) slugs.add(row.slug);
      if (row.google_place_id) placeIds.add(row.google_place_id);
    }
    if (rows.length < PAGE) break;
  }
  return { slugs, placeIds };
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
    city: CITY,
    district: null,
    venue_type: candidate.venueType,
    capacity: null,
    entry_policy: null,
    instagram_handle: null,
    google_maps_phone: candidate.phone ?? null,
    photo_urls: [],
    claim_status: "unclaimed",
    is_published: false,
    // Kurucu onayı ŞART — bu script hiçbir şeyi yayına almaz.
    review_status: "potential",
    google_place_id: candidate.placeId,
    google_rating: candidate.rating ?? null,
    google_ratings_total: candidate.ratingsTotal ?? null,
    enriched_at: new Date().toISOString(),
  };

  // on_conflict KULLANILMIYOR: venue_details.slug benzersizliği KISMİ indeks
  // (WHERE slug IS NOT NULL) ve PostgREST kısmi indeksle ON CONFLICT yapamaz
  // (42P10) — import-external.mjs'teki aynı gerekçe. Çakışma 23505 döner.
  await postgrest(base, key, "POST", "/venue_details", [row], { Prefer: "return=minimal" });
  return entityId;
}

// ── Ana akış ──────────────────────────────────────────────────────────────
async function main() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const googleKey = process.env.GOOGLE_PLACES_API_KEY;

  const missing = [
    !supabaseUrl && "SUPABASE_URL",
    !supabaseKey && "SUPABASE_SERVICE_ROLE_KEY",
    !googleKey && "GOOGLE_PLACES_API_KEY",
  ].filter(Boolean);
  if (missing.length > 0) {
    console.error(`HATA: eksik env: ${missing.join(", ")}`);
    console.error("Repo kökünden çalıştırdığından ve .env.local'in dolu olduğundan emin ol.");
    process.exit(1);
  }

  console.log(`Şehir: ${CITY} | mod: ${APPLY ? "UYGULA" : "DRY-RUN"} | sayfa/terim: ${MAX_PAGES}`);

  const { slugs: existingSlugs, placeIds: existingPlaceIds } = await fetchExisting(
    supabaseUrl,
    supabaseKey,
  );
  if (VERBOSE) {
    console.log(`Mevcut: ${existingSlugs.size} slug, ${existingPlaceIds.size} place_id`);
  }

  // ── Keşif ───────────────────────────────────────────────────────────────
  const seen = new Map(); // place_id -> ham sonuç (terimler arası tekilleştirme)
  let searchCalls = 0;
  for (const term of SEARCH_TERMS) {
    const query = `${term} ${CITY}`;
    const results = await textSearchAll(googleKey, query, MAX_PAGES);
    searchCalls += 1;
    if (VERBOSE) console.log(`  "${query}" -> ${results.length} sonuç`);
    for (const r of results) {
      if (r.place_id && !seen.has(r.place_id)) seen.set(r.place_id, r);
    }
  }
  console.log(`Tekilleştirilmiş aday: ${seen.size} (${searchCalls} arama terimi)`);

  // ── Süzme ───────────────────────────────────────────────────────────────
  const accepted = [];
  const rejected = [];
  const cityNorm = normalizeName(CITY);

  for (const [placeId, r] of seen) {
    const name = r.name ?? "";
    const address = r.formatted_address ?? "";
    const types = Array.isArray(r.types) ? r.types : [];

    if (existingPlaceIds.has(placeId)) {
      rejected.push({ name, address, reason: "zaten kayıtlı (place_id)" });
      continue;
    }
    // Google komşu ile/ilçeye taşabiliyor — adres şehri içermiyorsa alma.
    if (!normalizeName(address).includes(cityNorm)) {
      rejected.push({ name, address, reason: `adres "${CITY}" içermiyor` });
      continue;
    }
    if (!types.some((t) => ACCEPTED_TYPES.has(t))) {
      rejected.push({ name, address, reason: `müzikle ilişkili tür yok (${types.slice(0, 3).join(", ") || "-"})` });
      continue;
    }
    const base = slugifyBase(name);
    if (!base) {
      rejected.push({ name, address, reason: "slug üretilemedi" });
      continue;
    }
    if (existingSlugs.has(base)) {
      rejected.push({ name, address, reason: "slug zaten var" });
      continue;
    }

    accepted.push({
      placeId,
      name,
      address,
      slug: base,
      venueType: mapVenueType(types),
      rating: typeof r.rating === "number" ? r.rating : null,
      ratingsTotal: typeof r.user_ratings_total === "number" ? r.user_ratings_total : null,
      lat: r.geometry?.location?.lat ?? null,
      lng: r.geometry?.location?.lng ?? null,
      types,
    });
    // Aynı koşuda iki adayın aynı slug'a düşmesini engelle.
    existingSlugs.add(base);
  }

  console.log(`Yazılabilir yeni: ${accepted.length} | elenen: ${rejected.length}`);

  // ── Yazım ───────────────────────────────────────────────────────────────
  let inserted = 0;
  const failed = [];
  if (APPLY) {
    for (const candidate of accepted) {
      try {
        // Telefon yalnız Details'te var; dry-run'da bu çağrı HİÇ yapılmaz
        // (maliyet). Başarısız olursa telefonsuz devam edilir.
        try {
          const details = await placeDetails(googleKey, candidate.placeId);
          if (details?.formatted_phone_number) candidate.phone = details.formatted_phone_number;
          if (details?.geometry?.location) {
            candidate.lat = details.geometry.location.lat ?? candidate.lat;
            candidate.lng = details.geometry.location.lng ?? candidate.lng;
          }
        } catch (e) {
          if (VERBOSE) console.warn(`  [details] ${candidate.name}: ${e.message}`);
        }
        await insertVenue(supabaseUrl, supabaseKey, candidate);
        inserted += 1;
        if (VERBOSE) console.log(`  + ${candidate.name}`);
      } catch (e) {
        failed.push({ name: candidate.name, error: e.message });
      }
    }
    console.log(`Yazılan: ${inserted}${failed.length ? ` | başarısız: ${failed.length}` : ""}`);
  } else {
    console.log("DRY-RUN — hiçbir şey yazılmadı. Yazmak için --apply ekle.");
  }

  // ── Rapor ───────────────────────────────────────────────────────────────
  const lines = [
    `# Google mekan keşfi — ${CITY}`,
    "",
    `Tarih: ${new Date().toISOString()}`,
    `Mod: ${APPLY ? "UYGULANDI" : "DRY-RUN"}`,
    `Aday: ${seen.size} | yazılabilir: ${accepted.length} | elenen: ${rejected.length}` +
      (APPLY ? ` | yazılan: ${inserted}` : ""),
    "",
    "> Satırlar `review_status='potential'`, `is_published=false` doğar —",
    "> kurucu onayı olmadan uygulamada GÖRÜNMEZ.",
    "",
    "## Yazılabilir adaylar",
    "",
    "| Ad | Adres | Tür | Puan | Enlem | Boylam |",
    "|---|---|---|---|---|---|",
    ...accepted.map(
      (c) =>
        `| ${c.name} | ${c.address} | ${c.venueType} | ${c.rating ?? "-"} | ${c.lat ?? "-"} | ${c.lng ?? "-"} |`,
    ),
    "",
    "## Elenenler",
    "",
    "| Ad | Adres | Sebep |",
    "|---|---|---|",
    ...rejected.map((r) => `| ${r.name} | ${r.address} | ${r.reason} |`),
    "",
  ];
  if (failed.length > 0) {
    lines.push("## Yazılamayanlar", "", ...failed.map((f) => `- ${f.name}: ${f.error}`), "");
  }
  lines.push(`Panel: ${PANEL_BASE_URL}/panel/admin/mekanlar`, "");

  writeFileSync(REPORT_PATH, lines.join("\n"), "utf-8");
  console.log(`Rapor: ${REPORT_PATH}`);

  // KOORDİNAT NOTU: yukarıdaki tabloda enlem/boylam var ama venue_details'te
  // kolonu YOK, bu yüzden yazılmıyorlar. Kolon eklenirse (ALTER TABLE
  // venue_details ADD COLUMN lat double precision, lng double precision) bu
  // script'teki `candidate.lat/lng` doğrudan insertVenue satırına eklenebilir
  // ve eventmatch tarafındaki mesafe sıralaması elle giriş olmadan çalışır.
}

main().catch((e) => {
  console.error(`HATA: ${e.message}`);
  process.exit(1);
});
