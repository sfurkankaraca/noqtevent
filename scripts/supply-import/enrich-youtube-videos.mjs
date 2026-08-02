#!/usr/bin/env node
/**
 * scripts/supply-import/enrich-youtube-videos.mjs
 *
 * Kurucu talebi: "kanaldan video getir" butonu (bkz. src/components/panel/ArtistEnrich.tsx
 * ChannelVideosSection) yeni sanatçılar için kalıyor, ama MEVCUT sanatçı stoğunun
 * elle bir bir video eklenmesi beklenemez. Bu script `artist_profiles`'ta
 * `video_urls` BOŞ olan TÜM sanatçıları YouTube'da arar ve GÜVEN KURALINI
 * geçen videoları otomatik ekler.
 *
 * Kapsam ve öncelik: video_urls boş olan sanatçılar, `spotify_artist_id` DOLU
 * olanlar ÖNCE işlenir — bunların adı zaten Spotify'da doğrulanmış demektir,
 * yanlış YouTube eşleşmesi riski (aynı isimli başka biri) daha düşüktür.
 *
 * Arama: her sanatçı için TEK bir search.list çağrısı (type=video,
 * q='"{ad}" konser|canlı|live') — search.list 100 birim kota harcar, bu
 * yüzden sanatçı başına birden fazla arama YAPILMAZ. Sonuçlar videos.list
 * (ucuz, contentDetails+statistics) ile süre ve izlenme sayısıyla zenginleştirilir.
 *
 * GÜVEN KURALI (otomatik ekleme için HEPSİ birden gerekli):
 *   1. Video başlığı VEYA kanal adı, normalize edilmiş sanatçı adını içeriyor
 *      (yanlış sanatçının videosunu eklememek için — itibar riski).
 *   2. Başlıkta canlı/live/konser/concert/akustik/performans/sahne
 *      kelimelerinden EN AZ biri geçiyor (stüdyo kaydı/resmi klip yerine
 *      sahne performansı hedefleniyor).
 *   3. Süre >= 60 saniye (YouTube Shorts ve kısa klip parçaları elenir).
 *
 * Bu üçünü geçen adaylardan izlenmeye göre EN İYİ EN FAZLA 3'ü video_urls'e
 * eklenir (mükerrersiz). Hiçbir aday geçemezse sanatçı "bulunamadı" raporuna
 * düşer — HİÇBİR ŞEY YAZILMAZ (yanlış video eklemek otomasyondan pahalı).
 *
 * KOTA KORUMASI: YouTube Data API v3 günlük varsayılan kota 10.000 birim.
 * search.list = 100 birim/çağrı, sanatçı başına tam 1 çağrı. Script varsayılan
 * olarak --limit=90 sanatçıda durur (9.000 birim — panelin diğer
 * search.list kullanımlarına, ör. spotify/youtube-search route'larına, pay
 * bırakır) ve "kalan X sanatçı, yarın tekrar çalıştır" der. HTTP 403
 * quotaExceeded gelirse script o ana kadarki işi TEMİZ biçimde raporlayıp
 * durur (kalan sanatçılara hiç dokunmaz).
 *
 * İDEMPOTENT: sorgu video_urls BOŞ olan satırları hedefler — bir kez video
 * eklenen sanatçı bir sonraki koşuda otomatik atlanır. Script'i her gün
 * (veya yeni sanatçı geldikçe) tekrar çalıştırmak güvenlidir.
 *
 * Kullanım:
 *   node scripts/supply-import/enrich-youtube-videos.mjs                # dry-run
 *   node scripts/supply-import/enrich-youtube-videos.mjs --apply         # gerçek yazım
 *   node scripts/supply-import/enrich-youtube-videos.mjs --limit=20 --verbose
 *
 * Env (.env.local otomatik yüklenir, repo kökünden çalıştırılmalı):
 *   SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL (ikisi de kabul edilir)
 *   SUPABASE_SERVICE_ROLE_KEY
 *   YOUTUBE_API_KEY
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

// ── .env.local yükleme (diğer supply-import script'leriyle AYNI yardımcı) ──
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
// search.list kota bütçesi — bkz. dosya başı "KOTA KORUMASI" notu.
const LIMIT = Number(getOpt("limit", "90"));

if (hasFlag("help")) {
  console.log(readFileSync(new URL(import.meta.url), "utf-8").split("*/")[0]);
  process.exit(0);
}

const MAX_VIDEOS_PER_ARTIST = 3;
const MIN_DURATION_SECONDS = 60;
const LIVE_KEYWORDS = ["canli", "live", "konser", "concert", "akustik", "performans", "sahne"];
const PANEL_BASE_URL = "https://panel.noqt.social";

