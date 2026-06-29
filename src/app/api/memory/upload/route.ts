import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { uploadToR2 } from "@/lib/r2";

const MAX_IMAGE = 20 * 1024 * 1024; // 20 MB
const MAX_VIDEO = 500 * 1024 * 1024; // 500 MB
const ALLOWED_MIME = [
  "image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic", "image/heif",
  "video/mp4", "video/mov", "video/quicktime", "video/webm",
];

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { ok } = rateLimit(ip, "memory-upload", { max: 20, windowMs: 60_000 });
  if (!ok) return NextResponse.json({ error: "Çok fazla istek." }, { status: 429 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const eventSlug = formData.get("event_slug") as string | null;
  const uploaderName = (formData.get("uploader_name") as string) || null;

  if (!file || file.size === 0) return NextResponse.json({ error: "Dosya yok." }, { status: 400 });
  if (!eventSlug) return NextResponse.json({ error: "Etkinlik belirtilmedi." }, { status: 400 });
  if (!ALLOWED_MIME.includes(file.type)) return NextResponse.json({ error: "Desteklenmeyen dosya türü." }, { status: 400 });

  const isVideo = file.type.startsWith("video/");
  if (file.size > (isVideo ? MAX_VIDEO : MAX_IMAGE)) {
    return NextResponse.json({ error: `Dosya boyutu çok büyük. Maks: ${isVideo ? "500MB" : "20MB"}` }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: event } = await supabase
    .from("memory_events")
    .select("id, is_active")
    .eq("slug", eventSlug)
    .eq("is_active", true)
    .single();

  if (!event) return NextResponse.json({ error: "Etkinlik bulunamadı." }, { status: 404 });

  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const path = `${event.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  let fileUrl: string;
  try {
    fileUrl = await uploadToR2(path, buffer, file.type);
  } catch (err) {
    console.error("R2 upload error:", err);
    return NextResponse.json({ error: "Yükleme başarısız." }, { status: 500 });
  }

  await supabase.from("memory_uploads").insert({
    event_id: event.id,
    file_url: fileUrl,
    file_path: path,
    file_type: isVideo ? "video" : "image",
    file_name: file.name,
    file_size: file.size,
    uploader_name: uploaderName?.trim() || null,
  });

  return NextResponse.json({ url: fileUrl, type: isVideo ? "video" : "image" });
}
