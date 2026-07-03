import Link from "next/link";
import { createServiceClient } from "@/lib/supabase";
import { calcCashPrice, calcPrepayPrice } from "@/lib/bookingTerms";

export const dynamic = "force-dynamic";

const fmt = (n: number) => Math.round(n).toLocaleString("tr-TR") + " ₺";

const TYPE_LABEL: Record<string, string> = {
  deposit: "Kapora",
  full: "Ödeme",
  advance: "Avans",
  artist_payment: "Sanatçı Ödemesi",
  refund: "İade",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

function planTotal(b: Row): number {
  return b.payment_plan === "prepay" ? calcPrepayPrice(b.fee ?? 0) : calcCashPrice(b.fee ?? 0);
}

function artistNet(b: Row): number {
  return (b.fee ?? 0) * (1 - (b.commission_rate ?? 15) / 100);
}

export default async function FinansPage() {
  const supabase = createServiceClient();

  const [{ data: bookings }, { data: payments }] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, client_name, event_date, fee, commission_rate, payment_plan, status, advance_amount, dj_profiles(name)")
      .not("status", "in", "(draft,offer_sent,cancelled)")
      .order("event_date", { ascending: true }),
    supabase
      .from("booking_payments")
      .select("*, bookings(client_name, dj_profiles(name))")
      .order("created_at", { ascending: false }),
  ]);

  const allBookings: Row[] = bookings ?? [];
  const allPayments: Row[] = payments ?? [];
  const completed = allPayments.filter((p) => p.status === "completed");

  // Booking bazında tahsilat / sanatçı ödemesi toplamları
  const inByBooking = new Map<string, number>();
  const artistPaidByBooking = new Map<string, number>();
  const advancePaidByBooking = new Map<string, number>();
  for (const p of completed) {
    const amt = Number(p.amount);
    if (p.direction === "inbound" && ["deposit", "full"].includes(p.type)) {
      inByBooking.set(p.booking_id, (inByBooking.get(p.booking_id) ?? 0) + amt);
    }
    if (p.direction === "outbound" && p.type === "artist_payment") {
      artistPaidByBooking.set(p.booking_id, (artistPaidByBooking.get(p.booking_id) ?? 0) + amt);
    }
    if (p.direction === "outbound" && p.type === "advance") {
      advancePaidByBooking.set(p.booking_id, (advancePaidByBooking.get(p.booking_id) ?? 0) + amt);
    }
  }

  // Özet kartlar
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const totalCollected = completed
    .filter((p) => p.direction === "inbound" && ["deposit", "full"].includes(p.type))
    .reduce((s, p) => s + Number(p.amount), 0);
  const monthCollected = completed
    .filter((p) => p.direction === "inbound" && ["deposit", "full"].includes(p.type) && (p.paid_at ?? p.created_at) >= monthStart)
    .reduce((s, p) => s + Number(p.amount), 0);

  // Alacaklar: aktif booking'lerde kalan bakiye
  const receivables = allBookings
    .map((b): Row => {
      const total = planTotal(b);
      const paid = inByBooking.get(b.id) ?? 0;
      return { ...b, total, paid, due: Math.max(0, total - paid) };
    })
    .filter((b) => b.due > 0 && !["completed"].includes(b.status));
  const totalReceivable = receivables.reduce((s, b) => s + b.due, 0);

  // Sanatçıya ödenecekler: ödemesi alınmış/tamamlanmış işlerde sanatçı payı
  const artistPayables = allBookings
    .filter((b) => ["deposit_paid", "full_paid", "completed"].includes(b.status))
    .map((b): Row => {
      const net = artistNet(b);
      const paid = artistPaidByBooking.get(b.id) ?? 0;
      return { ...b, net, artistPaid: paid, artistDue: Math.max(0, net - paid) };
    })
    .filter((b) => b.artistDue > 0);
  const totalArtistPayable = artistPayables.reduce((s, b) => s + b.artistDue, 0);

  // NOQT geliri (tahakkuk): ödemesi başlamış işlerde plan toplamı − sanatçı payı
  const noqtRevenue = allBookings
    .filter((b) => ["deposit_paid", "full_paid", "completed"].includes(b.status))
    .reduce((s, b) => s + (planTotal(b) - artistNet(b)), 0);

  // Aylık nakit akışı (son 12 ay)
  const months: { key: string; label: string; inflow: number; outflow: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("tr-TR", { month: "short", year: "2-digit" }),
      inflow: 0,
      outflow: 0,
    });
  }
  const monthMap = new Map(months.map((m) => [m.key, m]));
  for (const p of completed) {
    const dt = new Date(p.paid_at ?? p.created_at);
    const m = monthMap.get(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`);
    if (!m) continue;
    if (p.direction === "inbound") m.inflow += Number(p.amount);
    else m.outflow += Number(p.amount);
  }
  const maxFlow = Math.max(1, ...months.map((m) => Math.max(m.inflow, m.outflow)));

  const today = new Date().toISOString().slice(0, 10);
  const artistName = (b: Row) => (b.dj_profiles as { name?: string } | null)?.name ?? "—";

  const cards = [
    { label: "Bu Ay Tahsilat", value: fmt(monthCollected), sub: `Toplam: ${fmt(totalCollected)}`, cls: "text-green-700" },
    { label: "Bekleyen Tahsilat", value: fmt(totalReceivable), sub: `${receivables.length} booking`, cls: "text-amber-700" },
    { label: "Sanatçılara Ödenecek", value: fmt(totalArtistPayable), sub: `${artistPayables.length} sanatçı ödemesi`, cls: "text-red-700" },
    { label: "NOQT Geliri (tahakkuk)", value: fmt(noqtRevenue), sub: "Komisyon + vade farkı", cls: "text-foreground" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Finans</h1>
          <p className="text-sm text-muted-foreground mt-1">Tahsilat, alacak ve sanatçı ödemeleri</p>
        </div>
        <a
          href="/api/admin/finans/export"
          className="inline-flex items-center gap-2 border border-border bg-white px-5 py-2.5 rounded-full text-sm font-medium text-foreground hover:border-foreground/40 transition-colors"
        >
          ⬇ Muhasebe CSV
        </a>
      </div>

      {/* Özet kartlar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-2xl border border-border p-5">
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className={`text-xl font-semibold mt-1 tabular-nums ${c.cls}`}>{c.value}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Aylık nakit akışı */}
      <div className="bg-white rounded-2xl border border-border p-5">
        <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase mb-4">Aylık Nakit Akışı (12 ay)</p>
        <div className="flex items-end gap-2 h-36">
          {months.map((m) => (
            <div key={m.key} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex items-end justify-center gap-0.5 flex-1">
                <div
                  className="w-1/2 bg-green-500/80 rounded-t"
                  style={{ height: `${(m.inflow / maxFlow) * 100}%` }}
                  title={`Giren: ${fmt(m.inflow)}`}
                />
                <div
                  className="w-1/2 bg-red-400/70 rounded-t"
                  style={{ height: `${(m.outflow / maxFlow) * 100}%` }}
                  title={`Çıkan: ${fmt(m.outflow)}`}
                />
              </div>
              <span className="text-[9px] text-muted-foreground whitespace-nowrap">{m.label}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-3 text-[11px] text-muted-foreground">
          <span><span className="inline-block w-2 h-2 bg-green-500/80 rounded-sm mr-1" />Tahsilat</span>
          <span><span className="inline-block w-2 h-2 bg-red-400/70 rounded-sm mr-1" />Ödeme (sanatçı/avans/iade)</span>
        </div>
      </div>

      {/* Alacaklar */}
      <div>
        <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase mb-3">
          Bekleyen Tahsilatlar {receivables.length > 0 && `(${receivables.length})`}
        </p>
        <div className="bg-white rounded-2xl border border-border overflow-x-auto">
          {receivables.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">Bekleyen tahsilat yok 🎉</p>
          ) : (
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-border bg-secondary/40">
                  {["Müşteri", "Sanatçı", "Etkinlik", "Plan Toplamı", "Ödenen", "Kalan", ""].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-medium text-muted-foreground tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {receivables.map((b) => {
                  const overdue = b.event_date && b.event_date < today;
                  return (
                    <tr key={b.id} className={overdue ? "bg-red-50/50" : ""}>
                      <td className="px-5 py-3 font-medium text-foreground">{b.client_name}</td>
                      <td className="px-5 py-3 text-muted-foreground">{artistName(b)}</td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {b.event_date ? new Date(b.event_date).toLocaleDateString("tr-TR") : "—"}
                        {overdue && <span className="ml-2 text-[10px] text-red-600 font-medium">GECİKMİŞ</span>}
                      </td>
                      <td className="px-5 py-3 tabular-nums">{fmt(b.total)}</td>
                      <td className="px-5 py-3 tabular-nums text-green-700">{fmt(b.paid)}</td>
                      <td className="px-5 py-3 tabular-nums font-semibold text-amber-700">{fmt(b.due)}</td>
                      <td className="px-5 py-3 text-right">
                        <Link href={`/admin/bookings/${b.id}`} className="text-xs text-muted-foreground hover:text-foreground">Aç →</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Sanatçıya ödenecekler */}
      <div>
        <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase mb-3">
          Sanatçı Ödemeleri {artistPayables.length > 0 && `(${artistPayables.length})`}
        </p>
        <div className="bg-white rounded-2xl border border-border overflow-x-auto">
          {artistPayables.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">Bekleyen sanatçı ödemesi yok 🎉</p>
          ) : (
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-border bg-secondary/40">
                  {["Sanatçı", "Müşteri", "Etkinlik", "Sanatçı Payı", "Ödenen", "Kalan", ""].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-medium text-muted-foreground tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {artistPayables.map((b) => (
                  <tr key={b.id}>
                    <td className="px-5 py-3 font-medium text-foreground">{artistName(b)}</td>
                    <td className="px-5 py-3 text-muted-foreground">{b.client_name}</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {b.event_date ? new Date(b.event_date).toLocaleDateString("tr-TR") : "—"}
                    </td>
                    <td className="px-5 py-3 tabular-nums">{fmt(b.net)}</td>
                    <td className="px-5 py-3 tabular-nums text-green-700">{fmt(b.artistPaid)}</td>
                    <td className="px-5 py-3 tabular-nums font-semibold text-red-700">{fmt(b.artistDue)}</td>
                    <td className="px-5 py-3 text-right">
                      <Link href={`/admin/bookings/${b.id}`} className="text-xs text-muted-foreground hover:text-foreground">Aç →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">
          Ödeme yaptığınızda ilgili booking sayfasından &quot;Sanatçı Ödemesi&quot; hareketi ekleyin — buradaki bakiye otomatik güncellenir.
        </p>
      </div>

      {/* Son hareketler */}
      <div>
        <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase mb-3">Son Hareketler</p>
        <div className="bg-white rounded-2xl border border-border overflow-x-auto">
          {allPayments.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">Henüz ödeme hareketi yok</p>
          ) : (
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-border bg-secondary/40">
                  {["Tarih", "Müşteri", "Tür", "Tutar", "Durum", "Açıklama"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-medium text-muted-foreground tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {allPayments.slice(0, 20).map((p) => (
                  <tr key={p.id}>
                    <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(p.paid_at ?? p.created_at).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="px-5 py-3 font-medium text-foreground">{p.bookings?.client_name ?? "—"}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${p.direction === "inbound" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                        {p.direction === "inbound" ? "↓" : "↑"} {TYPE_LABEL[p.type] ?? p.type}
                      </span>
                    </td>
                    <td className={`px-5 py-3 tabular-nums font-medium ${p.direction === "inbound" ? "text-green-700" : "text-red-700"}`}>
                      {p.direction === "inbound" ? "+" : "−"}{fmt(Number(p.amount))}
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{p.status}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground max-w-[220px] truncate">{p.description ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
