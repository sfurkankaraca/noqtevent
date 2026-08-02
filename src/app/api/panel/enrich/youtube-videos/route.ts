import { NextRequest, NextResponse } from "next/server";
import { requireEntityEditAccess, UUID_RE } from "@/lib/panel/enrichAuth";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { getChannelVideos } from "@/lib/panel/youtube";

export const runtime = "nodejs";

const YOUTUBE_CHANNEL_ID_RE = /^UC[A-Za-z0-9_-]{22}$/;

// "Kanaldan video getir" — sanatçının zaten bağlı olduğu YouTube kanalının
// (youtube_channel_id) son yüklediği videoları listeler. search.list KULLANMAZ
// (bkz. src/lib/panel/youtube.ts başındaki not — channels.list + playlistItems.list
// + videos.list = 3 birim, search.list'in 1/33'ü kota maliyeti).
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const { ok: withinLimit } = rateLimit(ip, "panel-enrich-youtube-videos", { max: 20, windowMs: 60_000 });
  if (!withinLimit) {
    return NextResponse.json({ error: "Çok fazla istek. Lütfen bekleyin." }, { status: 429 });
  }

  const entityId = req.nextUrl.searchParams.get("entityId")?.trim() ?? "";
  if (!entityId || !UUID_RE.test(entityId)) {
    return NextResponse.json({ error: "Geçersiz entityId." }, { status: 400 });
  }

  const auth = await requireEntityEditAccess(entityId);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const channelId = req.nextUrl.searchParams.get("channelId")?.trim() ?? "";
  if (!channelId || !YOUTUBE_CHANNEL_ID_RE.test(channelId)) {
    return NextResponse.json({ error: "Geçersiz channelId." }, { status: 400 });
  }

  try {
    const videos = await getChannelVideos(channelId, 12);
    return NextResponse.json({ videos });
  } catch (error) {
    console.error("Panel YouTube video listesi hatası:", error);
    return NextResponse.json({ error: "Kanal videoları alınamadı." }, { status: 502 });
  }
}
