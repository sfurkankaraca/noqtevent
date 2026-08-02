#!/usr/bin/env node
/**
 * scripts/supply-import/enrich-google-venues.mjs
 *
 * venue_details'te google_place_id BOŞ olan TÜM mekanları (review_status ile
 * SINIRLI DEĞİL — enrich-spotify.mjs'teki AYNI gerekçe) Google Places'te
 * (legacy Text Search — bkz. src/lib/panel/googlePlaces.ts başındaki not:
 * mevcut GOOGLE_PLACES_API_KEY Places API (New)'i DEĞİL, yalnız legacy'yi
 * destekliyor, canlı denemeyle doğrulandı) arar ve GÜVEN KURALINI geçenleri
 * otomatik uygular:
 *
 *   normalize edilmiş ad Google'ın ilk sonucuyla BİREBİR eşleşiyor VEYA ÇOK
 *   YAKIN (bkz. NAME_SIMILARITY_THRESHOLD) VE ilk sonucun adresi beklenen
 *   şehri (bkz. aşağıdaki not) içeriyor => otomatik uygulanır (--apply ile;
 *   dry-run'da yalnız sayılır).
 *
 * Bu ikisinden biri sağlanmazsa satır "şüpheli" sayılır ve HİÇBİR ŞEY
 * YAZILMAZ — yanlış mekanın adresini/fotoğrafını basmak (itibar riski)
 * otomatik eşleştirmeden çok daha pahalı. Şüpheli satırlar
 * ops/google-mekan-eslesme-raporu.md'ye, panelden tek tıkla düzeltilebilecek
 * bir link ve aday listesiyle yazılır.
 *
 * NOT (şehir): venue_details'te ayrı bir `city` kolonu YOK (yalnız
 * `district`) — bkz. eventmatch/functions/src/supplySync.ts'teki aynı not.
 * Mevcut mekanların tamamı Kayseri/Nevşehir pazarında; bu script "beklenen
 * şehir" olarak "Kayseri"yi VARSAYAR (arama sorgusuna da eklenir) ve adayın
 * adresinde "kayseri" veya mekanın kendi `district` alanı geçiyor mu diye
 * bakar. Nevşehir'deki mekanlar için bu kontrol yanlış negatif üretebilir —
 * o satırlar "şüpheli" listesine düşer, elle panelden çözülür (veri kaybı
 * YOK, yalnız otomasyon atlanır).
 *
 * Uygulanan alanlar (venue-google-apply route'uyla AYNI kural, bkz.
 * src/app/api/panel/enrich/venue-google-apply/route.ts):
 *   - google_place_id/google_rating/google_ratings_total/enriched_at: HER
 *     ZAMAN yazılır.
 *   - address/google_maps_phone: YALNIZ BOŞSA doldurulur (kurucunun elle
 *     girdiği bilgi ASLA ezilmez).
 *   - photo_urls: mekan başına en fazla PHOTOS_PER_VENUE (varsayılan 4 —
 *     panel route'undaki 6'dan DÜŞÜK, toplu koşuda maliyet/kota nedeniyle)
 *     fotoğraf server-side indirilip Supabase Storage'a ({entityId}/gp-{i}.jpg,
 *     upsert:true) yüklenir; mevcut galeri (kurucunun elle yüklediği
 *     fotoğraflar) KORUNUR, yalnız önceki gp-N girişlerinin yerini alır.
 *     Hotlink YASAK — Google foto URL'si API anahtarını query'de taşır.
 *
 * İDEMPOTENT: sorgu zaten google_place_id IS NULL ile filtreliyor — bir kez
 * eşleştirilen/uygulanan satır bir daha sorguya girmez.
 *
 * Kullanım:
 *   node scripts/supply-import/enrich-google-venues.mjs                # dry-run
 *   node scripts/supply-import/enrich-google-venues.mjs --apply         # gerçek yazım
 *   node scripts/supply-import/enrich-google-venues.mjs --limit=50 --verbose
 *
 * Env (.env.local otomatik yüklenir, repo kökünden çalıştırılmalı):
 *   SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL (ikisi de kabul edilir)
 *   SUPABASE_SERVICE_ROLE_KEY
 *   GOOGLE_PLACES_API_KEY
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

// ── .env.local yükleme (enrich-spotify.mjs ile AYNI yardımcı) ──────────────
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

const APPLY = hasFlag("apply");
const VERBOSE = hasFlag("verbose");
const LIMIT = getOpt("limit", null) ? Number(getOpt("limit", null)) : null;

if (hasFlag("help")) {
  console.log(readFileSync(new URL(import.meta.url), "utf-8").split("*/")[0]);
  process.exit(0);
}

