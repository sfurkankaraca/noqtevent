import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { sendRsvpConfirmation } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { ok } = rateLimit(ip, "rsvp", { max: 10, windowMs: 60 * 60_000 });
  if (!ok) {
    return NextResponse.json({ error: "Çok fazla istek. Lütfen daha sonra tekrar deneyin." }, { status: 429 });
  }

  const body = await req.json();
  const { invitation_id, guest_name, guest_email, guest_count, companion_names, attending, message } = body;

  if (!invitation_id || !guest_name || attending === undefined) {
    return NextResponse.json({ error: "Eksik alan" }, { status: 400 });
  }
  if (guest_email && !EMAIL_RE.test(String(guest_email).trim())) {
    return NextResponse.json({ error: "Geçersiz e-posta adresi" }, { status: 400 });
  }

  const cleanCompanionNames = Array.isArray(companion_names)
    ? companion_names
        .map((n) => String(n).trim().slice(0, 120))
        .filter(Boolean)
        .slice(0, 49)
    : [];

  const supabase = createServiceClient();

  // Davetiye bilgilerini al (email göndermek için)
  const { data: inv } = await supabase
    .from("invitations")
    .select("bride_name, groom_name, wedding_date, venue_name, slug, memory_drive_url")
    .eq("id", invitation_id)
    .single();

  const baseRow = {
    invitation_id,
    guest_name: String(guest_name).trim().slice(0, 120),
    guest_email: guest_email ? String(guest_email).trim().slice(0, 200) : null,
    guest_count: Math.min(Math.max(Number(guest_count) || 1, 1), 50),
    attending: Boolean(attending),
    message: message ? String(message).trim().slice(0, 2000) : null,
  };

  // companion_names migration'ı henüz çalıştırılmadıysa o kolon olmadan dene
  let { error } = await supabase.from("rsvp_responses").insert({ ...baseRow, companion_names: cleanCompanionNames });
  if (error?.message.includes("column")) {
    ({ error } = await supabase.from("rsvp_responses").insert(baseRow));
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Email gönder (email varsa ve davetiye bulunduysa)
  if (guest_email && inv) {
    const baseUrl = process.env.NEXT_PUBLIC_URL || "https://www.noqt.events";
    await sendRsvpConfirmation({
      guestName: String(guest_name).trim(),
      guestEmail: String(guest_email).trim(),
      attending: Boolean(attending),
      brideName: inv.bride_name,
      groomName: inv.groom_name,
      weddingDate: inv.wedding_date,
      venueName: inv.venue_name,
      invitationUrl: `${baseUrl}/davetiye/${inv.slug}`,
      memoryDriveUrl: inv.memory_drive_url,
    }).catch((e) => console.error("[rsvp email]", e));
  }

  return NextResponse.json({ ok: true });
}
