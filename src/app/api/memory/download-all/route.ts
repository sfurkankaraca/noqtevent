import { NextRequest, NextResponse } from "next/server";
import { ZipArchive } from "archiver";
import { PassThrough, Readable } from "node:stream";
import { createServiceClient } from "@/lib/supabase";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { canViewMemoryGallery } from "@/lib/memoryGallery";

export const runtime = "nodejs";
export const maxDuration = 300;

// Galerideki tüm fotoğrafları tek bir zip olarak indirir. Videolar dahil edilmez —
// R2'de büyük dosyalar (video başına 500MB'a kadar) fonksiyon süresini/belleğini
// zorlayabileceğinden videolar ayrı ayrı indirilmeye devam eder (/api/download).
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const { ok } = rateLimit(ip, "memory-download-all", { max: 5, windowMs: 10 * 60_000 });
  if (!ok) return NextResponse.json({ error: "Çok fazla istek. Lütfen birkaç dakika bekleyin." }, { status: 429 });

  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug parametresi gerekli" }, { status: 400 });
  const k = req.nextUrl.searchParams.get("k");

  const supabase = createServiceClient();
  const { data: event } = await supabase
    .from("memory_events")
    .select("id, title, is_active, gallery_visibility, gallery_token")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();
  if (!event) return NextResponse.json({ error: "Etkinlik bulunamadı." }, { status: 404 });

  // Bulgu 1: özel galeride zip ucu da galeri sayfasıyla aynı ?k=<gallery_token> kapısından geçer.
  if (!canViewMemoryGallery(event, k)) {
    return NextResponse.json({ error: "Bu galeri özeldir." }, { status: 403 });
  }

  const { data: uploads } = await supabase
    .from("memory_uploads")
    .select("file_url, file_name, file_type")
    .eq("event_id", event.id)
    .eq("file_type", "image");

  const photos = uploads ?? [];
  if (photos.length === 0) {
    return NextResponse.json({ error: "İndirilecek fotoğraf yok." }, { status: 404 });
  }

  const archive = new ZipArchive({ zlib: { level: 6 } });
  const passthrough = new PassThrough();
  archive.pipe(passthrough);

  const usedNames = new Set<string>();
  const safeName = (raw: string | null, i: number, url: string) => {
    const ext = url.split(".").pop()?.split("?")[0]?.slice(0, 5) || "jpg";
    let base = (raw || `foto-${i + 1}`).replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
    if (!base.includes(".")) base += `.${ext}`;
    let name = base;
    let n = 1;
    while (usedNames.has(name)) name = `${base.replace(/\.[^.]+$/, "")}-${n++}${base.match(/\.[^.]+$/)?.[0] ?? ""}`;
    usedNames.add(name);
    return name;
  };

  (async () => {
    try {
      for (let i = 0; i < photos.length; i++) {
        const p = photos[i];
        try {
          const res = await fetch(p.file_url);
          if (!res.ok || !res.body) continue;
          const buffer = Buffer.from(await res.arrayBuffer());
          archive.append(buffer, { name: safeName(p.file_name, i, p.file_url) });
        } catch (err) {
          console.error("[download-all] dosya alınamadı:", p.file_url, err);
        }
      }
    } finally {
      archive.finalize();
    }
  })();

  archive.on("error", (err: Error) => {
    console.error("[download-all] arşiv hatası:", err);
    passthrough.destroy(err);
  });

  const safeTitleName = event.title.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 60) || "memory-drive";

  return new NextResponse(Readable.toWeb(passthrough) as ReadableStream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${safeTitleName}-fotograflar.zip"`,
    },
  });
}
