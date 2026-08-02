import { NextRequest, NextResponse } from "next/server";
import { requireEntityEditAccess, UUID_RE } from "@/lib/panel/enrichAuth";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { searchSpotifyArtists } from "@/lib/panel/spotify";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const { ok: withinLimit } = rateLimit(ip, "panel-enrich-spotify-search", { max: 30, windowMs: 60_000 });
  if (!withinLimit) {
    return NextResponse.json({ error: "Çok fazla istek. Lütfen bekleyin." }, { status: 429 });
  }

  const entityId = req.nextUrl.searchParams.get("entityId")?.trim() ?? "";
  if (!entityId || !UUID_RE.test(entityId)) {
    return NextResponse.json({ error: "Geçersiz entityId." }, { status: 400 });
  }

  const auth = await requireEntityEditAccess(entityId);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const query = req.nextUrl.searchParams.get("q")?.trim().slice(0, 120) ?? "";
  if (!query) return NextResponse.json({ error: "Arama sorgusu gerekli." }, { status: 400 });

  try {
    const candidates = await searchSpotifyArtists(query, 8);
    return NextResponse.json({ candidates });
  } catch (error) {
    console.error("Panel Spotify arama hatası:", error);
    return NextResponse.json({ error: "Spotify araması başarısız oldu." }, { status: 502 });
  }
}
