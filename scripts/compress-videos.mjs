/**
 * compress-videos.mjs
 * Downloads all R2 videos from Supabase DB, compresses to 720p H.264 with ffmpeg,
 * then re-uploads to R2 with the same key (public URL unchanged).
 *
 * Requirements:
 *   - ffmpeg installed (brew install ffmpeg)
 *   - Fill in credentials below OR set as env vars
 *
 * Usage:
 *   node scripts/compress-videos.mjs
 *   node scripts/compress-videos.mjs --dry-run   # list videos without compressing
 */

import { execSync } from "child_process";
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from "fs";
import { readFile } from "fs/promises";
import path from "path";
import os from "os";

// ── Credentials ──────────────────────────────────────────────────────────────
// Set these as env vars or fill in directly:
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME ?? "noqt-memory";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? "https://media.noqt.events";

const DRY_RUN = process.argv.includes("--dry-run");

// ── Validation ────────────────────────────────────────────────────────────────
const missing = [
  !SUPABASE_URL && "NEXT_PUBLIC_SUPABASE_URL",
  !SUPABASE_SERVICE_KEY && "SUPABASE_SERVICE_ROLE_KEY",
  !CLOUDFLARE_ACCOUNT_ID && "CLOUDFLARE_ACCOUNT_ID",
  !R2_ACCESS_KEY_ID && "R2_ACCESS_KEY_ID",
  !R2_SECRET_ACCESS_KEY && "R2_SECRET_ACCESS_KEY",
].filter(Boolean);

if (missing.length) {
  console.error("Missing env vars:", missing.join(", "));
  console.error("\nRun with:");
  console.error(
    `  CLOUDFLARE_ACCOUNT_ID=xxx R2_ACCESS_KEY_ID=xxx R2_SECRET_ACCESS_KEY=xxx \\\n` +
    `  NEXT_PUBLIC_SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx \\\n` +
    `  node scripts/compress-videos.mjs`
  );
  process.exit(1);
}

// ── Fetch all video URLs from Supabase ────────────────────────────────────────
async function fetchVideoUrls() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/dj_profiles?select=id,name,preview_video_url,videos,youtube_links`, {
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
  });
  if (!res.ok) throw new Error(`Supabase error: ${res.status} ${await res.text()}`);
  const djs = await res.json();

  const videoMap = new Map(); // url → { djName, field, djId }
  for (const dj of djs) {
    const addUrl = (url, field) => {
      if (url && url.includes(R2_PUBLIC_URL)) {
        videoMap.set(url, { djName: dj.name, field, djId: dj.id });
      }
    };
    addUrl(dj.preview_video_url, "preview_video_url");
    if (Array.isArray(dj.videos)) dj.videos.forEach(u => addUrl(u, "videos"));
  }
  return videoMap;
}

// ── R2 upload via AWS S3 SDK ──────────────────────────────────────────────────
async function uploadToR2(localPath, r2Key) {
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  const { createReadStream } = await import("fs");

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

// ── Compress with ffmpeg ──────────────────────────────────────────────────────
function compress(inputPath, outputPath) {
  // 720p max, H.264 CRF 28 (good quality/size balance), AAC 128k audio
  execSync(
    `ffmpeg -y -i "${inputPath}" -vf "scale='min(1280,iw)':'min(720,ih)':force_original_aspect_ratio=decrease" ` +
    `-c:v libx264 -crf 28 -preset fast -movflags +faststart ` +
    `-c:a aac -b:a 128k "${outputPath}"`,
    { stdio: "inherit" }
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
const tmpDir = path.join(os.tmpdir(), "noqt-compress");
mkdirSync(tmpDir, { recursive: true });

console.log("Fetching video list from Supabase...");
const videoMap = await fetchVideoUrls();
console.log(`Found ${videoMap.size} R2 videos\n`);

if (DRY_RUN) {
  for (const [url, meta] of videoMap) {
    console.log(`[${meta.djName}] ${url}`);
  }
  process.exit(0);
}

let i = 0;
for (const [url, meta] of videoMap) {
  i++;
  const r2Key = url.replace(`${R2_PUBLIC_URL}/`, "");
  const ext = path.extname(r2Key) || ".mp4";
  const baseName = path.basename(r2Key, ext);
  const inputFile = path.join(tmpDir, `input_${i}${ext}`);
  const outputFile = path.join(tmpDir, `output_${i}.mp4`);

  console.log(`\n[${i}/${videoMap.size}] ${meta.djName} — ${r2Key}`);

  try {
    // 1. Download
    console.log("  Downloading...");
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Download failed: ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const originalSize = (buf.length / 1024 / 1024).toFixed(1);
    writeFileSync(inputFile, buf);
    console.log(`  Original: ${originalSize} MB`);

    // 2. Compress
    console.log("  Compressing (720p H.264 CRF28)...");
    compress(inputFile, outputFile);
    const { statSync } = await import("fs");
    const compressedSize = (statSync(outputFile).size / 1024 / 1024).toFixed(1);
    const savings = (100 - (statSync(outputFile).size / buf.length) * 100).toFixed(0);
    console.log(`  Compressed: ${compressedSize} MB (${savings}% smaller)`);

    // 3. Re-upload
    console.log("  Uploading to R2...");
    // Use .mp4 extension for the final key
    const finalKey = r2Key.replace(/\.[^.]+$/, ".mp4");
    await uploadToR2(outputFile, finalKey);
    console.log(`  ✓ Done — ${R2_PUBLIC_URL}/${finalKey}`);
  } catch (err) {
    console.error(`  ✗ Error: ${err.message}`);
  } finally {
    if (existsSync(inputFile)) unlinkSync(inputFile);
    if (existsSync(outputFile)) unlinkSync(outputFile);
  }
}

console.log("\n✓ All videos processed.");
