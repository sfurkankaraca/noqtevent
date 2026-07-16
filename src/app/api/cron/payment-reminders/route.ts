import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { calcDuePayment } from "@/lib/paymentPlan";
import { daysUntil } from "@/lib/bookingTerms";
import { sendPaymentReminderEmail } from "@/lib/email";

export const maxDuration = 60;

// Vercel Cron her gün tetikler (vercel.json). Kalan bakiyesi olan booking'lere
// etkinliğe 7 ve 3 gün kala tek seferlik hatırlatma e-postası gönderir.
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // secret tanımlı değilse (henüz kurulmadıysa) engelleme
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

const ACTIVE_STATUSES = ["confirmed", "contracted", "deposit_paid"];

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const supabase = createServiceClient();
  const BASE = process.env.NEXT_PUBLIC_URL || "https://www.noqt.events";

  let { data: bookings, error } = await supabase
    .from("bookings")
    .select(
      "id, offer_slug, client_name, client_email, event_date, fee, payment_plan, deposit_rate, prepay_markup_rate, status, reminder_7d_sent_at, reminder_3d_sent_at, dj_profiles(name)"
    )
    .in("status", ACTIVE_STATUSES)
    .not("event_date", "is", null)
    .not("payment_plan", "is", null)
    .not("client_email", "is", null);

  if (error?.message.includes("column")) {
    // prepay_markup_rate migration'ı henüz çalıştırılmadıysa onsuz dene
    const fallback = await supabase
      .from("bookings")
      .select(
        "id, offer_slug, client_name, client_email, event_date, fee, payment_plan, deposit_rate, status, reminder_7d_sent_at, reminder_3d_sent_at, dj_profiles(name)"
      )
      .in("status", ACTIVE_STATUSES)
      .not("event_date", "is", null)
      .not("payment_plan", "is", null)
      .not("client_email", "is", null);
    bookings = fallback.data as typeof bookings;
    error = fallback.error;
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let sent = 0;
  const results: string[] = [];

  for (const b of bookings ?? []) {
    if (!b.offer_slug || !b.client_email) continue;
    const days = daysUntil(b.event_date);
    if (days === null || days < 0) continue;

    const threshold: 7 | 3 | null = !b.reminder_7d_sent_at && days <= 7 && days > 3
      ? 7
      : !b.reminder_3d_sent_at && days <= 3
        ? 3
        : null;
    if (!threshold) continue;

    const { data: payments } = await supabase
      .from("booking_payments")
      .select("amount")
      .eq("booking_id", b.id)
      .eq("direction", "inbound")
      .eq("status", "completed")
      .in("type", ["deposit", "full"]);
    const paidTotal = (payments ?? []).reduce((s, p) => s + Number(p.amount), 0);
    const due = calcDuePayment(b, paidTotal);
    if (!due) continue;

    try {
      await sendPaymentReminderEmail({
        clientName: b.client_name,
        clientEmail: b.client_email,
        artistName: (b.dj_profiles as { name?: string } | null)?.name ?? "—",
        eventDate: b.event_date,
        daysLeft: days,
        dueAmount: due.amount,
        offerUrl: `${BASE}/teklif/${b.offer_slug}`,
      });
      const col = threshold === 7 ? "reminder_7d_sent_at" : "reminder_3d_sent_at";
      await supabase.from("bookings").update({ [col]: new Date().toISOString() }).eq("id", b.id);
      sent++;
      results.push(`${b.client_name} (${threshold}g)`);
    } catch (err) {
      console.error(`[payment-reminders] ${b.id}:`, err);
    }
  }

  return NextResponse.json({ ok: true, sent, results });
}
