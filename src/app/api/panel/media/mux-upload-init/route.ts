import { NextRequest, NextResponse } from "next/server";
import { requireEntityEditAccess, UUID_RE } from "@/lib/panel/enrichAuth";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { createServiceClient } from "@/lib/supabase";
import { createDirectUpload } from "@/lib/panel/mux";

// Sanatçı/mekan profiline native (Mux) video eklemenin ilk adımı: tarayıcının
// doğrudan (server'ımızı atlayarak) PUT edeceği imzalı bir yükleme URL'si
// üretir — /api/panel/media/upload'taki gibi dosyayı sunucuya proxy'lemek
// yerine, büyük video dosyalarını Vercel fonksiyon gövde limitinden hiç
// geçirmemek için. Asıl işleme (süre kontrolü, video_urls'e ekleme)
// mux-webhook route'unda, Mux video işlemeyi bitirince olur.

export const runtime = "nodejs";

const TABLE_BY_KIND = { venue: "venue_details", artist: "artist_profiles" } as const;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { ok: withinLimit } = rateLimit(ip, "panel-mux-upload-init", { max: 20, windowMs: 60_000 });
  if (!withinLimit) {
    return NextResponse.json({ error: "Çok fazla istek. Lütfen bekleyin." }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const entityId = String((body as Record<string, unknown>).entityId ?? "").trim();
  const kind = String((body as Record<string, unknown>).kind ?? "");

  if (!entityId || !UUID_RE.test(entityId)) {
    return NextResponse.json({ error: "Geçersiz entityId." }, { status: 400 });
  }
  if (kind !== "venue" && kind !== "artist") {
    return NextResponse.json({ error: "Geçersiz kind." }, { status: 400 });
  }

  const auth = await requireEntityEditAccess(entityId);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const table = TABLE_BY_KIND[kind];
  const supabase = createServiceClient();
  const { data: current, error: fetchError } = await supabase
    .from(table)
    .select("video_assets")
    .eq("entity_id", entityId)
    .maybeSingle();
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  if (!current) return NextResponse.json({ error: "Profil bulunamadı." }, { status: 404 });

  const corsOrigin = req.headers.get("origin") ?? "https://panel.noqt.social";

  let upload;
  try {
    upload = await createDirectUpload({ k: kind, e: entityId }, corsOrigin);
  } catch (error) {
    console.error("Mux direct upload oluşturma hatası:", error);
    return NextResponse.json({ error: "Video yükleme başlatılamadı." }, { status: 502 });
  }

  const existing: unknown[] = Array.isArray(current.video_assets) ? current.video_assets : [];
  const pendingEntry = {
    uploadId: upload.uploadId,
    assetId: null,
    playbackId: null,
    status: "uploading",
    durationSeconds: null,
    createdAt: new Date().toISOString(),
  };

  const { error: updateError } = await supabase
    .from(table)
    .update({ video_assets: [...existing, pendingEntry] })
    .eq("entity_id", entityId);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ uploadUrl: upload.uploadUrl, uploadId: upload.uploadId });
}