// "Birebir veya çok yakın" eşiği — normalize edilmiş Levenshtein benzerliği
// (0-1 ölçek). Google'ın kısaltma/nokta/şirket-eki farklarını (ör. "Soldout"
// vs "Sold Out") tolere etmek için 1.0'ın biraz altında, ama yanlış mekanı
// otomatik bağlamayacak kadar muhafazakâr.
const NAME_SIMILARITY_THRESHOLD = 0.88;
// Toplu koşuda mekan başına indirilecek Google fotoğrafı üst sınırı —
// panel route'undaki (6) tek tek uygulamadan DÜŞÜK, çünkü bu script tüm
// mekan envanterini tek seferde geçebilir (maliyet/kota).
const PHOTOS_PER_VENUE = 4;

const PANEL_BASE_URL = "https://panel.noqt.social";
const LEGACY_BASE = "https://maps.googleapis.com/maps/api/place";
const STORAGE_BUCKET = "images";

// ── yardımcılar ───────────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const TR_FOLD = { ç: "c", Ç: "c", ğ: "g", Ğ: "g", ı: "i", İ: "i", ö: "o", Ö: "o", ş: "s", Ş: "s", ü: "u", Ü: "u" };

function normalizeName(input) {
  const folded = String(input || "")
    .split("")
    .map((ch) => TR_FOLD[ch] ?? ch)
    .join("");
  return folded
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      dp[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = temp;
    }
  }
  return dp[n];
}

function nameSimilarity(a, b) {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  const dist = levenshtein(na, nb);
  const maxLen = Math.max(na.length, nb.length);
  return maxLen === 0 ? 0 : 1 - dist / maxLen;
}

// Bkz. dosya başı "NOT (şehir)" açıklaması.
function cityMatches(address, district) {
  if (!address) return false;
  const normalizedAddr = normalizeName(address);
  if (normalizedAddr.includes("kayseri")) return true;
  if (district && normalizedAddr.includes(normalizeName(district))) return true;
  return false;
}

// ── Google Places (legacy) — 429/OVER_QUERY_LIMIT'te artan bekleme ile en
// fazla 4 deneme (enrich-spotify.mjs'teki searchSpotifyArtist ile AYNI desen).
async function placesGet(urlObj, attempt = 0) {
  const res = await fetch(urlObj);
  if (res.status === 429) {
    if (attempt >= 3) throw new Error(`Google Places 429 tekrar denemeleri tükendi (${urlObj.pathname})`);
    const wait = (attempt + 1) * 1000;
    if (VERBOSE) console.warn(`  [places] HTTP 429 — ${wait}ms bekleniyor (deneme ${attempt + 1}/4)`);
    await sleep(wait);
    return placesGet(urlObj, attempt + 1);
  }
  if (!res.ok) throw new Error(`Google Places isteği başarısız: HTTP ${res.status} (${urlObj.pathname})`);
  const data = await res.json();
  if (data.status === "OVER_QUERY_LIMIT") {
    if (attempt >= 3) throw new Error(`Google Places OVER_QUERY_LIMIT tekrar denemeleri tükendi (${urlObj.pathname})`);
    const wait = (attempt + 1) * 1500;
    if (VERBOSE) console.warn(`  [places] OVER_QUERY_LIMIT — ${wait}ms bekleniyor (deneme ${attempt + 1}/4)`);
    await sleep(wait);
    return placesGet(urlObj, attempt + 1);
  }
  return data;
}

async function searchGooglePlacesText(apiKey, query, limit = 5) {
  const url = new URL(`${LEGACY_BASE}/textsearch/json`);
  url.searchParams.set("query", query);
  url.searchParams.set("language", "tr");
  url.searchParams.set("region", "tr");
  url.searchParams.set("key", apiKey);

  const data = await placesGet(url);
  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(`Google Places arama hatası ("${query}"): ${data.status}${data.error_message ? ` — ${data.error_message}` : ""}`);
  }
  const results = Array.isArray(data.results) ? data.results : [];
  return results.slice(0, limit).map((r) => ({
    placeId: typeof r.place_id === "string" ? r.place_id : "",
    name: typeof r.name === "string" ? r.name : "",
    address: typeof r.formatted_address === "string" ? r.formatted_address : null,
    rating: typeof r.rating === "number" ? r.rating : null,
    ratingsTotal: typeof r.user_ratings_total === "number" ? r.user_ratings_total : null,
  })).filter((p) => p.placeId && p.name);
}

