import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { sendRsvpConfirmation } from "@/lib/email";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { invitation_id, guest_name, guest_email, guest_count, attending, message } = body;

  if (!invitation_id || !guest_name || attending === undefined) {
    return NextResponse.json({ error: "Eksik alan" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Davetiye bilgilerini al (email göndermek için)
  const { data: inv } = await supabase
    .from("invitations")
    .select("bride_name, groom_name, wedding_date, venue_name, slug, memory_drive_url")
    .eq("id", invitation_id)
    .single();

  const { error } = await supabase.from("rsvp_responses").insert({
    invitation_id,
    guest_name: String(guest_name).trim(),
    guest_email: guest_email ? String(guest_email).trim() : null,
    guest_count: Number(guest_count) || 1,
    attending: Boolean(attending),
    message: message ? String(message).trim() : null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Email gönder (email varsa ve davetiye bulunduysa)
  if (guest_email && inv) {
    const baseUrl = process.env.NEXT_PUBLIC_URL ?? "https://www.noqt.events";
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
