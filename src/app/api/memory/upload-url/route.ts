import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { r2, R2_PUBLIC_URL } from "@/lib/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Vercel function body limiti ~4.5MB olduğundan misafir yüklemeleri
// presigned URL ile tarayıcıdan doğrudan R2'ye gider.

const MAX_IMAGE = 20 * 1024 * 1024; // 20 MB
const MAX_VIDEO = 500 * 1024 * 1024; // 500 MB
const ALLOWED_MIME = [
  "image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic", "image/heif",
  "video/mp4", "video/mov", "video/quicktime", "video/webm",
];

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { ok } = rateLimit(ip, "memory-upload-url", { max: 60, windowMs: 60_000 });
  if (!ok) return NextResponse.json({ error: "Çok fazla istek." }, { status: 429 });

  const { event_slug, filename, contentType, size } = await req.json();

  if (!event_slug || !filename || !contentType) {
    return NextResponse.json({ error: "Eksik parametre." }, { status: 400 });
  }
  if (!ALLOWED_MIME.includes(contentType)) {
    return NextResponse.json({ error: "Desteklenmeyen dosya türü." }, { status: 400 });
  }

  const isVideo = contentType.startsWith("video/");
  const maxSize = isVideo ? MAX_VIDEO : MAX_IMAGE;
  if (typeof size !== "number" || size <= 0 || size > maxSize) {
    return NextResponse.json(
      { error: `Dosya boyutu çok büyük. Maks: ${isVideo ? "500MB" : "20MB"}` },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();
  const { data: event } = await supabase
    .from("memory_events")
    .select("id, is_active")
    .eq("slug", event_slug)
    .eq("is_active", true)
    .single();

  if (!event) return NextResponse.json({ error: "Etkinlik bulunamadı." }, { status: 404 });

  const ext = String(filename).split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const path = `${event.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME ?? "noqt-memory",
    Key: path,
    ContentType: contentType,
    ContentLength: size,
  });
  const signedUrl = await getSignedUrl(r2, command, { expiresIn: 3600 });

  return NextResponse.json({
    signedUrl,
    path,
    publicUrl: `${R2_PUBLIC_URL}/${path}`,
    type: isVideo ? "video" : "image",
  });
}
