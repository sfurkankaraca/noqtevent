#!/usr/bin/env node
/**
 * scripts/supply-import/refresh-tm-photos-from-spotify.mjs
 *
 * KÖK NEDEN (2026-08-03, kurucu cihazda fark etti): "Kenan Doğulu"/"Serdar
 * Ortaç" gibi sanatçılar etkinlik KARTINDA fotoğrafla çıkıyor (event_card.dart
 * her seferinde CANLI bir Spotify araması yapıyor, bizim DB'den bağımsız) ama
 * SANATÇI PROFİLİNDE görünmüyor — çünkü artist_profiles.photo_url, TM içe
 * aktarımından kalma bir Ticketmaster afiş linki (bazıları ölü/HTTP 000)
 * ve enrich-spotify.mjs bu alanı YALNIZ BOŞSA dolduruyordu (kurucunun elle
 * koyduğu kapağı ezmemek için bilinçli kural) — TM'nin doldurduğu jenerik
 * link de "dolu" sayıldığı için hiç geliştirilmedi.
 *
 * Bu script dar ve GÜVENLİ bir ikinci geçiş: enrich-spotify.mjs'in ana
 * akışını (arama + isim eşleştirme + güven kuralı) TEKRARLAMAZ — yalnız
 * ZATEN doğrulanmış bir spotify_artist_id'si olan (bugünkü toplu eşleştirme
 * veya panelden "Spotify'dan doldur" ile) VE photo_url'i hâlâ bir
 * Ticketmaster linki olan sanatçıları hedefler. Kimlik zaten kesinleşmiş
 * olduğu için ARAMA/BELİRSİZLİK YOK — doğrudan GET /artists/{id} ile gerçek
 * Spotify fotoğrafı çekilip üzerine yazılır. Kurucunun panelden elle
 * yüklediği (Storage'dan gelen, ticketm.net İÇERMEYEN) fotoğraflara ASLA
 * dokunulmaz.
 *
 * Kullanım:
 *   node scripts/supply-import/refresh-tm-photos-from-spotify.mjs           # dry-run
 *   node scripts/supply-import/refresh-tm-photos-from-spotify.mjs --apply   # gerçek yazım
 *
 * Env (.env.local otomatik yüklenir, repo kökünden çalıştırılmalı):
 *   SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET
 *   SUPABASE_URL (veya NEXT_PUBLIC_SUPABASE_URL) / SUPABASE_SERVICE_ROLE_KEY
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

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

const argv = process.argv.slice(2);
const APPLY = argv.includes("--apply");
const VERBOSE = argv.includes("--verbose");
const REQUEST_DELAY_MS = 150;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let cachedToken = null;
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

// Kimlik zaten kesin — arama yok, doğrudan tekil sanatçı kaydı.
async function getSpotifyArtistById(token, spotifyId) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(`https://api.spotify.com/v1/artists/${spotifyId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 429) {
      const retryAfterHeader = Number(res.headers.get("retry-after"));
      const wait = (Number.isFinite(retryAfterHeader) && retryAfterHeader > 0 ? retryAfterHeader : attempt + 1) * 1000;
      if (VERBOSE) console.warn(`  [spotify] 429 — ${wait}ms bekleniyor (deneme ${attempt + 1}/4)`);
      await sleep(wait);
      continue;
    }
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Spotify artist GET hatası (${spotifyId}): HTTP ${res.status}`);
    const raw = await res.json();
    return {
      imageUrl: Array.isArray(raw.images) && raw.images[0]?.url ? raw.images[0].url : null,
      popularity: typeof raw.popularity === "number" ? raw.popularity : null,
      followers: typeof raw.followers?.total === "number" ? raw.followers.total : null,
    };
  }
  throw new Error(`Spotify artist GET hatası (${spotifyId}): 429 tekrar denemeleri tükendi`);
}

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return { url, key };
}

async function postgrest(base, key, method, pathAndQuery, body, extraHeaders = {}) {
  const res = await fetch(`${base}/rest/v1${pathAndQuery}`, {
    method,
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...extraHeaders },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`PostgREST ${method} ${pathAndQuery} -> HTTP ${res.status}: ${text.slice(0, 400)}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function fetchTmPhotoRows(base, key) {
  const rows = [];
  const pageSize = 500;
  let from = 0;
  for (;;) {
    const batch = await postgrest(
      base,
      key,
      "GET",
      "/artist_profiles?select=entity_id,display_name,photo_url,spotify_artist_id" +
        "&spotify_artist_id=not.is.null&photo_url=like.*ticketm.net*&order=display_name.asc",
      undefined,
      { Range: `${from}-${from + pageSize - 1}` }
    );
    if (!batch || batch.length === 0) break;
    rows.push(...batch);
    if (batch.length < pageSize) break;
    from += pageSize;
  }
  return rows;
}

async function main() {
  console.log("================================================================");
  console.log(` NOQT: TM afişlerini gerçek Spotify fotoğrafıyla değiştir — ${APPLY ? "APPLY (yazılıyor)" : "DRY RUN"}`);
  console.log("================================================================\n");

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.error("SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET gerekli.");
    process.exit(1);
  }
  const { url: supabaseUrl, key: supabaseKey } = getSupabaseConfig();
  if (!supabaseUrl || !supabaseKey) {
    console.error("SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli.");
    process.exit(1);
  }

  console.log("Ticketmaster afişli + spotify_artist_id dolu sanatçılar çekiliyor...");
  const rows = await fetchTmPhotoRows(supabaseUrl, supabaseKey);
  console.log(`  ${rows.length} sanatçı bulundu.\n`);

  const token = await getSpotifyToken(clientId, clientSecret);

  let refreshed = 0;
  let noSpotifyImage = 0;
  let notFound = 0;
  let failed = 0;

  for (const row of rows) {
    let info;
    try {
      info = await getSpotifyArtistById(token, row.spotify_artist_id);
    } catch (err) {
      failed++;
      console.error(`  [hata] ${row.display_name}: ${err.message}`);
      await sleep(REQUEST_DELAY_MS);
      continue;
    }
    if (!info) {
      notFound++;
      if (VERBOSE) console.log(`  -> Spotify'da bulunamadı (silinmiş id?): ${row.display_name}`);
      await sleep(REQUEST_DELAY_MS);
      continue;
    }
    if (!info.imageUrl) {
      noSpotifyImage++;
      if (VERBOSE) console.log(`  -> Spotify'da fotoğraf yok: ${row.display_name}`);
      await sleep(REQUEST_DELAY_MS);
      continue;
    }

    if (VERBOSE) console.log(`  -> ${row.display_name}: TM afişi → Spotify fotoğrafı`);
    if (APPLY) {
      try {
        const update = { photo_url: info.imageUrl, enriched_at: new Date().toISOString() };
        if (info.popularity !== null) update.spotify_popularity = info.popularity;
        if (info.followers !== null) update.spotify_followers = info.followers;
        await postgrest(supabaseUrl, supabaseKey, "PATCH", `/artist_profiles?entity_id=eq.${row.entity_id}`, update, {
          Prefer: "return=minimal",
        });
        refreshed++;
      } catch (err) {
        failed++;
        console.error(`  [yazım hatası] ${row.display_name}: ${err.message}`);
      }
    } else {
      refreshed++;
    }
    await sleep(REQUEST_DELAY_MS);
  }

  console.log("\n================================================================");
  console.log(" Sonuç");
  console.log("================================================================");
  console.log(`Taranan: ${rows.length}`);
  console.log(`Güncellendi (TM afişi → Spotify fotoğrafı): ${refreshed}${APPLY ? "" : " (dry-run — henüz yazılmadı)"}`);
  console.log(`Spotify'da fotoğrafı yok: ${noSpotifyImage}`);
  console.log(`Spotify'da bulunamadı: ${notFound}`);
  console.log(`Hata: ${failed}`);
  if (!APPLY) console.log("\nBu bir DRY RUN'dı — hiçbir şey yazılmadı. Gerçek yazım için --apply ekleyin.");
}

main().catch((err) => {
  console.error("Beklenmeyen hata:", err);
  process.exit(1);
});
