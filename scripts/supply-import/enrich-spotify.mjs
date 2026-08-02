#!/usr/bin/env node
/**
 * scripts/supply-import/enrich-spotify.mjs
 *
 * artist_profiles'ta spotify_artist_id BOŞ olan TÜM sanatçıları (review_status
 * ile SINIRLI DEĞİL — potential/approved hepsi kapsanır, kurucu talebi: "var
 * olan sanatçılara otomatik, yeni sanatçılara buton" akışı) Spotify'da arar ve
 * GÜVEN KURALINI geçenleri otomatik uygular:
 *
 *   normalize edilmiş ad Spotify'ın ilk sonucuyla BİREBİR eşleşiyor
 *   VE (ikinci bir aday yoksa OTOMATİK; varsa 1. ile 2. adayın popülerlik
 *       farkı belirgin — bkz. POPULARITY_GAP_THRESHOLD)
 *   => otomatik uygulanır (--apply ile; dry-run'da yalnız sayılır).
 *
 * Bu ikisinden biri sağlanmazsa satır "şüpheli" sayılır ve HİÇBİR ŞEY
 * YAZILMAZ — yanlış sanatçının fotoğrafını/profilini basmak (itibar riski)
 * otomatik eşleştirmeden çok daha pahalı. Şüpheli satırlar
 * ops/spotify-eslesme-raporu.md'ye, panelden tek tıkla düzeltilebilecek
 * bir link ve aday listesiyle yazılır.
 *
 * Uygulanan alanlar (spotify-apply route'uyla AYNI kural, bkz.
 * src/app/api/panel/enrich/spotify-apply/route.ts):
 *   - photo_url: YALNIZ BOŞSA Spotify görseliyle doldurulur (kurucunun elle
 *     koyduğu kapak ASLA ezilmez).
 *   - genres: mevcut + Spotify türlerinin BİRLEŞİMİ (tekrarsız).
 *   - links.spotify, spotify_artist_id, spotify_popularity, spotify_followers,
 *     enriched_at.
 *
 * İDEMPOTENT: sorgu zaten spotify_artist_id IS NULL ile filtreliyor — bir
 * kez eşleştirilen/uygulanan satır bir daha sorguya girmez. Script'i yeni
 * sanatçılar geldikçe (ör. import-external.mjs koşusundan sonra) tekrar
 * tekrar çalıştırmak güvenlidir.
 *
 * Kullanım:
 *   node scripts/supply-import/enrich-spotify.mjs                # dry-run
 *   node scripts/supply-import/enrich-spotify.mjs --apply         # gerçek yazım
 *   node scripts/supply-import/enrich-spotify.mjs --limit=50 --verbose
 *
 * Env (.env.local otomatik yüklenir, repo kökünden çalıştırılmalı):
 *   SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL (ikisi de kabul edilir)
 *   SUPABASE_SERVICE_ROLE_KEY
 *   SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

// ── .env.local yükleme (import-external.mjs ile AYNI yardımcı) ─────────────
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

// Aynı isimli iki farklı sanatçıyı ayırt etmek için "belirgin popülerlik
// farkı" eşiği (Spotify popularity 0-100 ölçek). Keyfi ama muhafazakâr:
// gerçek dünyada aynı isimli iki sanatçı arasında bu kadar fark genelde
// birinin bilinen sanatçı, diğerinin isim benzeri amatör/yerel proje olduğu
// anlamına gelir — riskli durumlarda (fark küçükse) otomatik uygulanmaz.
const POPULARITY_GAP_THRESHOLD = 15;

const PANEL_BASE_URL = "https://panel.noqt.social";

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

// ── Spotify Client Credentials (spotify-proxy.ts / src/lib/panel/spotify.ts ile AYNI akış) ──
let cachedToken;
let tokenExpiresAt = 0;

async function getSpotifyToken(clientId, clientSecret) {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`Spotify token isteği başarısız: HTTP ${res.status}`);
  const data = await res.json();
  if (!data.access_token) throw new Error("Spotify token yanıtında access_token yok.");
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + Math.max(60, Number(data.expires_in ?? 3600) - 60) * 1000;
  return cachedToken;
}

// 429'da Retry-After'a (yoksa artan bekleme) uyarak en fazla 4 deneme.
async function searchSpotifyArtist(token, name, limit = 5) {
  const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(name)}&type=artist&limit=${limit}`;
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 429) {
      const retryAfterHeader = Number(res.headers.get("retry-after"));
      const wait = (Number.isFinite(retryAfterHeader) && retryAfterHeader > 0 ? retryAfterHeader : attempt + 1) * 1000;
      if (VERBOSE) console.warn(`  [spotify] 429 alındı ("${name}") — ${wait}ms bekleniyor (deneme ${attempt + 1}/4)`);
      await sleep(wait);
      continue;
    }
    if (!res.ok) throw new Error(`Spotify arama hatası ("${name}"): HTTP ${res.status}`);
    const data = await res.json();
    const items = Array.isArray(data?.artists?.items) ? data.artists.items : [];
    return items.map((raw) => ({
      id: raw.id,
      name: raw.name,
      popularity: typeof raw.popularity === "number" ? raw.popularity : 0,
      followers: typeof raw.followers?.total === "number" ? raw.followers.total : 0,
      genres: Array.isArray(raw.genres) ? raw.genres.filter((g) => typeof g === "string") : [],
      imageUrl: Array.isArray(raw.images) && raw.images[0]?.url ? raw.images[0].url : null,
      url: raw.external_urls?.spotify ?? `https://open.spotify.com/artist/${raw.id}`,
    }));
  }
  throw new Error(`Spotify arama hatası ("${name}"): 429 tekrar denemeleri tükendi`);
}

// Güven kuralı — bkz. dosya başı açıklama.
// REVİZYON (2026-08-02, ilk koşu 87/581 otomatik verince): popülerlik
// kıyası yalnız AYNI İSİMLİ ikinci aday varsa anlamlı — farklı isimli bir
// #2'yle kıyaslamak ("13 Killoki" vs "SWIRF") sahte şüpheli üretiyordu
// (493/581). Belirsizlik yalnız ad çakışmasında vardır: birebir eşleşen
// TEK aday varsa otomatik; birden çok aynı isimli aday varsa popülerlik
// farkı eşiği devreye girer.
function decideMatch(dbName, candidates) {
  if (candidates.length === 0) return { verdict: "no_match" };
  const target = normalizeName(dbName);
  const exactMatches = candidates.filter((c) => normalizeName(c.name) === target);
  if (exactMatches.length === 0) {
    return { verdict: "suspicious", reason: "Hiçbir adayın adı DB'deki adla birebir eşleşmiyor" };
  }
  if (exactMatches.length === 1) {
    return { verdict: "auto", reason: "Ad birebir eşleşen tek aday", candidate: exactMatches[0] };
  }
  // Aynı isimli birden çok sanatçı — gerçek belirsizlik burada.
  const [first, second] = [...exactMatches].sort((a, b) => b.popularity - a.popularity);
  const gap = first.popularity - second.popularity;
  if (gap >= POPULARITY_GAP_THRESHOLD) {
    return { verdict: "auto", reason: `${exactMatches.length} aynı isimli aday, popülerlik farkı belirgin (Δ=${gap})`, candidate: first };
  }
  return { verdict: "suspicious", reason: `${exactMatches.length} AYNI isimli aday ve popülerlik farkı yetersiz (Δ=${gap}, eşik=${POPULARITY_GAP_THRESHOLD})` };
}

// ── PostgREST istemcisi (import-external.mjs ile AYNI desen) ────────────────
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

async function fetchArtistsNeedingEnrichment(base, key) {
  const rows = [];
  const pageSize = 500;
  let from = 0;
  for (;;) {
    const batch = await postgrest(
      base,
      key,
      "GET",
      "/artist_profiles?select=entity_id,display_name,city,genres,photo_url,links,review_status&spotify_artist_id=is.null&order=display_name.asc",
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

async function applyEnrichment(base, key, row, candidate) {
  const existingGenres = Array.isArray(row.genres) ? row.genres : [];
  const mergedGenres = Array.from(new Set([...existingGenres, ...candidate.genres]));
  const links = { ...(row.links || {}) };
  links.spotify = candidate.url;

  const update = {
    genres: mergedGenres,
    links,
    spotify_artist_id: candidate.id,
    spotify_popularity: candidate.popularity,
    spotify_followers: candidate.followers,
    enriched_at: new Date().toISOString(),
  };
  // Kurucunun elle koyduğu kapağı EZME — yalnız hâlâ boşsa Spotify görseliyle doldur.
  if (!row.photo_url && candidate.imageUrl) {
    update.photo_url = candidate.imageUrl;
  }

  await postgrest(base, key, "PATCH", `/artist_profiles?entity_id=eq.${row.entity_id}`, update, {
    Prefer: "return=minimal",
  });
}

function formatCandidate(c) {
  return `"${c.name}" — popülerlik ${c.popularity}, ${c.followers.toLocaleString("tr-TR")} takipçi — ${c.url}`;
}

function writeReport({ scannedCount, autoCount, suspiciousRows, noMatchRows }) {
  const now = new Date().toISOString();
  const lines = [];
  lines.push("# Spotify eşleştirme raporu");
  lines.push("");
  lines.push(
    `Bu dosya \`scripts/supply-import/enrich-spotify.mjs\` her koşuda ÜZERİNE YAZILIR (birikmez) — yalnız EN SON koşunun şüpheli/eşleşmeyen satırlarını gösterir.`
  );
  lines.push("");
  lines.push(`Son çalıştırma: ${now} (${APPLY ? "APPLY — yazıldı" : "DRY RUN — hiçbir şey yazılmadı"})`);
  lines.push("");
  lines.push(`- Taranan sanatçı (spotify_artist_id boş): ${scannedCount}`);
  lines.push(`- Otomatik eşleşen (${APPLY ? "uygulandı" : "uygulanacaktı, dry-run"}): ${autoCount}`);
  lines.push(`- Şüpheli (elle çözülmeli): ${suspiciousRows.length}`);
  lines.push(`- Spotify'da hiç sonuç bulunamayan: ${noMatchRows.length}`);
  lines.push("");

  if (suspiciousRows.length > 0) {
    lines.push(`## Şüpheli eşleşmeler (${suspiciousRows.length})`);
    lines.push("");
    lines.push(
      "Panel linkine tıklayıp sanatçı formundaki \"Spotify'dan doldur\" arama kutusuyla doğru adayı seçip Uygula'ya basman yeterli."
    );
    lines.push("");
    for (const { row, candidates, reason } of suspiciousRows) {
      lines.push(`### ${row.display_name}${row.city ? ` — ${row.city}` : ""}`);
      lines.push(`- Panel: ${PANEL_BASE_URL}/panel/admin/sanatcilar/${row.entity_id}`);
      lines.push(`- Neden şüpheli: ${reason}`);
      lines.push("- Spotify adayları:");
      for (const c of candidates) lines.push(`  - ${formatCandidate(c)}`);
      lines.push("");
    }
  }

  if (noMatchRows.length > 0) {
    lines.push(`## Sonuç bulunamayan (${noMatchRows.length})`);
    lines.push("");
    for (const { row } of noMatchRows) {
      lines.push(`- ${row.display_name}${row.city ? ` (${row.city})` : ""} — ${PANEL_BASE_URL}/panel/admin/sanatcilar/${row.entity_id}`);
    }
    lines.push("");
  }

  const outPath = path.join(process.cwd(), "ops", "spotify-eslesme-raporu.md");
  writeFileSync(outPath, lines.join("\n"), "utf-8");
  return outPath;
}

// ── ana akış ──────────────────────────────────────────────────────────────
async function main() {
  console.log("================================================================");
  console.log(` NOQT Spotify sanatçı zenginleştirme — ${APPLY ? "APPLY (yazılıyor)" : "DRY RUN (yazma yapılmıyor)"}`);
  console.log("================================================================\n");

  const { url: supabaseUrl, key: supabaseKey } = getSupabaseConfig();
  if (!supabaseUrl || !supabaseKey) {
    console.error("SUPABASE_URL (veya NEXT_PUBLIC_SUPABASE_URL) ve SUPABASE_SERVICE_ROLE_KEY gerekli.");
    process.exit(1);
  }
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.error("SPOTIFY_CLIENT_ID ve SPOTIFY_CLIENT_SECRET gerekli.");
    process.exit(1);
  }

  console.log("Spotify token alınıyor...");
  const token = await getSpotifyToken(clientId, clientSecret);

  console.log("Zenginleştirme bekleyen sanatçılar çekiliyor (spotify_artist_id IS NULL, review_status ile SINIRLI DEĞİL)...");
  const rows = await fetchArtistsNeedingEnrichment(supabaseUrl, supabaseKey);
  console.log(`  ${rows.length} sanatçı bulundu${LIMIT ? ` (--limit=${LIMIT} uygulandı)` : ""}.\n`);

  if (rows.length === 0) {
    console.log("Zenginleştirilecek sanatçı yok — hepsi zaten eşleştirilmiş.");
    return;
  }

  let autoCount = 0;
  let autoFailed = 0;
  const suspiciousRows = [];
  const noMatchRows = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (VERBOSE) console.log(`[${i + 1}/${rows.length}] ${row.display_name}`);

    let candidates;
    try {
      candidates = await searchSpotifyArtist(token, row.display_name, 5);
    } catch (err) {
      console.error(`  [hata] ${row.display_name}: ${err.message}`);
      noMatchRows.push({ row });
      await sleep(200);
      continue;
    }

    const decision = decideMatch(row.display_name, candidates);
    if (decision.verdict === "no_match") {
      noMatchRows.push({ row });
    } else if (decision.verdict === "suspicious") {
      suspiciousRows.push({ row, candidates: candidates.slice(0, 3), reason: decision.reason });
    } else {
      // decideMatch'in seçtiği aday — listenin ilk sırası OLMAYABİLİR
      // (birebir isim eşleşmesi 2. veya 3. sırada olabilir).
      const top = decision.candidate;
      if (VERBOSE) console.log(`  -> otomatik: ${formatCandidate(top)} (${decision.reason})`);
      if (APPLY) {
        try {
          await applyEnrichment(supabaseUrl, supabaseKey, row, top);
          autoCount++;
        } catch (err) {
          autoFailed++;
          console.error(`  [yazım hatası] ${row.display_name}: ${err.message}`);
        }
      } else {
        autoCount++;
      }
    }

    await sleep(200); // Spotify client-credentials kotasına nazik davran
  }

  console.log("\n================================================================");
  console.log(" Sonuç");
  console.log("================================================================");
  console.log(`Taranan: ${rows.length}`);
  console.log(`Otomatik eşleşen: ${autoCount}${APPLY ? "" : " (dry-run — henüz yazılmadı)"}${autoFailed ? ` (${autoFailed} yazım hatası)` : ""}`);
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
