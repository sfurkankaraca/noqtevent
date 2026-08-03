#!/usr/bin/env node
/**
 * scripts/supply-import/enrich-wikipedia-bios.mjs
 *
 * artist_profiles'ta bio BOŞ olan TÜM sanatçıları (review_status ile
 * SINIRLI DEĞİL — enrich-spotify.mjs / enrich-google-venues.mjs'teki AYNI
 * gerekçe: kurucu talebi "var olan sanatçılara otomatik" akışı) Türkçe
 * Wikipedia'da arar ve GÜVEN KURALINI geçenleri otomatik uygular.
 *
 * NEDEN CLOUD FUNCTION'I ÇAĞIRMIYORUZ: eventmatch/functions/src/artist-info.ts
 * (fetchArtistBio) App Check + Firebase auth gerektiren bir Cloud Function
 * içinde yaşıyor — bu script'ten (panel repo, ayrı proje) çağrılamaz. Onun
 * yerine AYNI mantık burada düz Node fetch ile, TypeScript'e bağımlı olmadan
 * yeniden kuruldu:
 *   - wikipediaTitle()  → o dosyadaki fonksiyonla BİREBİR aynı (boşluk→_).
 *   - trimBio()         → o dosyadaki fonksiyonla BİREBİR aynı (cümle sonu >
 *                         kelime sonu kırpma algoritması, MAX_BIO_LENGTH=600).
 *   - "sayfa yok" deseni → HTTP 404 = kalıcı "bu sanatçının sayfası yok".
 *   - Uç nokta/dil        → tr.wikipedia.org REST özet API'si (anahtarsız).
 *
 * PORT EDİLMEYEN kısım: o dosyadaki cachedFetch (günlük bütçe / stale-while-
 * revalidate / circuit breaker) ve inFlightBios/bioMissMemo Map'leri — ikisi
 * de Cloud Function'ın AYNI ANDA çok sayıda kart isteğini optimize etmek
 * için var (bkz. o dosyadaki "Aynı başlık için AYNI ANDA tek uçuş" notu).
 * Bu script SIRALI ve TEK SEFERLİK bir toplu iş çalıştırır — o eşzamanlılık
 * karmaşıklığına ihtiyaç yok; sıralı akışın kendisi zaten "aynı başlığa iki
 * kez istek" riskini ortadan kaldırıyor.
 *
 * GÜVEN KURALI (Spotify/Google script'lerinden BİLEREK FARKLI — burada "aday
 * listesi" YOK, tek Wikipedia sayfası ya vardır ya yoktur; isim eşleşmesi
 * zaten Wikipedia'nın kendi arama/yönlendirme mekanizmasıyla sağlanıyor, bu
 * yüzden enrich-spotify.mjs'teki gibi ikinci-aday/popülerlik-farkı kıyası
 * BURADA YOK):
 *   - HTTP 404                      → "sayfa yok", atla (yazma yok).
 *   - type === "disambiguation"     → "şüpheli" (ör. "Duman" hem "duman/
 *     sis" anlamına gelen bir kavram sayfası hem de bir müzik grubu olabilir
 *     — karışıklık sayfası sanatçıyla ilgisiz bir yönlendirme listesidir).
 *   - extract < MIN_EXTRACT_LENGTH (40) karakter → "şüpheli" (muhtemelen
 *     alakasız/boş özet — ör. yalnızca "Bir Türk sanatçısı." gibi anlamsız
 *     kısa bir stub).
 *   - Aksi halde (200 + type != disambiguation + yeterli uzunlukta extract)
 *     → OTOMATİK uygulanır: extract MAX_BIO_LENGTH (600) karaktere kırpılır.
 *
 * NOT: trimBio kırpma mantığı artist-info.ts'te "text()" fonksiyonunun
 * YANINDA ama ondan AYRI bir fonksiyondur — text() bounds-check yapıp sınırı
 * aşınca `null` döner (sessizce reddeder), trimBio ise cümle/kelime
 * sınırında KIRPARAK (üç nokta ile) sınıra indirir. Bu script'in istediği
 * davranış (600 karaktere "kırpma") trimBio'nunkidir; o yüzden trimBio
 * birebir port edildi.
 *
 * Uygulanan alanlar:
 *   - bio: sorgu zaten `bio IS NULL` ile geldiği için her zaman boş satıra
 *     yazılır (kurucunun elle girdiği biyografi zaten kapsam dışı kalır).
 *   - enriched_at: enrich-spotify.mjs / enrich-google-venues.mjs ile AYNI
 *     kolon (bkz. 20260802140000_add_artist_spotify_enrichment.sql) — tabloda
 *     zenginleştirmeye özel değil, "bu satıra en son ne zaman otomatik
 *     dokunuldu" bilgisini taşıyan genel bir alan; venue_details'te de aynı
 *     isimle Google zenginleştirmesi tarafından kullanılıyor.
 *
 * İDEMPOTENT: sorgu zaten `bio IS NULL` ile filtreliyor — bir kez doldurulan
 * satır bir daha sorguya girmez. Script'i tekrar tekrar (ör. her
 * import-external.mjs --apply koşusundan sonra) çalıştırmak güvenlidir.
 *
 * RATE LIMIT (Wikimedia'nın nazik kullanım politikası GEREĞİ):
 *   1) Her istekte tanımlayıcı bir User-Agent gönderilir — boş/varsayılan
 *      (ör. sadece "node-fetch") UA'lar Wikimedia tarafından 403'lenebiliyor.
 *   2) İstekler arası ~200ms beklenir (enrich-spotify.mjs'teki sleep(200)
 *      ile kabaca AYNI değer).
 *   3) 429 / 5xx yanıtlarında Retry-After'a (yoksa artan bekleme) uyularak
 *      en fazla 4 deneme (enrich-spotify.mjs'teki searchSpotifyArtist ile
 *      AYNI desen) — tükenirse satır "ağ/istek hatası" olarak raporlanır,
 *      script çökmez.
 *
 * Kullanım:
 *   node scripts/supply-import/enrich-wikipedia-bios.mjs                # dry-run
 *   node scripts/supply-import/enrich-wikipedia-bios.mjs --apply         # gerçek yazım
 *   node scripts/supply-import/enrich-wikipedia-bios.mjs --limit=50 --verbose
 *
 * Env (.env.local otomatik yüklenir, repo kökünden çalıştırılmalı):
 *   SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL (ikisi de kabul edilir)
 *   SUPABASE_SERVICE_ROLE_KEY
 *   (Wikipedia REST özet API'si ANAHTAR İSTEMEZ — herkese açık uç nokta.)
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

// ── .env.local yükleme (enrich-spotify.mjs / enrich-google-venues.mjs ile AYNI yardımcı) ──
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

// ── sabitler ──────────────────────────────────────────────────────────────
// artist-info.ts'teki WIKIPEDIA_SUMMARY_URL ile AYNI uç nokta/dil (TR Wikipedia).
const WIKIPEDIA_SUMMARY_URL = "https://tr.wikipedia.org/api/rest_v1/page/summary/";
// artist-info.ts'teki WIKIPEDIA_USER_AGENT ile BİREBİR AYNI değer — Wikimedia
// politikası tanımlayıcı bir User-Agent ister, aynı alan adı zaten tek bir
// sorumlu tarafı (noqt.social) işaret ediyor; birden fazla farklı UA ile
// aynı kaynağa istek atmanın bir faydası yok.
const WIKIPEDIA_USER_AGENT = "noqt-social/1.0 (+https://noqt.social)";
// artist-info.ts'teki MAX_TITLE_LENGTH ile AYNI.
const MAX_TITLE_LENGTH = 120;
// artist-info.ts'teki MAX_BIO_LENGTH ile AYNI.
const MAX_BIO_LENGTH = 600;
// GÖREV'de istenen şüpheli eşiği: extract bundan KISA ise "muhtemelen
// alakasız/boş" sayılır (artist-info.ts'te bu eşik yok — orada kısa/boş
// extract de sessizce "bio yok" sayılıp kart biyografisiz çiziliyor; bu
// script'te ise kurucunun elle gözden geçirmesi için AYRI bir "şüpheli"
// kovaya düşürülüyor).
const MIN_EXTRACT_LENGTH = 40;
// İstekler arası bekleme — GÖREV'in istediği "~200ms", enrich-spotify.mjs'teki
// sleep(200) ile kabaca aynı.
const REQUEST_DELAY_MS = 200;

const PANEL_BASE_URL = "https://panel.noqt.social";

// ── yardımcılar ───────────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// artist-info.ts'ten BİREBİR port edilen saf yardımcılar (ağ gerektirmez).
// ---------------------------------------------------------------------------

/**
 * Sanatçı adını Wikipedia başlığına çevirir (boşluk → alt çizgi).
 *
 * artist-info.ts'teki wikipediaTitle() ile BİREBİR AYNI: yüzde-kaçışlama
 * BİLEREK burada yapılmaz (yalnızca boşluk→_ dönüşümü), asıl URL kaçışlaması
 * fetch/URL kurulurken encodeURIComponent ile yapılır — o zaman `/`, `?`, `#`
 * gibi yol ayırıcıları da kaçışlanır.
 */
