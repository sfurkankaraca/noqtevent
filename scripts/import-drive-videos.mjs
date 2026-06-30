/**
 * import-drive-videos.mjs
 * Google Drive'daki (tek tek, dağınık linkler) videoları indirir,
 * ffmpeg ile 720p H.264'e sıkıştırır, R2'ye yükler ve sonuçta
 * media.noqt.events linklerini liste halinde verir.
 *
 * Bu script DB'ye YAZMAZ — çıkan linkleri admin'den ilgili sanatçıya
 * sen yapıştırırsın (hangi video kime gidecek kontrolü sende).
 *
 * Kurulum:
 *   brew install ffmpeg
 *   npm install googleapis   (zaten kurulu)
 *
 * İlk çalıştırma (Drive izni al — sadece bir kez):
 *   node scripts/import-drive-videos.mjs --auth
 *
 * Aktarım — linkleri scripts/drive-links.txt'e (satır başına bir link) koy, sonra:
 *   node scripts/import-drive-videos.mjs
 *
 * Ya da linkleri doğrudan ver:
 *   node scripts/import-drive-videos.mjs "https://drive.google.com/file/d/XXX/view" "https://..."
 *
 * Sadece listele (indirme yok):
 *   node scripts/import-drive-videos.mjs --dry-run
 */

import { google } from "googleapis";
import { execSync } from "child_process";
import { existsSync, mkdirSync, unlinkSync, writeFileSync, readFileSync, statSync, createWriteStream } from "fs";
import { readFile } from "fs/promises";
import path from "path";
import os from "os";

// .env.local otomatik yükle (script'ler Next.js dışında çalışır)
const envPath = path.join(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!(key in process.env)) process.env[key] = val;
  }
}

// ── Credentials ───────────────────────────────────────────────────────────────
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME ?? "noqt-memory";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? "https://media.noqt.events";

// Drive izni YouTube token'ından ayrı tutulur (farklı kapsam/scope).
const TOKEN_PATH = path.join(os.homedir(), ".noqt-drive-token.json");
const LINKS_FILE = path.join(process.cwd(), "scripts", "drive-links.txt");

const DRY_RUN = process.argv.includes("--dry-run");
const AUTH_ONLY = process.argv.includes("--auth");

// ── Validation ────────────────────────────────────────────────────────────────
const needsR2 = !DRY_RUN && !AUTH_ONLY;
const missing = [
  !GOOGLE_CLIENT_ID && "GOOGLE_CLIENT_ID",
  !GOOGLE_CLIENT_SECRET && "GOOGLE_CLIENT_SECRET",
  needsR2 && !CLOUDFLARE_ACCOUNT_ID && "CLOUDFLARE_ACCOUNT_ID",
  needsR2 && !R2_ACCESS_KEY_ID && "R2_ACCESS_KEY_ID",
  needsR2 && !R2_SECRET_ACCESS_KEY && "R2_SECRET_ACCESS_KEY",
].filter(Boolean);

if (missing.length) {
  console.error("Eksik env değişkeni:", missing.join(", "));
  process.exit(1);
}

// ── OAuth (upload-to-youtube.mjs ile aynı akış, sadece scope farklı) ───────────
const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  "urn:ietf:wg:oauth:2.0:oob"
);

async function authenticate() {
  if (existsSync(TOKEN_PATH)) {
    oauth2Client.setCredentials(JSON.parse(readFileSync(TOKEN_PATH, "utf-8")));
    return;
  }

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/drive.readonly"],
  });

  console.log("\n1. Bu URL'i tarayıcıda aç:");
  console.log("\n   " + authUrl + "\n");
  console.log("2. Google hesabınla izin ver → kodu kopyala");
  console.log("3. Kodu buraya yapıştır ve Enter'a bas:\n");

  const code = await new Promise((resolve) => {
    process.stdout.write("Kod: ");
    let input = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      input += chunk;
      if (input.includes("\n")) resolve(input.trim());
    });
  });

  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
  console.log("✓ Drive token kaydedildi\n");
}

// ── Drive link → fileId ───────────────────────────────────────────────────────
function extractFileId(link) {
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/, // .../file/d/<id>/view
    /[?&]id=([a-zA-Z0-9_-]+)/,     // ...open?id=<id> / uc?id=<id>
    /\/d\/([a-zA-Z0-9_-]+)/,       // .../d/<id>
  ];
  for (const re of patterns) {
    const m = link.match(re);
    if (m) return m[1];
  }
  // Çıplak ID verilmişse
  if (/^[a-zA-Z0-9_-]{20,}$/.test(link.trim())) return link.trim();
  return null;
}

// ── Girdi linklerini topla (CLI argümanları ya da drive-links.txt) ─────────────
function collectLinks() {
  const cliLinks = process.argv
    .slice(2)
    .filter((a) => !a.startsWith("--"));
  if (cliLinks.length) return cliLinks.map((link) => ({ link, note: "" }));

  if (!existsSync(LINKS_FILE)) {
    console.error(`Girdi yok. Linkleri ${LINKS_FILE} dosyasına (satır başına bir link) koy`);
    console.error("ya da komut satırından ver. Örnek satır:");
    console.error('  https://drive.google.com/file/d/XXX/view | DJ Mert');
    process.exit(1);
  }

  return readFileSync(LINKS_FILE, "utf-8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const [link, ...noteParts] = l.split("|");
      return { link: link.trim(), note: noteParts.join("|").trim() };
    });
}

