import { createServiceClient } from "@/lib/supabase";

export type YearMetrics = {
  revenueByMonth: number[];   // 12 eleman, 0=Ocak
  revenueTotal: number;
  bookingsByMonth: number[];
  bookingsTotal: number;
};

// Ciro = gerçekleşen tahsilat (finans sayfasıyla aynı mantık: inbound deposit/full, completed).
// Booking sayısı = iptal/taslak olmayan, etkinlik tarihi yıl içindeki kayıtlar.
export async function getYearMetrics(year: number): Promise<YearMetrics> {
  const supabase = createServiceClient();
  const from = `${year}-01-01`;
  const to = `${year + 1}-01-01`;

  const [{ data: payments }, { data: bookings }] = await Promise.all([
    supabase
      .from("booking_payments")
      .select("amount, paid_at")
      .eq("direction", "inbound")
      .in("type", ["deposit", "full"])
      .eq("status", "completed")
      .gte("paid_at", from)
      .lt("paid_at", to),
    supabase
      .from("bookings")
      .select("event_date, status")
      .not("status", "in", '("draft","offer_sent","cancelled")')
      .gte("event_date", from)
      .lt("event_date", to),
  ]);

  const revenueByMonth = Array(12).fill(0);
  for (const p of payments ?? []) {
    if (!p.paid_at) continue;
    const m = new Date(p.paid_at).getMonth();
    revenueByMonth[m] += Number(p.amount) || 0;
  }

  const bookingsByMonth = Array(12).fill(0);
  for (const b of bookings ?? []) {
    if (!b.event_date) continue;
    const m = new Date(b.event_date).getMonth();
    bookingsByMonth[m] += 1;
  }

  return {
    revenueByMonth,
    revenueTotal: revenueByMonth.reduce((s, n) => s + n, 0),
    bookingsByMonth,
    bookingsTotal: bookingsByMonth.reduce((s, n) => s + n, 0),
  };
}