function wikipediaTitle(name) {
  if (typeof name !== "string") return null;
  const collapsed = name.replace(/\s+/g, " ").trim();
  if (!collapsed || collapsed.length > MAX_TITLE_LENGTH) return null;
  return collapsed.replace(/ /g, "_");
}

/**
 * Uzun özeti kart/panel boyuna kırpar.
 *
 * artist-info.ts'teki trimBio() ile BİREBİR AYNI algoritma: cümle sonunda
 * kesmek tercih edilir (yarım cümleyle bitmesin diye); sınıra yakın bir cümle
 * sonu yoksa (tek uzun cümle) kelime sınırına düşülür, kelime ortadan
 * bölünmez, sonuna "…" eklenir.
 */
function trimBio(raw, limit = MAX_BIO_LENGTH) {
  const normalized = raw.replace(/\s+/g, " ").trim();
  if (!normalized) return null;
  if (normalized.length <= limit) return normalized;

  const window = normalized.slice(0, limit);
  const sentenceEnd = Math.max(window.lastIndexOf("."), window.lastIndexOf("!"), window.lastIndexOf("?"));
  // Eşik: cümle sonu metnin başına çok yakınsa (ör. "Dr." kısaltması) kırpılmış
  // metin anlamsız derecede kısa kalırdı; o durumda kelime sınırına düşülür.
  if (sentenceEnd >= Math.floor(limit * 0.4)) {
    return window.slice(0, sentenceEnd + 1);
  }
  const wordEnd = window.lastIndexOf(" ");
  return `${window.slice(0, wordEnd > 0 ? wordEnd : limit).trimEnd()}…`;
}