async function getGooglePlaceDetails(apiKey, placeId) {
  const url = new URL(`${LEGACY_BASE}/details/json`);
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "place_id,name,formatted_address,formatted_phone_number,rating,user_ratings_total,photo");
  url.searchParams.set("language", "tr");
  url.searchParams.set("key", apiKey);

  const data = await placesGet(url);
  if (data.status !== "OK") return null;
  const r = data.result ?? {};
  const photos = Array.isArray(r.photos) ? r.photos : [];
  return {
    placeId: typeof r.place_id === "string" ? r.place_id : placeId,
    name: typeof r.name === "string" ? r.name : "",
    address: typeof r.formatted_address === "string" ? r.formatted_address : null,
    phone: typeof r.formatted_phone_number === "string" ? r.formatted_phone_number : null,
    rating: typeof r.rating === "number" ? r.rating : null,
    ratingsTotal: typeof r.user_ratings_total === "number" ? r.user_ratings_total : null,
    photoReferences: photos.map((p) => (typeof p.photo_reference === "string" ? p.photo_reference : "")).filter(Boolean),
  };
}

// Hotlink YASAK — server-side indirip Supabase Storage'a yüklüyoruz.
async function downloadGooglePlacePhoto(apiKey, photoReference, maxWidth = 1200) {
  const url = new URL(`${LEGACY_BASE}/photo`);
  url.searchParams.set("photo_reference", photoReference);
  url.searchParams.set("maxwidth", String(maxWidth));
  url.searchParams.set("key", apiKey);

  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) return null;
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) return null;
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// ── Supabase Storage (REST, service_role) — src/app/api/panel/media/upload
// route'unun yaptığının elle (supabase-js olmadan) karşılığı.
async function uploadToStorage(supabaseUrl, serviceKey, storagePath, buffer, contentType) {
  const res = await fetch(`${supabaseUrl}/storage/v1/object/${STORAGE_BUCKET}/${storagePath}`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": contentType,
      "x-upsert": "true",
    },
    body: buffer,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Storage yükleme hatası (${storagePath}): HTTP ${res.status}: ${text.slice(0, 300)}`);
  }
  return `${supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${storagePath}`;
}

// ── PostgREST istemcisi (enrich-spotify.mjs ile AYNI desen) ────────────────
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

async function fetchVenuesNeedingEnrichment(base, key) {
  const rows = [];
  const pageSize = 500;
  let from = 0;
  for (;;) {
    const batch = await postgrest(
      base,
      key,
      "GET",
      "/venue_details?select=entity_id,name,district,address,google_maps_phone,photo_urls,review_status&google_place_id=is.null&order=name.asc",
      undefined,
      { Range: `${from}-${from + pageSize - 1}` }
    );
    if (!batch || batch.length === 0) break;
    rows.push(...batch);
    if (batch.length < pageSize) break;
    from += pageSize;
  }
  return LIMIT ? rows.slice(0, LIMIT) : rows;
}

async function applyEnrichment(supabaseUrl, serviceKey, apiKey, row, details) {
  const uploadedUrls = [];
  const refs = details.photoReferences.slice(0, PHOTOS_PER_VENUE);
  for (let i = 0; i < refs.length; i++) {
    try {
      const buffer = await downloadGooglePlacePhoto(apiKey, refs[i], 1200);
      if (!buffer) continue;
      const storagePath = `${row.entity_id}/gp-${i}.jpg`;
      const publicUrl = await uploadToStorage(supabaseUrl, serviceKey, storagePath, buffer, "image/jpeg");
      uploadedUrls.push(publicUrl);
    } catch (err) {
      console.error(`  [foto hatası] ${row.name} (ref ${i}): ${err.message}`);
    }
    await sleep(150);
  }

  const existingUrls = Array.isArray(row.photo_urls) ? row.photo_urls : [];
  const gpMarker = `/${row.entity_id}/gp-`;
  const keptUrls = existingUrls.filter((u) => !u.includes(gpMarker));
  const mergedPhotoUrls = uploadedUrls.length > 0 ? [...keptUrls, ...uploadedUrls] : existingUrls;

  const update = {
    google_place_id: details.placeId,
    google_rating: details.rating,
    google_ratings_total: details.ratingsTotal,
    enriched_at: new Date().toISOString(),
    photo_urls: mergedPhotoUrls,
  };
  // Kurucunun elle girdiği adres/telefonu EZME — yalnız hâlâ boşsa doldur.
  if (!row.address && details.address) update.address = details.address;
  if (!row.google_maps_phone && details.phone) update.google_maps_phone = details.phone;

  await postgrest(supabaseUrl, serviceKey, "PATCH", `/venue_details?entity_id=eq.${row.entity_id}`, update, {
    Prefer: "return=minimal",
  });

  return uploadedUrls.length;
}

function formatCandidate(c) {
  const ratingText = typeof c.rating === "number" ? `puan ${c.rating.toFixed(1)}` : "puan yok";
  const ratingsTotalText = typeof c.ratingsTotal === "number" ? `${c.ratingsTotal.toLocaleString("tr-TR")} değerlendirme` : "";
  return `"${c.name}" — ${c.address ?? "adres yok"} — ${ratingText}${ratingsTotalText ? `, ${ratingsTotalText}` : ""} — place_id: ${c.placeId}`;
}

function writeReport({ scannedCount, autoCount, suspiciousRows, noMatchRows }) {
  const now = new Date().toISOString();
  const lines = [];
  lines.push("# Google Places mekan eşleştirme raporu");
  lines.push("");
  lines.push(
    `Bu dosya \`scripts/supply-import/enrich-google-venues.mjs\` her koşuda ÜZERİNE YAZILIR (birikmez) — yalnız EN SON koşunun şüpheli/eşleşmeyen satırlarını gösterir.`
  );
  lines.push("");
  lines.push(`Son çalıştırma: ${now} (${APPLY ? "APPLY — yazıldı" : "DRY RUN — hiçbir şey yazılmadı"})`);
  lines.push("");
  lines.push(`- Taranan mekan (google_place_id boş): ${scannedCount}`);
  lines.push(`- Otomatik eşleşen (${APPLY ? "uygulandı" : "uygulanacaktı, dry-run"}): ${autoCount}`);
  lines.push(`- Şüpheli (elle çözülmeli): ${suspiciousRows.length}`);
  lines.push(`- Google'da hiç sonuç bulunamayan: ${noMatchRows.length}`);
  lines.push("");

  if (suspiciousRows.length > 0) {
    lines.push(`## Şüpheli eşleşmeler (${suspiciousRows.length})`);
    lines.push("");
    lines.push(
      "Panel linkine tıklayıp mekan formundaki \"Google'dan doldur\" arama kutusuyla doğru adayı seçip Uygula'ya basman yeterli."
    );
    lines.push("");
    for (const { row, candidates, reason } of suspiciousRows) {
      lines.push(`### ${row.name}${row.district ? ` — ${row.district}` : ""}`);
      lines.push(`- Panel: ${PANEL_BASE_URL}/panel/admin/mekanlar/${row.entity_id}`);
      lines.push(`- Neden şüpheli: ${reason}`);
      lines.push("- Google adayları:");
      for (const c of candidates) lines.push(`  - ${formatCandidate(c)}`);
      lines.push("");
    }
  }

  if (noMatchRows.length > 0) {
    lines.push(`## Sonuç bulunamayan (${noMatchRows.length})`);
    lines.push("");
    for (const { row } of noMatchRows) {
      lines.push(`- ${row.name}${row.district ? ` (${row.district})` : ""} — ${PANEL_BASE_URL}/panel/admin/mekanlar/${row.entity_id}`);
    }
    lines.push("");
  }

  const outPath = path.join(process.cwd(), "ops", "google-mekan-eslesme-raporu.md");
  writeFileSync(outPath, lines.join("\n"), "utf-8");
  return outPath;
}

