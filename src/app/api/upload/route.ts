import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/supabase";
import { uploadToR2 } from "@/lib/r2";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

export const maxDuration = 60;

const PUBLIC_FOLDERS = ["partners/logos", "partners/photos", "artists/photos", "artists/videos", "invitations/covers", "invitations/seating", "memory"];

const ALLOWED_FOLDERS = [
  ...PUBLIC_FOLDERS,
  "journal/covers",
  "konseptler",
  "gorseller",
  // site asset categories (admin/gorseller)
  "hero",
  "brand-feed",
  "memory-drive",
  "events",
  "artists",
  "brands",
  "journal",
  "other",
  "invitations/covers",
  "invitations/seating",
];

const ALLOWED_MIME_TYPES = [
  "image/jpeg", "image/jpg", "image/png", "image/webp",
  "image/gif", "image/avif", "image/svg+xml",
  "video/mp4", "video/webm", "video/quicktime",
];

const MAX_IMAGE_SIZE = 15 * 1024 * 1024; // 15 MB
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500 MB

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { ok } = rateLimit(ip, "upload", { max: 30, windowMs: 60_000 });
  if (!ok) {
    return NextResponse.json({ error: "Çok fazla istek. Lütfen bekleyin." }, { status: 429 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const folder = (formData.get("folder") as string) || "uploads";

  // Klasör allowlist kontrolü
  const isAllowedFolder = ALLOWED_FOLDERS.some((f) => folder.startsWith(f));
  if (!isAllowedFolder) {
    return NextResponse.json({ error: "Geçersiz klasör." }, { status: 400 });
  }

  // Path traversal koruması
  if (folder.includes("..") || folder.includes("//") || folder.startsWith("/")) {
    return NextResponse.json({ error: "Geçersiz klasör yolu." }, { status: 400 });
  }

  const isPublicFolder = PUBLIC_FOLDERS.some((f) => folder.startsWith(f));
  if (!isPublicFolder) {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }
  }

  if (!file || file.size === 0) {
    return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 400 });
  }

  // MIME type kontrolü
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Desteklenmeyen dosya türü. Yalnızca resim ve video yüklenebilir." }, { status: 400 });
  }

  // Boyut kontrolü
  const isVideo = file.type.startsWith("video/");
  const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
  if (file.size > maxSize) {
    const limitMb = maxSize / 1024 / 1024;
    return NextResponse.json({ error: `Dosya boyutu ${limitMb} MB limitini aşıyor.` }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  if (isVideo) {
    let fileUrl: string;
    try {
      fileUrl = await uploadToR2(path, buffer, file.type);
    } catch (err) {
      console.error("R2 upload error:", err);
      return NextResponse.json({ error: "Video yükleme başarısız." }, { status: 500 });
    }
    return NextResponse.json({ url: fileUrl, path });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase.storage
    .from("images")
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (error) {
    console.error("Supabase upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from("images").getPublicUrl(data.path);
  return NextResponse.json({ url: urlData.publicUrl, path: data.path });
}
