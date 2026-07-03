import Link from "next/link";
import { createServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const STATUS_DOT: Record<string, string> = {
  draft: "bg-gray-400",
  offer_sent: "bg-blue-500",
  confirmed: "bg-cyan-500",
  contracted: "bg-violet-500",
  deposit_paid: "bg-amber-500",
  full_paid: "bg-orange-500",
  completed: "bg-green-500",
  cancelled: "bg-red-400",
};

type Props = { searchParams?: Promise<{ y?: string; m?: string }> };

export default async function TakvimPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const now = new Date();
  const year = Number(sp.y) || now.getFullYear();
  const month = sp.m !== undefined ? Number(sp.m) : now.getMonth(); // 0-indexed

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  const monthStartStr = monthStart.toISOString().slice(0, 10);
  const monthEndStr = monthEnd.toISOString().slice(0, 10);

  const supabase = createServiceClient();
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, client_name, event_date, event_type, status, artist_id, dj_profiles(name)")
    .not("event_date", "is", null)
    .not("status", "eq", "cancelled")
    .gte("event_date", monthStartStr)
    .lte("event_date", monthEndStr)
    .order("event_date", { ascending: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const byDay = new Map<string, any[]>();
  for (const b of bookings ?? []) {
    const key = String(b.event_date);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(b);
  }

  // Çifte rezervasyon: aynı sanatçı, aynı gün, birden fazla iptal-olmayan booking
  const doubleBookedDays = new Set<string>();
  for (const [day, items] of byDay) {
    const artistIds = items.map((b) => b.artist_id).filter(Boolean);
    if (new Set(artistIds).size < artistIds.length) doubleBookedDays.add(day);
  }

  // Takvim ızgarası — Pazartesi başlangıçlı
  const firstWeekday = (monthStart.getDay() + 6) % 7; // 0=Pzt
  const daysInMonth = monthEnd.getDate();
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const prevParams = new URLSearchParams({ y: String(month === 0 ? year - 1 : year), m: String(month === 0 ? 11 : month - 1) });
  const nextParams = new URLSearchParams({ y: String(month === 11 ? year + 1 : year), m: String(month === 11 ? 0 : month + 1) });
  const monthLabel = monthStart.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground capitalize">{monthLabel}</h1>
          <p className="text-sm text-muted-foreground mt-1">{bookings?.length ?? 0} etkinlik</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/takvim?${prevParams}`} className="px-4 py-2 rounded-full border border-border text-sm hover:border-foreground/40 transition-colors">← Önceki</Link>
          <Link href="/admin/takvim" className="px-4 py-2 rounded-full border border-border text-sm hover:border-foreground/40 transition-colors">Bugün</Link>
          <Link href={`/admin/takvim?${nextParams}`} className="px-4 py-2 rounded-full border border-border text-sm hover:border-foreground/40 transition-colors">Sonraki →</Link>
        </div>
      </div>

      {doubleBookedDays.size > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          ⚠ Çifte rezervasyon tespit edildi: {[...doubleBookedDays].map((d) => new Date(d).toLocaleDateString("tr-TR")).join(", ")}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-border p-4 overflow-x-auto">
        <div className="grid grid-cols-7 gap-2 min-w-[700px]">
          {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((d) => (
            <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
          ))}
          {cells.map((day, i) => {
            if (day === null) return <div key={i} />;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const items = byDay.get(dateStr) ?? [];
            const isToday = dateStr === todayStr;
            const isDoubleBooked = doubleBookedDays.has(dateStr);
            return (
              <div
                key={i}
                className={`min-h-[92px] rounded-xl border p-2 space-y-1 ${
                  isDoubleBooked ? "border-red-300 bg-red-50/40" : isToday ? "border-foreground/40 bg-secondary/40" : "border-border"
                }`}
              >
                <p className={`text-xs ${isToday ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{day}</p>
                {items.map((b) => (
                  <Link
                    key={b.id}
                    href={`/admin/bookings/${b.id}`}
                    className="flex items-center gap-1 text-[10px] leading-tight px-1.5 py-1 rounded-md bg-secondary/60 hover:bg-secondary transition-colors truncate"
                    title={`${b.client_name} — ${b.dj_profiles?.name ?? "sanatçı atanmadı"}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[b.status] ?? "bg-gray-400"}`} />
                    <span className="truncate">{b.dj_profiles?.name ?? b.client_name}</span>
                  </Link>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
        {Object.entries(STATUS_DOT).filter(([s]) => s !== "cancelled").map(([status, cls]) => (
          <span key={status} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${cls}`} /> {status}
          </span>
        ))}
      </div>
    </div>
  );
}
