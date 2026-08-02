import { NextRequest, NextResponse } from "next/server";
import { requireEntityEditAccess, UUID_RE } from "@/lib/panel/enrichAuth";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { createServiceClient } from "@/lib/supabase";
import { getYoutubeChannel } from "@/lib/panel/youtube";

export const runtime = "nodejs";

const YOUTUBE_CHANNEL_ID_RE = /^UC[A-Za-z0-9_-]{22}$/;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { ok: withinLimit } = rateLimit(ip, "panel-enrich-youtube-apply", { max: 20, windowMs: 60_000 });
  if (!withinLimit) {
    return NextResponse.json({ error: "Çok fazla istek. Lütfen bekleyin." }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const entityId = String((body as Record<string, unknown>).entityId ?? "").trim();
  const channelId = String((body as Record<string, unknown>).channelId ?? "").trim();

  if (!entityId || !UUID_RE.test(entityId)) {
    return NextResponse.json({ error: "Geçersiz entityId." }, { status: 400 });
  }
  if (!channelId || !YOUTUBE_CHANNEL_ID_RE.test(channelId)) {
    return NextResponse.json({ error: "Geçersiz channelId." }, { status: 400 });
  }

  const auth = await requireEntityEditAccess(entityId);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const channel = await getYoutubeChannel(channelId).catch((error) => {
    console.error("Panel YouTube kanal çekme hatası:", error);
    return null;
  });
  if (!channel) return NextResponse.json({ error: "YouTube kanalı bulunamadı." }, { status: 502 });

  const supabase = createServiceClient();
  const { data: current, error: fetchError } = await supabase
    .from("artist_profiles")
    .select("links")
    .eq("entity_id", entityId)
    .maybeSingle();
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  if (!current) return NextResponse.json({ error: "Sanatçı bulunamadı." }, { status: 404 });

  const links = { ...(current.links as Record<string, string> | null ?? {}) };
  links.youtube = channel.url;

  const update: Record<string, unknown> = {
    links,
    youtube_channel_id: channel.id,
  };

  const { error: updateError } = await supabase.from("artist_profiles").update(update).eq("entity_id", entityId);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ ok: true, channel });
}