/**
 * Wikipedia sayfa başlığından TIKLANABİLİR bir wiki linki üretir.
 *
 * encodeURIComponent BİLEREK kullanılır (fetchSummary'deki ile AYNI kaçışlama)
 * — sanatçı adında "/", "?" gibi karakterler olsa bile (ör. teorik "AC/DC")
 * link her zaman DOĞRU sayfaya çıkar; ham başlıkla kurulan bir link "/"i yol
 * ayırıcı sanıp yanlış adrese giderdi.
 */
function wikipediaPageUrl(title) {
  return `https://tr.wikipedia.org/wiki/${encodeURIComponent(title)}`;
}

/**
 * Wikipedia özet yanıtını sınıflandırır: otomatik uygulanabilir mi, yoksa
 * kurucunun elle gözden geçirmesi gereken "şüpheli" bir durum mu.
 *
 * artist-info.ts'teki bioFromSummary()'nin GENİŞLETİLMİŞ hâli: orada
 * disambiguation/kısa-extract ayrımı yapılmaz, ikisi de tek bir "bio yok"
 * dalına düşer (Cloud Function bağlamında fark etmez — kart biyografisiz
 * çizilir). Burada ise GÖREV gereği ÜÇ ayrı sonuç lazım (dolduruldu / şüpheli
 * / sayfa yok) çünkü şüpheli olanların panelden elle onaylanması gerekiyor.
 */
function classifySummary(parsed) {
  if (!parsed || typeof parsed !== "object") {
    return { verdict: "suspicious", reason: "Wikipedia yanıtı beklenmeyen biçimde (JSON nesnesi değil)" };
  }
  // "Ali şu kişilere/şeylere gönderme yapabilir" gibi karışıklık sayfaları —
  // sanatçıyla ilgisi olmayan bir yönlendirme listesi döndürür.
  if (parsed.type === "disambiguation") {
    return {
      verdict: "suspicious",
      reason: "Wikipedia'da bir \"anlam ayrımı\" (disambiguation) sayfası — bu ad birden çok kişi/kavrama ait olabilir",
    };
  }
  const extractRaw = typeof parsed.extract === "string" ? parsed.extract : "";
  const extractTrimmed = extractRaw.replace(/\s+/g, " ").trim();
  if (extractTrimmed.length < MIN_EXTRACT_LENGTH) {
    return {
      verdict: "suspicious",
      reason: `Özet çok kısa (${extractTrimmed.length} karakter, eşik ${MIN_EXTRACT_LENGTH}) — muhtemelen alakasız/boş sayfa`,
      preview: extractTrimmed || undefined,
    };
  }
  return { verdict: "auto", bio: trimBio(extractRaw), preview: extractTrimmed.slice(0, 140) };
}

