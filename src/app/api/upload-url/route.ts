import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/supabase";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

const ALLOWED_FOLDERS = [
  "artists/videos",
  "artists/photos",
  "partners/photos",
  "partners/logos",
  "journal/covers",
  "konseptler",
  "gorseller",
  "hero",
  "brand-feed",
  "memory-drive",
  "events",
  "artists",
  "brands",
  "journal",
  "other",
];

const ALLOWED_MIME_TYPES = [
  "image/jpeg", "image/jpg", "image/png", "image/webp",
  "image/gif", "image/avif",
  "video/mp4", "video/webm", "video/quicktime",
];

// Public folders don't require auth (used in artist/partner signup forms)
const PUBLIC_FOLDERS = ["partners/logos", "partners/photos", "artists/photos", "artists/videos"];

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { ok } = rateLimit(ip, "upload-url", { max: 20, windowMs: 60_000 });
  if (!ok) {
    return NextResponse.json({ error: "Çok fazla istek." }, { status: 429 });
  }

  const { folder, filename, contentType } = await req.json();

  if (!folder || !filename || !contentType) {
    return NextResponse.json({ error: "Eksik parametre." }, { status: 400 });
  }

  // Folder allowlist
  if (!ALLOWED_FOLDERS.some((f) => folder.startsWith(f))) {
    return NextResponse.json({ error: "Geçersiz klasör." }, { status: 400 });
  }

  // Path traversal
  if (folder.includes("..") || folder.includes("//") || folder.startsWith("/")) {
    return NextResponse.json({ error: "Geçersiz klasör yolu." }, { status: 400 });
  }

  // MIME check
  if (!ALLOWED_MIME_TYPES.includes(contentType)) {
    return NextResponse.json({ error: "Desteklenmeyen dosya türü." }, { status: 400 });
  }

  // Auth check for non-public folders
  const isPublic = PUBLIC_FOLDERS.some((f) => folder.startsWith(f));
  if (!isPublic) {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }
  }

  const ext = filename.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const supabase = createServiceClient();
  const { data, error } = await supabase.storage
    .from("images")
    .createSignedUploadUrl(path);

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "URL oluşturulamadı." }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from("images").getPublicUrl(path);

  return NextResponse.json({
    signedUrl: data.signedUrl,
    path,
    publicUrl: urlData.publicUrl,
  });
}