// ── R2 upload ─────────────────────────────────────────────────────────────────
async function uploadToR2(localPath, r2Key) {
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
  });
  const fileBuffer = await readFile(localPath);
  await client.send(new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: r2Key,
    Body: fileBuffer,
    ContentType: "video/mp4",
  }));
}

// ── ffmpeg compress (compress-videos.mjs ile aynı ayar) ───────────────────────
function compress(inputPath, outputPath) {
  execSync(
    `ffmpeg -y -i "${inputPath}" -vf "scale='min(1280,iw)':'min(720,ih)':force_original_aspect_ratio=decrease" ` +
    `-c:v libx264 -crf 28 -preset fast -movflags +faststart ` +
    `-c:a aac -b:a 128k "${outputPath}"`,
    { stdio: "inherit" }
  );
}

// ── Drive'dan indir ───────────────────────────────────────────────────────────
async function downloadFromDrive(drive, fileId, destPath) {
  const dest = createWriteStream(destPath);
  const res = await drive.files.get(
    { fileId, alt: "media", supportsAllDrives: true },
    { responseType: "stream" }
  );
  await new Promise((resolve, reject) => {
    res.data.on("end", resolve).on("error", reject).pipe(dest);
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────
await authenticate();
if (AUTH_ONLY) {
  console.log("✓ Yetkilendirme tamam. Artık aktarımı çalıştırabilirsin.");
  process.exit(0);
}

const links = collectLinks();
console.log(`${links.length} link bulundu\n`);

if (DRY_RUN) {
  for (const { link, note } of links) {
    const id = extractFileId(link);
    console.log(`${id ? "✓" : "✗ ID bulunamadı"}  ${note ? `[${note}] ` : ""}${link}`);
  }
  process.exit(0);
}

const drive = google.drive({ version: "v3", auth: oauth2Client });
const tmpDir = path.join(os.tmpdir(), "noqt-drive-import");
mkdirSync(tmpDir, { recursive: true });

const results = [];
let i = 0;
for (const { link, note } of links) {
  i++;
  const fileId = extractFileId(link);
  const label = note ? `[${note}] ` : "";
  console.log(`\n[${i}/${links.length}] ${label}${link}`);

  if (!fileId) {
    console.error("  ✗ Drive ID çıkarılamadı, atlanıyor.");
    results.push({ link, note, url: null, error: "ID bulunamadı" });
    continue;
  }

  const inputFile = path.join(tmpDir, `input_${i}`);
  const outputFile = path.join(tmpDir, `output_${i}.mp4`);

  try {
    // 1. Meta (isim/boyut) — opsiyonel, sadece log için
    let name = fileId;
    try {
      const meta = await drive.files.get({ fileId, fields: "name,mimeType,size", supportsAllDrives: true });
      name = meta.data.name ?? fileId;
      if (meta.data.mimeType && !meta.data.mimeType.startsWith("video/")) {
        console.warn(`  ⚠ video değil (${meta.data.mimeType}) ama yine de denenecek.`);
      }
    } catch { /* meta alınamazsa devam */ }
    console.log(`  Dosya: ${name}`);

    // 2. İndir
    console.log("  Drive'dan indiriliyor...");
    await downloadFromDrive(drive, fileId, inputFile);
    const originalMB = (statSync(inputFile).size / 1024 / 1024).toFixed(1);
    console.log(`  İndirildi: ${originalMB} MB`);

    // 3. Sıkıştır
    console.log("  Sıkıştırılıyor (720p H.264 CRF28)...");
    compress(inputFile, outputFile);
    const compressedMB = (statSync(outputFile).size / 1024 / 1024).toFixed(1);
    const savings = (100 - (statSync(outputFile).size / statSync(inputFile).size) * 100).toFixed(0);
    console.log(`  Sıkıştırıldı: ${compressedMB} MB (%${savings} küçüldü)`);

    // 4. R2'ye yükle
    const r2Key = `artists/videos/${Date.now()}-${Math.random().toString(36).slice(2)}.mp4`;
    console.log("  R2'ye yükleniyor...");
    await uploadToR2(outputFile, r2Key);
    const url = `${R2_PUBLIC_URL}/${r2Key}`;
    console.log(`  ✓ ${url}`);
    results.push({ link, note, url, error: null });
  } catch (err) {
    console.error(`  ✗ Hata: ${err.message}`);
    results.push({ link, note, url: null, error: err.message });
  } finally {
    if (existsSync(inputFile)) unlinkSync(inputFile);
    if (existsSync(outputFile)) unlinkSync(outputFile);
  }
}

// ── Özet — admin'e yapıştırılacak linkler ─────────────────────────────────────
console.log("\n\n========== SONUÇ (admin → sanatçı → video alanına yapıştır) ==========\n");
for (const r of results) {
  if (r.url) console.log(`${r.note ? r.note + " → " : ""}${r.url}`);
  else console.log(`✗ BAŞARISIZ${r.note ? " (" + r.note + ")" : ""}: ${r.link}  — ${r.error}`);
}
const ok = results.filter((r) => r.url).length;
console.log(`\n${ok}/${results.length} video aktarıldı.`);