/**
 * DÜZELTME (2026-08-03, canlı keşifte bulundu): disambiguation/kısa-extract
 * kontrolü tek başına yetmez — Türkçe ortak kelimeyle aynı adı taşıyan
 * sanatçılarda ("Duman" grubu → "duman" (gaz) sayfası, "Kaya" → "Kayaç"
 * sayfasına yönleniyor) Wikipedia sayfası GERÇEKTEN var, disambiguation
 * DEĞİL, özet yeterince uzun — ama konu sanatçıyla alakasız. classifySummary
 * bunu ayırt edemez (yalnız sayfa varlığına/uzunluğuna bakar).
 *
 * ÇAPRAZ DOĞRULAMA: ekstra bir Wikidata sorgusu yerine ZATEN elimizde olan
 * bir sinyali kullanıyoruz — spotify_artist_id. Bugünkü toplu Spotify
 * eşleştirmesinden (enrich-spotify.mjs) bir sanatçının GERÇEKTEN doğrulanmış
 * bir Spotify kimliği varsa, adı ortak bir kelimeyle çakışsa bile Wikipedia
 * sonucunun o sanatçıya ait olma ihtimali çok daha yüksektir. Spotify eşleşmesi
 * YOKSA (henüz doğrulanmamış/belirsiz isim) otomatik uygulamak yerine şüpheliye
 * düşürülür — ekstra API çağrısı veya rate-limit maliyeti olmadan.
 */
function crossValidateWithSpotify(decision, row) {
  if (decision.verdict !== "auto") return decision;
  if (row.spotify_artist_id) return decision;
  return {
    verdict: "suspicious",
    reason: "Wikipedia sayfası bulundu ama bu sanatçının doğrulanmış bir Spotify eşleşmesi yok — " +
      "ortak isim/kelime karışıklığı riski (bkz. \"Duman\"/\"Kaya\" örnekleri), elle doğrulanmalı",
    preview: decision.preview,
  };
}

// ---------------------------------------------------------------------------
// Wikipedia tarafı (ağ)
// ---------------------------------------------------------------------------

// 429/5xx'te Retry-After'a (yoksa artan bekleme) uyarak en fazla 4 deneme —
// enrich-spotify.mjs'teki searchSpotifyArtist ile AYNI desen. 404 KALICI bir
// cevaptır (artist-info.ts'teki "hata değil" notuyla AYNI gerekçe) — hemen
// döner, tekrar denenmez.
async function fetchSummary(title) {
  const url = `${WIKIPEDIA_SUMMARY_URL}${encodeURIComponent(title)}`;
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, {
      headers: {
        "User-Agent": WIKIPEDIA_USER_AGENT,
        Accept: "application/json",
      },
    });
    if (res.status === 404) return { status: 404, body: null };
    if (res.status === 429 || res.status >= 500) {
      if (attempt >= 3) throw new Error(`Wikipedia özet isteği: HTTP ${res.status} — tekrar denemeleri tükendi`);
      const retryAfterHeader = Number(res.headers.get("retry-after"));
      const wait = (Number.isFinite(retryAfterHeader) && retryAfterHeader > 0 ? retryAfterHeader : attempt + 1) * 1000;
      if (VERBOSE) console.warn(`  [wikipedia] HTTP ${res.status} ("${title}") — ${wait}ms bekleniyor (deneme ${attempt + 1}/4)`);
      await sleep(wait);
      continue;
    }
    if (!res.ok) {
      throw new Error(`Wikipedia özet isteği başarısız: HTTP ${res.status}`);
    }
    let body;
    try {
      body = await res.json();
    } catch {
      throw new Error("Wikipedia özet yanıtı JSON olarak ayrıştırılamadı");
    }
    return { status: 200, body };
  }
  throw new Error(`Wikipedia özet isteği: tekrar denemeleri tükendi (${title})`);
}

