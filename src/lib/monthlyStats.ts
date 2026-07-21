import { createServiceClient, fetchAllRows } from "@/lib/supabase";
import { demandDate } from "@/lib/leads";

export type MonthlyStat = { monthKey: string; total: number; won: number; lost: number };

export function monthKeyOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabelOf(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("tr-TR", { month: "short", year: "2-digit" });
}

function monthStartMs(monthKey: string): number {
  const [y, m] = monthKey.split("-").map(Number);
  return new Date(y, m - 1, 1).getTime();
}

function monthEndMs(monthKey: string): number {
  const [y, m] = monthKey.split("-").map(Number);
  return new Date(y, m, 1).getTime();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

function toStat(rows: { status: string }[]): { total: number; won: number; lost: number } {
  let won = 0;
  let lost = 0;
  for (const r of rows) {
    if (r.status === "won") won++;
    if (r.status === "lost") lost++;
  }
  return { total: rows.length, won, lost };
}

// Biten aylar demand_date'e göre değişmez (yeni lead o aya eklenmez) — bu
// yüzden monthly_lead_stats'ta önbelleğe alınır. Sadece içinde bulunulan ay
// canlı hesaplanır; created_at ile dar bir aralık taranır (backfill bitti,
// yeni lead'lerde created_at ~ internal_date, tam ay taraması gerekmez).
export async function getMonthlyTrend(monthKeys: string[]): Promise<Map<string, MonthlyStat>> {
  const supabase = createServiceClient();
  const nowKey = monthKeyOf(new Date());
  const pastKeys = monthKeys.filter((k) => k !== nowKey);

  const result = new Map<string, MonthlyStat>();

  if (pastKeys.length > 0) {
    const { data: cached } = await supabase
      .from("monthly_lead_stats")
      .select("month_key, total_count, won_count, lost_count")
      .in("month_key", pastKeys);
    for (const row of cached ?? []) {
      result.set(row.month_key, { monthKey: row.month_key, total: row.total_count, won: row.won_count, lost: row.lost_count });
    }
  }

  const missingPast = pastKeys.filter((k) => !result.has(k));
  if (missingPast.length > 0) {
    // İlk çalıştırma ya da boşluk var — o ayları tek seferlik tam taramayla
    // hesapla ve önbelleğe yaz, sonraki yüklemeler bu taramayı atlasın.
    await refreshMonthlyStatsCache();
    const { data: cached2 } = await supabase
      .from("monthly_lead_stats")
      .select("month_key, total_count, won_count, lost_count")
      .in("month_key", missingPast);
    for (const row of cached2 ?? []) {
      result.set(row.month_key, { monthKey: row.month_key, total: row.total_count, won: row.won_count, lost: row.lost_count });
    }
  }

  if (monthKeys.includes(nowKey)) {
    result.set(nowKey, { monthKey: nowKey, ...(await getCurrentMonthStat(nowKey)) });
  }

  return result;
}

// İçinde bulunulan ay için ucuz sayım: backfill bittiği için yeni gelen
// lead'lerde created_at ~ gerçek geliş tarihi — bu yüzden (biten aylardan
// farklı olarak) created_at ile dar bir aralık taranabilir, tüm tabloyu
// taramaya gerek yok.
async function getCurrentMonthStat(monthKey: string): Promise<{ total: number; won: number; lost: number }> {
  const supabase = createServiceClient();
  const bufferMs = 3 * 86_400_000;
  const fromIso = new Date(monthStartMs(monthKey) - bufferMs).toISOString();
  const toIso = new Date(monthEndMs(monthKey) + bufferMs).toISOString();
  const start = monthStartMs(monthKey);
  const end = monthEndMs(monthKey);

  const rows = await fetchAllRows<Row>((from, to) =>
    supabase
      .from("leads")
      .select("id, status, created_at, internal_date:raw_source_payload->internal_date")
      .neq("status", "archived")
      .gte("created_at", fromIso)
      .lte("created_at", toIso)
      .range(from, to)
  );

  const inMonth = rows
    .filter((r) => {
      const t = demandDate(r as { created_at: string; internal_date?: number | null }).getTime();
      return t >= start && t < end;
    })
    .map((r) => ({ status: r.status as string }));
  return toStat(inMonth);
}

// Tüm leads tablosunu tek seferde tarayıp biten ayları monthly_lead_stats'a
// upsert eder (içinde bulunulan ay hariç — o hep canlı hesaplanır).
export async function refreshMonthlyStatsCache(): Promise<number> {
  const supabase = createServiceClient();
  const nowKey = monthKeyOf(new Date());

  const rows = await fetchAllRows<Row>((from, to) =>
    supabase
      .from("leads")
      .select("id, status, created_at, internal_date:raw_source_payload->internal_date")
      .neq("status", "archived")
      .range(from, to)
  );

  const buckets = new Map<string, { status: string }[]>();
  for (const r of rows) {
    const d = demandDate(r as { created_at: string; internal_date?: number | null });
    const key = monthKeyOf(d);
    if (key === nowKey) continue;
    const list = buckets.get(key) ?? [];
    list.push({ status: r.status });
    buckets.set(key, list);
  }

  const upserts = [...buckets.entries()].map(([month_key, list]) => {
    const s = toStat(list);
    return { month_key, total_count: s.total, won_count: s.won, lost_count: s.lost };
  });

  if (upserts.length > 0) {
    const { error } = await supabase.from("monthly_lead_stats").upsert(upserts, { onConflict: "month_key" });
    if (error) throw new Error(error.message);
  }

  return upserts.length;
}

export type MonthLeadSummary = {
  id: string;
  source: string;
  status: string;
  event_type: string | null;
  location: string | null;
  description: string | null;
  demand_date: Date;
};

// Belirli bir ayın lead'lerini getirir (drill-down). Backfill edilen eski
// lead'lerde created_at (ingestion anı) gerçek geliş ayını yansıtmadığı için
// created_at'e göre filtrelenemez — hafif kolonlarla tüm tablo taranıp
// demand_date'e göre kesinleştirilir. Bu sadece kullanıcı bir aya tıkladığında
// çalışır (sayfa her yüklendiğinde değil), bu yüzden kabul edilebilir.
export async function getLeadsForMonth(monthKey: string): Promise<MonthLeadSummary[]> {
  const supabase = createServiceClient();
  const start = monthStartMs(monthKey);
  const end = monthEndMs(monthKey);

  const rows = await fetchAllRows<Row>((from, to) =>
    supabase
      .from("leads")
      .select(
        "id, source, status, event_type, location, description, created_at, internal_date:raw_source_payload->internal_date"
      )
      .neq("status", "archived")
      .range(from, to)
  );

  return rows
    .map((r) => ({
      id: r.id,
      source: r.source,
      status: r.status,
      event_type: r.event_type,
      location: r.location,
      description: r.description,
      demand_date: demandDate(r as { created_at: string; internal_date?: number | null }),
    }))
    .filter((r) => r.demand_date.getTime() >= start && r.demand_date.getTime() < end)
    .sort((a, b) => b.demand_date.getTime() - a.demand_date.getTime());
}
