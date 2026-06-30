/**
 * upload-to-youtube.mjs
 * Downloads R2 videos from Supabase DB, uploads to YouTube as unlisted,
 * then updates Supabase: moves URL from videos[] to youtube_links[].
 *
 * Setup:
 *   npm install googleapis
 *
 * First run (get auth token):
 *   node scripts/upload-to-youtube.mjs --auth
 *
 * Upload all videos:
 *   node scripts/upload-to-youtube.mjs
 *
 * Dry run (list without uploading):
 *   node scripts/upload-to-youtube.mjs --dry-run
 */

import { google } from "googleapis";
import { existsSync, mkdirSync, unlinkSync, writeFileSync, readFileSync } from "fs";
import { writeFile } from "fs/promises";
import { execSync } from "child_process";
import path from "path";
import os from "os";
import { createReadStream, statSync } from "fs";

// .env.local otomatik yükle
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
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? "https://media.noqt.events";
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME ?? "noqt-memory";

const TOKEN_PATH = path.join(os.homedir(), ".noqt-youtube-token.json");
const DRY_RUN = process.argv.includes("--dry-run");
const AUTH_ONLY = process.argv.includes("--auth");

// ── Validation ────────────────────────────────────────────────────────────────
const missing = [
  !GOOGLE_CLIENT_ID && "GOOGLE_CLIENT_ID",
  !GOOGLE_CLIENT_SECRET && "GOOGLE_CLIENT_SECRET",
  !SUPABASE_URL && "NEXT_PUBLIC_SUPABASE_URL",
  !SUPABASE_SERVICE_KEY && "SUPABASE_SERVICE_ROLE_KEY",
].filter(Boolean);

if (missing.length) {
  console.error("Missing env vars:", missing.join(", "));
  process.exit(1);
}

// ── OAuth setup ───────────────────────────────────────────────────────────────
const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  "urn:ietf:wg:oauth:2.0:oob"
);

async function authenticate() {
  if (existsSync(TOKEN_PATH)) {
    const token = JSON.parse(readFileSync(TOKEN_PATH, "utf-8"));
    oauth2Client.setCredentials(token);
    return;
  }

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/youtube.upload"],
  });

  console.log("\n1. Bu URL'i tarayıcıda aç:");
  console.log("\n   " + authUrl + "\n");
  console.log("2. İzin ver → kodu kopyala");
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
  console.log("✓ Token kaydedildi\n");
}

// ── Fetch videos from Supabase ────────────────────────────────────────────────
async function fetchDJs() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/dj_profiles?select=id,name,preview_video_url,videos,youtube_links`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    }
  );
  if (!res.ok) throw new Error(`Supabase error: ${res.status} ${await res.text()}`);
  return res.json();
}

// ── Update Supabase: move R2 URL → YouTube link ────────────────────────────────
async function updateSupabase(djId, r2Url, youtubeUrl, dj) {
  const newVideos = (dj.videos ?? []).filter((u) => u !== r2Url);
  const newYoutubeLinks = [...(dj.youtube_links ?? []), youtubeUrl];
  const newPreview = dj.preview_video_url === r2Url
    ? (newVideos[0] ?? null)
    : dj.preview_video_url;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/dj_profiles?id=eq.${djId}`, {
    method: "PATCH",
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      videos: newVideos,
      youtube_links: newYoutubeLinks,
      preview_video_url: newPreview,
    }),
  });
  if (!res.ok) throw new Error(`Supabase update error: ${res.status}`);
}

// ── Upload to YouTube ─────────────────────────────────────────────────────────
async function uploadToYouTube(filePath, title) {
  const youtube = google.youtube({ version: "v3", auth: oauth2Client });
  const fileSize = statSync(filePath).size;

  console.log(`  Uploading to YouTube (${(fileSize / 1024 / 1024).toFixed(1)} MB)...`);

  const res = await youtube.videos.insert({
    part: ["snippet", "status"],
    requestBody: {
      snippet: {
        title,
        description: "noqt.events",
        categoryId: "10", // Music
      },
      status: {
        privacyStatus: "unlisted",
      },
    },
    media: {
      body: createReadStream(filePath),
    },
  });

  return `https://www.youtube.com/watch?v=${res.data.id}`;
}