// ── PostgREST istemcisi (enrich-spotify.mjs / enrich-google-venues.mjs ile AYNI desen) ──
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

async function fetchArtistsNeedingBio(base, key) {
  const rows = [];
  const pageSize = 500;
  let from = 0;
  for (;;) {
    const batch = await postgrest(
      base,
      key,
      "GET",
      "/artist_profiles?select=entity_id,display_name,city,review_status,spotify_artist_id&bio=is.null&order=display_name.asc",
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

async function applyBio(base, key, row, bio) {
  const update = {
    bio,
    enriched_at: new Date().toISOString(),
  };
  await postgrest(base, key, "PATCH", `/artist_profiles?entity_id=eq.${row.entity_id}`, update, {
    Prefer: "return=minimal",
  });
}

function writeReport({ scannedCount, filledCount, suspiciousRows, notFoundRows, errorRows }) {
  const now = new Date().toISOString();
  const lines = [];
  lines.push("# Wikipedia biyografi doldurma raporu");
  lines.push("");
  lines.push(
    `Bu dosya \`scripts/supply-import/enrich-wikipedia-bios.mjs\` her koşuda ÜZERİNE YAZILIR (birikmez) — yalnız EN SON koşunun şüpheli/eksik satırlarını gösterir.`
  );
  lines.push("");
  lines.push(`Son çalıştırma: ${now} (${APPLY ? "APPLY — yazıldı" : "DRY RUN — hiçbir şey yazılmadı"})`);
  lines.push("");
  lines.push(`- Taranan sanatçı (bio boş): ${scannedCount}`);
  lines.push(`- Dolduruldu (${APPLY ? "uygulandı" : "uygulanacaktı, dry-run"}): ${filledCount}`);
  lines.push(`- Şüpheli (elle gözden geçirilmeli): ${suspiciousRows.length}`);
  lines.push(`- Wikipedia'da sayfası bulunamayan (404): ${notFoundRows.length}`);
  if (errorRows.length > 0) {
    lines.push(`- Ağ/istek hatası (tekrar denenmeli): ${errorRows.length}`);
  }
  lines.push("");

  if (suspiciousRows.length > 0) {
    lines.push(`## Şüpheli sayfalar (${suspiciousRows.length})`);
    lines.push("");
    lines.push(
      "Wikipedia linkine tıklayıp sayfanın gerçekten bu sanatçıya ait olup olmadığını kontrol et; uygunsa panelden sanatçı düzenleme formuna biyografiyi elle yapıştır."
    );
    lines.push("");
    for (const { row, reason, wikipediaUrl, preview } of suspiciousRows) {
      lines.push(`### ${row.display_name}${row.city ? ` — ${row.city}` : ""}`);
      lines.push(`- Panel: ${PANEL_BASE_URL}/panel/admin/sanatcilar/${row.entity_id}`);
      lines.push(`- Wikipedia: ${wikipediaUrl}`);
      lines.push(`- Neden şüpheli: ${reason}`);
      if (preview) lines.push(`- Özet önizleme: "${preview}"`);
      lines.push("");
    }
  }

  if (notFoundRows.length > 0) {
    lines.push(`## Sayfası bulunamayan (${notFoundRows.length})`);
    lines.push("");
    for (const { row } of notFoundRows) {
      lines.push(`- ${row.display_name}${row.city ? ` (${row.city})` : ""} — ${PANEL_BASE_URL}/panel/admin/sanatcilar/${row.entity_id}`);
    }
    lines.push("");
  }

  if (errorRows.length > 0) {
    lines.push(`## Ağ/istek hatası (${errorRows.length})`);
    lines.push("");
    lines.push(
      "Bu satırlarda Wikipedia'ya erişilemedi (zaman aşımı, DNS, 429/5xx tekrar denemesi tükendi vb.) — script'i tekrar çalıştırmak genelde yeterli, İDEMPOTENT olduğu için zaten dolu satırlara dokunmaz."
    );
    lines.push("");
    for (const { row, error } of errorRows) {
      lines.push(`- ${row.display_name}${row.city ? ` (${row.city})` : ""} — ${error}`);
    }
    lines.push("");
  }

  const outPath = path.join(process.cwd(), "ops", "wikipedia-bio-raporu.md");
  writeFileSync(outPath, lines.join("\n"), "utf-8");
  return outPath;
}

// ── ana akış ──────────────────────────────────────────────────────────────
async function main() {
  console.log("================================================================");
  console.log(` NOQT Wikipedia biyografi doldurma — ${APPLY ? "APPLY (yazılıyor)" : "DRY RUN (yazma yapılmıyor)"}`);
  console.log("================================================================\n");

  const { url: supabaseUrl, key: supabaseKey } = getSupabaseConfig();
  if (!supabaseUrl || !supabaseKey) {
    console.error("SUPABASE_URL (veya NEXT_PUBLIC_SUPABASE_URL) ve SUPABASE_SERVICE_ROLE_KEY gerekli.");
    process.exit(1);
  }

  console.log("Biyografisi boş sanatçılar çekiliyor (bio IS NULL, review_status ile SINIRLI DEĞİL)...");
  const rows = await fetchArtistsNeedingBio(supabaseUrl, supabaseKey);
  console.log(`  ${rows.length} sanatçı bulundu${LIMIT ? ` (--limit=${LIMIT} uygulandı)` : ""}.\n`);

  if (rows.length === 0) {
    console.log("Doldurulacak biyografi yok — hepsi zaten dolu.");
    return;
  }

  let filledCount = 0;
  let filledFailed = 0;
  const suspiciousRows = [];
  const notFoundRows = [];
  const errorRows = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (VERBOSE) console.log(`[${i + 1}/${rows.length}] ${row.display_name}`);

    const title = wikipediaTitle(row.display_name);
    if (!title) {
      // Aşırı uzun/boş ad — ağ isteği bile atılmadan şüpheli sayılır.
      suspiciousRows.push({
        row,
        reason: "Ad Wikipedia başlığına çevrilemedi (boş veya 120 karakterden uzun)",
        wikipediaUrl: "-",
      });
      continue;
    }

    let result;
    try {
      result = await fetchSummary(title);
    } catch (err) {
      console.error(`  [hata] ${row.display_name}: ${err.message}`);
      errorRows.push({ row, error: err.message });
      await sleep(REQUEST_DELAY_MS);
      continue;
    }

    if (result.status === 404) {
      if (VERBOSE) console.log("  -> sayfa yok (404)");
      notFoundRows.push({ row });
    } else {
      const wikipediaUrl = wikipediaPageUrl(title);
      const decision = crossValidateWithSpotify(classifySummary(result.body), row);
      if (decision.verdict === "suspicious") {
        if (VERBOSE) console.log(`  -> şüpheli: ${decision.reason}`);
        suspiciousRows.push({ row, reason: decision.reason, wikipediaUrl, preview: decision.preview });
      } else {
        if (VERBOSE) console.log(`  -> otomatik (${decision.bio.length} karakter): "${decision.bio.slice(0, 80)}..."`);
        if (APPLY) {
          try {
            await applyBio(supabaseUrl, supabaseKey, row, decision.bio);
            filledCount++;
          } catch (err) {
            filledFailed++;
            console.error(`  [yazım hatası] ${row.display_name}: ${err.message}`);
          }
        } else {
          filledCount++;
        }
      }
    }

    await sleep(REQUEST_DELAY_MS); // Wikimedia'nın nazik kullanım politikasına uy
  }

  console.log("\n================================================================");
  console.log(" Sonuç");
  console.log("================================================================");
  console.log(`Taranan: ${rows.length}`);
  console.log(`Dolduruldu: ${filledCount}${APPLY ? "" : " (dry-run — henüz yazılmadı)"}${filledFailed ? ` (${filledFailed} yazım hatası)` : ""}`);
  console.log(`Şüpheli: ${suspiciousRows.length}`);
  console.log(`Sayfası bulunamayan: ${notFoundRows.length}`);
  if (errorRows.length > 0) console.log(`Ağ/istek hatası: ${errorRows.length}`);

  const reportPath = writeReport({ scannedCount: rows.length, filledCount, suspiciousRows, notFoundRows, errorRows });
  console.log(`\nRapor yazıldı: ${reportPath}`);

  if (!APPLY) {
    console.log("\nBu bir DRY RUN'dı — hiçbir şey yazılmadı. Gerçek yazım için --apply ekleyin.");
  }
}

main().catch((err) => {
  console.error("\nBeklenmeyen hata:", err);
  process.exit(1);
});
