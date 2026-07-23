// Teklif konsept görsellerini Supabase'e toplu yükler.
// Kullanım: node scripts/upload-offer-concepts.mjs "noqt.events konseptler"
// Klasör adı → kategori, dosya adı → konsept adı olarak kaydedilir.
// Aynı kategori+ad tekrar yüklenirse üzerine yazılır (upsert) — script tekrar çalıştırılabilir.

import { createClient } from "@supabase/supabase-js";
import { readdirSync, readFileSync, existsSync } from "fs";
import { join, extname, basename } from "path";
import { config } from "dotenv";

// Önce .env.vercel (npx vercel env pull .env.vercel ile indirilir), yoksa .env.local
config({ path: ".env.vercel" });
config({ path: ".env.local" });

const FOLDER_CATEGORY_MAP = {
  "nişan konseptler": "nisan",
  "evde nişan konseptler": "evde-nisan",
  "evlilik teklifi konseptler": "evlilik-teklifi",
  "Kurumsal etkinlik konseptler": "kurumsal",
};

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY .env.local'da tanımlı olmalı.");
  process.exit(1);
}
const supabase = createClient(url, key);

const rootDir = process.argv[2];
if (!rootDir || !existsSync(rootDir)) {
  console.error(`Klasör bulunamadı: ${rootDir}\nKullanım: node scripts/upload-offer-concepts.mjs "noqt.events konseptler"`);
  process.exit(1);
}

// "BOHO CHIC SET" → "Boho Chic Set"
function titleCase(s) {
  return s
    .toLocaleLowerCase("tr-TR")
    .split(/\s+/)
    .map((w) => w.charAt(0).toLocaleUpperCase("tr-TR") + w.slice(1))
    .join(" ");
}

function slugify(s) {
  return s
    .toLocaleLowerCase("tr-TR")
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const CONTENT_TYPES = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" };

let uploaded = 0, skipped = 0, failed = 0;

for (const [folderName, category] of Object.entries(FOLDER_CATEGORY_MAP)) {
  const dir = join(rootDir, folderName);
  if (!existsSync(dir)) {
    console.warn(`Atlandı (klasör yok): ${folderName}`);
    continue;
  }
  const files = readdirSync(dir).filter((f) => CONTENT_TYPES[extname(f).toLowerCase()]);
  console.log(`\n${folderName} → kategori "${category}" (${files.length} görsel)`);

  let sortOrder = 0;
  for (const file of files.sort()) {
    const ext = extname(file).toLowerCase();
    const rawName = basename(file, extname(file)).replace(/\s*&\s*/g, " & ").trim();
    const name = titleCase(rawName);
    const storagePath = `offer-concepts/${category}/${slugify(rawName)}${ext}`;

    try {
      const buf = readFileSync(join(dir, file));
      const { error: upErr } = await supabase.storage
        .from("images")
        .upload(storagePath, buf, { contentType: CONTENT_TYPES[ext], upsert: true });
      if (upErr) throw new Error(`storage: ${upErr.message}`);

      const { data: pub } = supabase.storage.from("images").getPublicUrl(storagePath);
      const { error: dbErr } = await supabase
        .from("offer_concepts")
        .upsert(
          { category, name, image_url: pub.publicUrl, sort_order: sortOrder },
          { onConflict: "category,name" }
        );
      if (dbErr) throw new Error(`db: ${dbErr.message}`);

      console.log(`  ✓ ${name}`);
      uploaded += 1;
      sortOrder += 1;
    } catch (e) {
      console.error(`  ✗ ${file}: ${e.message}`);
      failed += 1;
    }
  }
}

console.log(`\nBitti: ${uploaded} yüklendi, ${skipped} atlandı, ${failed} hata.`);
if (failed > 0) process.exit(1);
