import { NextRequest, NextResponse } from "next/server";
import { requireEntityEditAccess, UUID_RE } from "@/lib/panel/enrichAuth";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { createServiceClient } from "@/lib/supabase";
import { isAllowedVideoUrl } from "@/lib/panel/media";

export const runtime = "nodejs";

// "Kanaldan video getir" bölümünde seçilen videoları tek tıkla video_urls'e
// ekler — youtube-videos GET route'unun (liste) yazma karşılığı, spotify-apply
// / venue-google-apply route'larıyla AYNI desen: kendi fetch'iyle doğrudan
// DB'ye yazar, MediaManager'ın büyük form state'ine dokunmaz.
const MAX_URLS_PER_REQUEST = 12;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { ok: withinLimit } = rateLimit(ip, "panel-enrich-youtube-videos-apply", { max: 20, windowMs: 60_000 });
  if (!withinLimit) {
    return NextResponse.json({ error: "Çok fazla istek. Lütfen bekleyin." }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const entityId = String((body as Record<string, unknown>).entityId ?? "").trim();
  const rawUrls = (body as Record<string, unknown>).videoUrls;

  if (!entityId || !UUID_RE.test(entityId)) {
    return NextResponse.json({ error: "Geçersiz entityId." }, { status: 400 });
  }
  if (!Array.isArray(rawUrls) || rawUrls.length === 0) {
    return NextResponse.json({ error: "Eklenecek video seçilmedi." }, { status: 400 });
  }

  // isAllowedVideoUrl — src/lib/panel/media.ts'teki AYNI host kısıtlaması
  // (yalnız youtube.com/youtu.be/vimeo.com, https) server tarafında TEKRAR
  // uygulanıyor (asıl güvenlik sınırı — client'ın gönderdiği liste güvenilmez).
  const candidateUrls = rawUrls
    .filter((u): u is string => typeof u === "string")
    .slice(0, MAX_URLS_PER_REQUEST)
    .filter(isAllowedVideoUrl);
  if (candidateUrls.length === 0) {
    return NextResponse.json({ error: "Geçerli video linki bulunamadı." }, { status: 400 });
  }

  const auth = await requireEntityEditAccess(entityId);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = createServiceClient();
  const { data: current, error: fetchError } = await supabase
    .from("artist_profiles")
    .select("video_urls")
    .eq("entity_id", entityId)
    .maybeSingle();
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  if (!current) return NextResponse.json({ error: "Sanatçı bulunamadı." }, { status: 404 });

  // Mükerrer eklenmez, mevcut liste korunur.
  const existing: string[] = Array.isArray(current.video_urls) ? current.video_urls : [];
  const merged = Array.from(new Set([...existing, ...candidateUrls]));

  const { error: updateError } = await supabase.from("artist_profiles").update({ video_urls: merged }).eq("entity_id", entityId);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ ok: true, videoUrls: merged, added: merged.length - existing.length });
}
