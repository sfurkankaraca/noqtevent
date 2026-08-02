import { NextRequest, NextResponse } from "next/server";
import { requireEntityEditAccess, UUID_RE } from "@/lib/panel/enrichAuth";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { searchGooglePlaces } from "@/lib/panel/googlePlaces";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const { ok: withinLimit } = rateLimit(ip, "panel-enrich-venue-google-search", { max: 30, windowMs: 60_000 });
  if (!withinLimit) {
    return NextResponse.json({ error: "Çok fazla istek. Lütfen bekleyin." }, { status: 429 });
  }

  const entityId = req.nextUrl.searchParams.get("entityId")?.trim() ?? "";
  if (!entityId || !UUID_RE.test(entityId)) {
    return NextResponse.json({ error: "Geçersiz entityId." }, { status: 400 });
  }

  const auth = await requireEntityEditAccess(entityId);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const query = req.nextUrl.searchParams.get("q")?.trim().slice(0, 160) ?? "";
  if (query.length < 3) return NextResponse.json({ error: "Arama sorgusu gerekli." }, { status: 400 });

  try {
    const candidates = await searchGooglePlaces(query, 8);
    return NextResponse.json({ candidates });
  } catch (error) {
    console.error("Panel Google Places arama hatası:", error);
    return NextResponse.json({ error: "Google Places araması başarısız oldu." }, { status: 502 });
  }
}