// ── Main ──────────────────────────────────────────────────────────────────────
await authenticate();
if (AUTH_ONLY) { console.log("✓ Auth tamamlandı."); process.exit(0); }

console.log("Supabase'den videolar alınıyor...");
const djs = await fetchDJs();

// Collect all R2 videos
const tasks = [];
for (const dj of djs) {
  const r2Urls = [
    ...(dj.videos ?? []).filter((u) => u.includes(R2_PUBLIC_URL)),
    ...(dj.preview_video_url && dj.preview_video_url.includes(R2_PUBLIC_URL)
      ? [dj.preview_video_url]
      : []),
  ];
  const unique = [...new Set(r2Urls)];
  for (const url of unique) {
    tasks.push({ dj, url });
  }
}

console.log(`${tasks.length} R2 video bulundu\n`);

if (DRY_RUN) {
  for (const { dj, url } of tasks) {
    console.log(`[${dj.name}] ${url}`);
  }
  process.exit(0);
}

const tmpDir = path.join(os.tmpdir(), "noqt-yt-upload");
mkdirSync(tmpDir, { recursive: true });

// Init S3 client once
const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
});

let i = 0;
for (const { dj, url } of tasks) {
  i++;
  const ext = path.extname(url.split("?")[0]) || ".mp4";
  const rawFile = path.join(tmpDir, `raw_${i}${ext}`);
  const compFile = path.join(tmpDir, `comp_${i}.mp4`);

  console.log(`\n[${i}/${tasks.length}] ${dj.name} — ${path.basename(url)}`);

  try {
    // 1. Download from R2 via S3 API
    console.log("  İndiriliyor...");
    const r2Key = url.replace(`${R2_PUBLIC_URL}/`, "");
    const s3Res = await s3.send(new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: r2Key }));
    const chunks = [];
    for await (const chunk of s3Res.Body) chunks.push(chunk);
    await writeFile(rawFile, Buffer.concat(chunks));
    const rawMB = (statSync(rawFile).size / 1024 / 1024).toFixed(0);
    console.log(`  Orijinal: ${rawMB} MB`);

    // 2. Compress with ffmpeg before upload
    console.log("  Sıkıştırılıyor (720p H.264)...");
    execSync(
      `ffmpeg -y -i "${rawFile}" -vf "scale='if(gte(iw,ih),min(1280,iw),-2)':'if(gte(iw,ih),-2,min(720,ih))'" ` +
      `-c:v libx264 -crf 28 -preset fast -movflags +faststart -c:a aac -b:a 128k -pix_fmt yuv420p "${compFile}"`,
      { stdio: "pipe" }
    );
    if (existsSync(rawFile)) unlinkSync(rawFile);
    const compMB = (statSync(compFile).size / 1024 / 1024).toFixed(0);
    console.log(`  Sıkıştırılmış: ${compMB} MB`);

    // 3. Upload to YouTube
    const title = `${dj.name} - Performans ${i}`;
    const ytUrl = await uploadToYouTube(compFile, title);
    console.log(`  ✓ YouTube: ${ytUrl}`);

    // Update Supabase
    console.log("  Supabase güncelleniyor...");
    await updateSupabase(dj.id, url, ytUrl, dj);
    console.log("  ✓ DB güncellendi");
  } catch (err) {
    console.error(`  ✗ Hata: ${err.message}`);
  } finally {
    if (existsSync(rawFile)) unlinkSync(rawFile);
    if (existsSync(compFile)) unlinkSync(compFile);
  }
}

console.log("\n✓ Tüm videolar işlendi.");
