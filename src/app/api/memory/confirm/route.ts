import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { R2_PUBLIC_URL } from "@/lib/r2";

// Presigned yükleme tamamlandıktan sonra memory_uploads kaydını oluşturur.

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { ok } = rateLimit(ip, "memory-confirm", { max: 60, windowMs: 60_000 });
  if (!ok) return NextResponse.json({ error: "Çok fazla istek." }, { status: 429 });

  const { event_slug, path, file_name, file_size, file_type, uploader_name } = await req.json();

  if (!event_slug || !path || !file_type) {
    return NextResponse.json({ error: "Eksik parametre." }, { status: 400 });
  }
  if (file_type !== "image" && file_type !== "video") {
    return NextResponse.json({ error: "Geçersiz dosya türü." }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: event } = await supabase
    .from("memory_events")
    .select("id, is_active")
    .eq("slug", event_slug)
    .eq("is_active", true)
    .single();

  if (!event) return NextResponse.json({ error: "Etkinlik bulunamadı." }, { status: 404 });

  // Path bu etkinliğe ait olmalı ve traversal içermemeli
  const cleanPath = String(path);
  if (!cleanPath.startsWith(`${event.id}/`) || cleanPath.includes("..")) {
    return NextResponse.json({ error: "Geçersiz dosya yolu." }, { status: 400 });
  }

  const { error } = await supabase.from("memory_uploads").insert({
    event_id: event.id,
    file_url: `${R2_PUBLIC_URL}/${cleanPath}`,
    file_path: cleanPath,
    file_type,
    file_name: file_name ? String(file_name).slice(0, 300) : null,
    file_size: Number(file_size) || null,
    uploader_name: uploader_name ? String(uploader_name).trim().slice(0, 120) || null : null,
  });

  if (error) {
    console.error("memory confirm insert error:", error.message);
    return NextResponse.json({ error: "Kayıt oluşturulamadı." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, url: `${R2_PUBLIC_URL}/${cleanPath}` });
}
