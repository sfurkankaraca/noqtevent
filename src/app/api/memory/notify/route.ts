import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { sendMemoryUploadNotification } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

// Bir yükleme batch'i tamamlandığında çağrılır; gelin & damata galeri linkiyle
// bildirim gönderir. 15 dk throttle ile aynı etkinlikten spam bildirim önlenir.

const THROTTLE_MS = 15 * 60_000;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { ok } = rateLimit(ip, "memory-notify", { max: 30, windowMs: 60_000 });
  if (!ok) return NextResponse.json({ ok: true, throttled: true });

  const { event_slug, uploader_name } = await req.json().catch(() => ({}));
  if (!event_slug) return NextResponse.json({ error: "event_slug gerekli" }, { status: 400 });

  const supabase = createServiceClient();
  // select("*") — couple_email/gallery_* migration'ı çalışmamış olabilir
  const { data: event } = await supabase
    .from("memory_events")
    .select("*")
    .eq("slug", event_slug)
    .eq("is_active", true)
    .single();

  if (!event || !event.couple_email) {
    return NextResponse.json({ ok: true, notified: false });
  }

  // Throttle: son 15 dk içinde bildirim gittiyse tekrar gönderme
  if (event.last_notified_at && Date.now() - new Date(event.last_notified_at).getTime() < THROTTLE_MS) {
    return NextResponse.json({ ok: true, throttled: true });
  }

  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://www.noqt.events";
  const galleryUrl =
    event.gallery_visibility === "couple" && event.gallery_token
      ? `${baseUrl}/memory/${event.slug}/galeri?k=${event.gallery_token}`
      : `${baseUrl}/memory/${event.slug}/galeri`;

  await sendMemoryUploadNotification({
    coupleEmail: event.couple_email,
    eventTitle: event.title,
    galleryUrl,
    uploaderName: uploader_name || null,
  }).catch((e) => console.error("[memory notify]", e));

  // last_notified_at güncelle (sütun yoksa sessizce atla)
  await supabase
    .from("memory_events")
    .update({ last_notified_at: new Date().toISOString() })
    .eq("id", event.id)
    .then(({ error }) => { if (error && !error.message.includes("last_notified_at")) console.error("[memory notify update]", error); });

  return NextResponse.json({ ok: true, notified: true });
}
