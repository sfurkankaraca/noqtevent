import { NextRequest, NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/cronAuth";
import { createServiceClient } from "@/lib/supabase";
import { sendReviewRequestEmail } from "@/lib/email";

export const maxDuration = 60;

// Teslimat raporu gönderildikten 2+ gün sonra, tek seferlik değerlendirme isteği e-postası.

const TWO_DAYS_MS = 2 * 24 * 60 * 60_000;

export async function GET(req: NextRequest) {
  // Bulgu 3: secret yoksa fail-closed (401)
  if (!isCronAuthorized(req, "review-requests")) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const supabase = createServiceClient();
  const BASE = process.env.NEXT_PUBLIC_URL || "https://www.noqt.events";
  const cutoff = new Date(Date.now() - TWO_DAYS_MS).toISOString();

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("id, delivery_slug, client_name, client_email, delivery_sent_at, review_requested_at, dj_profiles(name)")
    .not("delivery_sent_at", "is", null)
    .not("delivery_slug", "is", null)
    .not("client_email", "is", null)
    .is("review_requested_at", null)
    .lte("delivery_sent_at", cutoff);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let sent = 0;
  const results: string[] = [];

  for (const b of bookings ?? []) {
    if (!b.delivery_slug || !b.client_email) continue;
    try {
      await sendReviewRequestEmail({
        clientName: b.client_name,
        clientEmail: b.client_email,
        artistName: (b.dj_profiles as { name?: string } | null)?.name ?? "—",
        reviewUrl: `${BASE}/degerlendirme/${b.delivery_slug}`,
      });
      await supabase.from("bookings").update({ review_requested_at: new Date().toISOString() }).eq("id", b.id);
      sent++;
      results.push(b.client_name);
    } catch (err) {
      console.error(`[review-requests] ${b.id}:`, err);
    }
  }

  return NextResponse.json({ ok: true, sent, results });
}