// ── yardımcılar ───────────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const TR_FOLD = { ç: "c", Ç: "c", ğ: "g", Ğ: "g", ı: "i", İ: "i", ö: "o", Ö: "o", ş: "s", Ş: "s", ü: "u", Ü: "u" };

function normalize(input) {
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

function normalizeCompact(input) {
  return normalize(input).replace(/\s+/g, "");
}

function parseIsoDurationSeconds(iso) {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso || "");
  if (!m) return 0;
  const h = Number(m[1] || 0);
  const min = Number(m[2] || 0);
  const s = Number(m[3] || 0);
  return h * 3600 + min * 60 + s;
}

function hasLiveKeyword(title) {
  const normalized = normalize(title);
  return LIVE_KEYWORDS.some((kw) => normalized.includes(kw));
}

function titleOrChannelMatchesArtist(title, channelTitle, artistName) {
  const target = normalizeCompact(artistName);
  if (!target) return false;
  return normalizeCompact(title).includes(target) || normalizeCompact(channelTitle).includes(target);
}

// ── YouTube Data API v3 ──────────────────────────────────────────────────
class QuotaExceededError extends Error {}

async function youtubeGet(url) {
  const res = await fetch(url);
  if (res.status === 403) {
    const body = await res.json().catch(() => ({}));
    const reason = body?.error?.errors?.[0]?.reason || body?.error?.status || "";
    if (String(reason).toLowerCase().includes("quota")) {
      throw new QuotaExceededError(`YouTube API kota aşıldı: ${JSON.stringify(body?.error ?? {}).slice(0, 300)}`);
    }
    throw new Error(`YouTube API 403: ${JSON.stringify(body?.error ?? {}).slice(0, 300)}`);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`YouTube API isteği başarısız: HTTP ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json();
}

// Tek search.list çağrısı — sanatçı başına 100 birim, BİR KEZ.
async function searchLiveVideos(apiKey, artistName, limit = 10) {
  const q = `"${artistName}" konser|canlı|live`;
  const url =
    `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=${limit}` +
    `&q=${encodeURIComponent(q)}&key=${apiKey}`;
  const data = await youtubeGet(url);
  const items = Array.isArray(data?.items) ? data.items : [];
  return items
    .map((it) => ({
      id: it?.id?.videoId,
      title: it?.snippet?.title,
      channelTitle: it?.snippet?.channelTitle,
      publishedAt: it?.snippet?.publishedAt,
    }))
    .filter((v) => typeof v.id === "string" && typeof v.title === "string");
}

// videos.list — ucuz (1 birim, id listesi virgülle) — süre + izlenme.
async function fetchVideoDetails(apiKey, videoIds) {
  const map = new Map();
  if (videoIds.length === 0) return map;
  const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&id=${videoIds.join(",")}&key=${apiKey}`;
  const data = await youtubeGet(url);
  const items = Array.isArray(data?.items) ? data.items : [];
  for (const it of items) {
    const id = typeof it?.id === "string" ? it.id : "";
    if (!id) continue;
    const durationSeconds = parseIsoDurationSeconds(it?.contentDetails?.duration);
    const views = Number(it?.statistics?.viewCount);
    map.set(id, { durationSeconds, viewCount: Number.isFinite(views) ? views : 0 });
  }
  return map;
}

// ── PostgREST istemcisi (diğer supply-import script'leriyle AYNI desen) ────
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

// video_urls boş olan TÜM sanatçılar — array eşitlik filtresi PostgREST'te
// kırılgan (URL encoding), bu yüzden gerekli kolonları çekip client-side
// filtreliyoruz (artist_profiles satır sayısı bu yaklaşım için yeterince küçük).
async function fetchArtistsNeedingVideos(base, key) {
  const rows = [];
  const pageSize = 1000;
  let from = 0;
  for (;;) {
    const batch = await postgrest(
      base,
      key,
      "GET",
      "/artist_profiles?select=entity_id,display_name,city,spotify_artist_id,video_urls&order=display_name.asc",
      undefined,
      { Range: `${from}-${from + pageSize - 1}` }
    );
    if (!batch || batch.length === 0) break;
    rows.push(...batch);
    if (batch.length < pageSize) break;
    from += pageSize;
  }
  const needsVideos = rows.filter((r) => !Array.isArray(r.video_urls) || r.video_urls.length === 0);
  // Öncelik: spotify_artist_id DOLU olanlar önce (ad doğrulanmış, bkz. dosya başı not).
  needsVideos.sort((a, b) => {
    const aHas = a.spotify_artist_id ? 0 : 1;
    const bHas = b.spotify_artist_id ? 0 : 1;
    return aHas - bHas;
  });
  return needsVideos;
}

async function applyVideos(base, key, entityId, urls) {
  await postgrest(base, key, "PATCH", `/artist_profiles?entity_id=eq.${entityId}`, { video_urls: urls }, {
    Prefer: "return=minimal",
  });
}

function formatVideo(v) {
  return `"${v.title}" — ${v.viewCount.toLocaleString("tr-TR")} izlenme — ${v.url}`;
}

function writeReport({ scannedCount, processedCount, addedRows, notFoundRows, quotaHit, remaining }) {
  const now = new Date().toISOString();
  const lines = [];
  lines.push("# YouTube canlı/konser video eşleştirme raporu");
  lines.push("");
  lines.push(
    "Bu dosya `scripts/supply-import/enrich-youtube-videos.mjs` her koşuda ÜZERİNE YAZILIR (birikmez) — yalnız EN SON koşunun sonuçlarını gösterir."
  );
  lines.push("");
  lines.push(`Son çalıştırma: ${now} (${APPLY ? "APPLY — yazıldı" : "DRY RUN — hiçbir şey yazılmadı"})`);
  lines.push("");
  lines.push(`- Kapsamdaki sanatçı (video_urls boş): ${scannedCount}`);
  lines.push(`- Bu koşuda işlenen: ${processedCount}${quotaHit ? " (kota aşımı nedeniyle erken durduruldu)" : ""}`);
  lines.push(`- Video eklenen: ${addedRows.length}`);
  lines.push(`- Uygun video bulunamayan: ${notFoundRows.length}`);
  if (remaining > 0) {
    lines.push(`- İşlenmeyen (bir sonraki koşuya kalan): ${remaining}`);
  }
  lines.push("");

  if (quotaHit) {
    lines.push("## Kota durumu");
    lines.push("");
    lines.push(
      "YouTube API günlük kota sınırına ulaşıldı (HTTP 403 quotaExceeded) — script o ana kadarki işi kaydedip temiz durdu. Yarın (kota sıfırlandıktan sonra) aynı komutu tekrar çalıştırmak kaldığı yerden devam eder (video_urls dolu olan sanatçılar otomatik atlanır)."
    );
    lines.push("");
  }

  if (addedRows.length > 0) {
    lines.push(`## Eklenen videolar (${addedRows.length})`);
    lines.push("");
    for (const { row, videos } of addedRows) {
      lines.push(`### ${row.display_name}${row.city ? ` — ${row.city}` : ""}`);
      lines.push(`- Panel: ${PANEL_BASE_URL}/panel/admin/sanatcilar/${row.entity_id}`);
      for (const v of videos) lines.push(`  - ${formatVideo(v)}`);
      lines.push("");
    }
  }

  if (notFoundRows.length > 0) {
    lines.push(`## Uygun video bulunamayan (${notFoundRows.length})`);
    lines.push("");
    lines.push(
      "Güven kuralını (ad eşleşmesi + canlı/konser anahtar kelimesi + süre ≥ 60sn) geçen video yok — panelden \"Kanaldan video getir\" veya elle video linki eklenebilir."
    );
    lines.push("");
    for (const { row } of notFoundRows) {
      lines.push(`- ${row.display_name}${row.city ? ` (${row.city})` : ""} — ${PANEL_BASE_URL}/panel/admin/sanatcilar/${row.entity_id}`);
    }
    lines.push("");
  }

  const outPath = path.join(process.cwd(), "ops", "youtube-video-raporu.md");
  writeFileSync(outPath, lines.join("\n"), "utf-8");
  return outPath;
}

// ── ana akış ──────────────────────────────────────────────────────────────
async function main() {
  console.log("================================================================");
  console.log(` NOQT sanatçı canlı/konser video zenginleştirme — ${APPLY ? "APPLY (yazılıyor)" : "DRY RUN (yazma yapılmıyor)"}`);
  console.log("================================================================\n");

  const { url: supabaseUrl, key: supabaseKey } = getSupabaseConfig();
  if (!supabaseUrl || !supabaseKey) {
    console.error("SUPABASE_URL (veya NEXT_PUBLIC_SUPABASE_URL) ve SUPABASE_SERVICE_ROLE_KEY gerekli.");
    process.exit(1);
  }
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.error("YOUTUBE_API_KEY gerekli.");
    process.exit(1);
  }

  console.log("video_urls boş olan sanatçılar çekiliyor (spotify_artist_id dolu olanlar önce sıralanır)...");
  const rows = await fetchArtistsNeedingVideos(supabaseUrl, supabaseKey);
  console.log(`  ${rows.length} sanatçı bulundu — bu koşuda en fazla ${LIMIT} işlenecek.\n`);

  if (rows.length === 0) {
    console.log("Zenginleştirilecek sanatçı yok — video_urls dolu olmayan kimse kalmamış.");
    return;
  }

  const toProcess = rows.slice(0, LIMIT);
  const addedRows = [];
  const notFoundRows = [];
  let processedCount = 0;
  let quotaHit = false;

  for (let i = 0; i < toProcess.length; i++) {
    const row = toProcess[i];
    if (VERBOSE) console.log(`[${i + 1}/${toProcess.length}] ${row.display_name}`);

    let searchResults;
    try {
      searchResults = await searchLiveVideos(apiKey, row.display_name, 10);
    } catch (err) {
      if (err instanceof QuotaExceededError) {
        console.error(`\n[kota] ${err.message}`);
        quotaHit = true;
        break;
      }
      console.error(`  [hata] ${row.display_name}: ${err.message}`);
      notFoundRows.push({ row });
      processedCount++;
      await sleep(200);
      continue;
    }

    processedCount++;

    if (searchResults.length === 0) {
      notFoundRows.push({ row });
      await sleep(200);
      continue;
    }

    let details;
    try {
      details = await fetchVideoDetails(apiKey, searchResults.map((v) => v.id));
    } catch (err) {
      if (err instanceof QuotaExceededError) {
        console.error(`\n[kota] ${err.message}`);
        quotaHit = true;
        break;
      }
      console.error(`  [detay hatası] ${row.display_name}: ${err.message}`);
      notFoundRows.push({ row });
      await sleep(200);
      continue;
    }

    const candidates = searchResults
      .map((v) => {
        const d = details.get(v.id) ?? { durationSeconds: 0, viewCount: 0 };
        return { ...v, ...d, url: `https://www.youtube.com/watch?v=${v.id}` };
      })
      .filter((v) => v.durationSeconds >= MIN_DURATION_SECONDS)
      .filter((v) => hasLiveKeyword(v.title))
      .filter((v) => titleOrChannelMatchesArtist(v.title, v.channelTitle, row.display_name))
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, MAX_VIDEOS_PER_ARTIST);

    if (candidates.length === 0) {
      notFoundRows.push({ row });
      await sleep(200);
      continue;
    }

    if (VERBOSE) {
      console.log(`  -> ${candidates.length} video geçti güven kuralını:`);
      for (const c of candidates) console.log(`     ${formatVideo(c)}`);
    }

    addedRows.push({ row, videos: candidates });

    if (APPLY) {
      try {
        const existing = Array.isArray(row.video_urls) ? row.video_urls : [];
        const merged = Array.from(new Set([...existing, ...candidates.map((c) => c.url)]));
        await applyVideos(supabaseUrl, supabaseKey, row.entity_id, merged);
      } catch (err) {
        console.error(`  [yazım hatası] ${row.display_name}: ${err.message}`);
      }
    }

    await sleep(250); // YouTube kotasına nazik davran
  }

  const remaining = rows.length - processedCount;

  console.log("\n================================================================");
  console.log(" Sonuç");
  console.log("================================================================");
  console.log(`Kapsam: ${rows.length} sanatçı | İşlenen: ${processedCount}${quotaHit ? " (kota aşımı — erken durdu)" : ""}`);
  console.log(`Video eklenen: ${addedRows.length}${APPLY ? "" : " (dry-run — henüz yazılmadı)"}`);
  console.log(`Uygun video bulunamayan: ${notFoundRows.length}`);
  if (remaining > 0) console.log(`Kalan (bir sonraki koşuya): ${remaining} — yarın (kota sıfırlanınca) tekrar çalıştır.`);

  const reportPath = writeReport({
    scannedCount: rows.length,
    processedCount,
    addedRows,
    notFoundRows,
    quotaHit,
    remaining,
  });
  console.log(`\nRapor yazıldı: ${reportPath}`);

  if (!APPLY) {
    console.log("\nBu bir DRY RUN'dı — hiçbir şey yazılmadı. Gerçek yazım için --apply ekleyin.");
  }
}

main().catch((err) => {
  console.error("\nBeklenmeyen hata:", err);
  process.exit(1);
});