// Güven kuralı — bkz. dosya başı açıklama.
function decideMatch(row, candidates) {
  if (candidates.length === 0) return { verdict: "no_match" };
  const top = candidates[0];
  const sim = nameSimilarity(row.name, top.name);
  const cityOk = cityMatches(top.address, row.district);
  if (sim >= NAME_SIMILARITY_THRESHOLD && cityOk) {
    return { verdict: "auto", reason: `Ad benzerliği %${Math.round(sim * 100)}, şehir eşleşiyor` };
  }
  if (sim >= NAME_SIMILARITY_THRESHOLD) {
    return { verdict: "suspicious", reason: `Ad benzerliği yüksek (%${Math.round(sim * 100)}) ama adres beklenen şehri içermiyor` };
  }
  return { verdict: "suspicious", reason: `Ad benzerliği yetersiz (%${Math.round(sim * 100)}, eşik %${Math.round(NAME_SIMILARITY_THRESHOLD * 100)})` };
}

// ── ana akış ──────────────────────────────────────────────────────────────
async function main() {
  console.log("================================================================");
  console.log(` NOQT Google Places mekan zenginleştirme — ${APPLY ? "APPLY (yazılıyor)" : "DRY RUN (yazma yapılmıyor)"}`);
  console.log("================================================================\n");

  const { url: supabaseUrl, key: supabaseKey } = getSupabaseConfig();
  if (!supabaseUrl || !supabaseKey) {
    console.error("SUPABASE_URL (veya NEXT_PUBLIC_SUPABASE_URL) ve SUPABASE_SERVICE_ROLE_KEY gerekli.");
    process.exit(1);
  }
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.error("GOOGLE_PLACES_API_KEY gerekli.");
    process.exit(1);
  }

  console.log("Zenginleştirme bekleyen mekanlar çekiliyor (google_place_id IS NULL, review_status ile SINIRLI DEĞİL)...");
  const rows = await fetchVenuesNeedingEnrichment(supabaseUrl, supabaseKey);
  console.log(`  ${rows.length} mekan bulundu${LIMIT ? ` (--limit=${LIMIT} uygulandı)` : ""}.\n`);

  if (rows.length === 0) {
    console.log("Zenginleştirilecek mekan yok — hepsi zaten eşleştirilmiş.");
    return;
  }

  let autoCount = 0;
  let autoFailed = 0;
  let photosDownloaded = 0;
  const suspiciousRows = [];
  const noMatchRows = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const query = [row.name, row.district, "Kayseri"].filter(Boolean).join(" ").trim();
    if (VERBOSE) console.log(`[${i + 1}/${rows.length}] ${row.name} — sorgu: "${query}"`);

    let candidates;
    try {
      candidates = await searchGooglePlacesText(apiKey, query, 5);
    } catch (err) {
      console.error(`  [hata] ${row.name}: ${err.message}`);
      noMatchRows.push({ row });
      await sleep(200);
      continue;
    }

    const decision = decideMatch(row, candidates);
    if (decision.verdict === "no_match") {
      noMatchRows.push({ row });
    } else if (decision.verdict === "suspicious") {
      suspiciousRows.push({ row, candidates: candidates.slice(0, 3), reason: decision.reason });
    } else {
      const top = candidates[0];
      if (VERBOSE) console.log(`  -> otomatik: ${formatCandidate(top)} (${decision.reason})`);
      if (APPLY) {
        try {
          const details = await getGooglePlaceDetails(apiKey, top.placeId);
          if (!details) throw new Error("Place Details boş döndü");
          const photoCount = await applyEnrichment(supabaseUrl, supabaseKey, apiKey, row, details);
          photosDownloaded += photoCount;
          autoCount++;
        } catch (err) {
          autoFailed++;
          console.error(`  [yazım hatası] ${row.name}: ${err.message}`);
        }
      } else {
        autoCount++;
      }
    }

    await sleep(250); // Google Places kotasına nazik davran
  }

  console.log("\n================================================================");
  console.log(" Sonuç");
  console.log("================================================================");
  console.log(`Taranan: ${rows.length}`);
  console.log(`Otomatik eşleşen: ${autoCount}${APPLY ? "" : " (dry-run — henüz yazılmadı)"}${autoFailed ? ` (${autoFailed} yazım hatası)` : ""}`);
  if (APPLY) console.log(`İndirilen fotoğraf: ${photosDownloaded}`);
  console.log(`Şüpheli: ${suspiciousRows.length}`);
  console.log(`Sonuç bulunamayan: ${noMatchRows.length}`);

  const reportPath = writeReport({ scannedCount: rows.length, autoCount, suspiciousRows, noMatchRows });
  console.log(`\nRapor yazıldı: ${reportPath}`);

  if (!APPLY) {
    console.log("\nBu bir DRY RUN'dı — hiçbir şey yazılmadı. Gerçek yazım için --apply ekleyin.");
  }
}

main().catch((err) => {
  console.error("\nBeklenmeyen hata:", err);
  process.exit(1);
});
