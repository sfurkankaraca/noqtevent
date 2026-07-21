import Link from "next/link";
import { createServiceClient, fetchAllRows } from "@/lib/supabase";
import { EVENT_TYPE_LABELS } from "@/lib/eventTypeLabels";
import { LEAD_SOURCES } from "@/lib/leads";
import { getMonthlyTrend, monthKeyOf, monthLabelOf } from "@/lib/monthlyStats";
import MonthlyTrendChart from "./MonthlyTrendChart";

// Sales OS Phase 2 — kaynak-bağımsız analitik. /rapor Armut'a özel derin
// analiz + AI yorumu içindir; bu sayfa TÜM kaynakları kapsayan aylık trend,
// kaynak bazlı dönüşüm ve kategori/şehir kırılımıdır. Tamamı leads +
// lead_events'ten türetilir — yeni tablo yok.

export const dynamic = "force-dynamic";

const SOURCE_LABELS = Object.fromEntries(LEAD_SOURCES.map((s) => [s.id, s.label]));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

function Bar({ value, max, className = "bg-foreground" }: { value: number; max: number; className?: string }) {
  return (
    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${className}`} style={{ width: `${Math.max(3, (value / Math.max(1, max)) * 100)}%` }} />
    </div>
  );
}

function last12MonthKeys(): string[] {
  const now = new Date();
  const keys: string[] = [];
  for (let i = 11; i >= 0; i--) {
    keys.push(monthKeyOf(new Date(now.getFullYear(), now.getMonth() - i, 1)));
  }
  return keys;
}

function conversionRow(rows: Row[]) {
  const won = rows.filter((r) => r.status === "won").length;
  const lost = rows.filter((r) => r.status === "lost").length;
  const resolved = won + lost;
  return {
    total: rows.length,
    won,
    lost,
    conversionPct: resolved > 0 ? Math.round((won / resolved) * 100) : null,
  };
}

export default async function LeadAnalyticsPage() {
  const supabase = createServiceClient();
  // raw_source_payload'ın TAMAMINI çekme (satır başına ~8000 karakter ham
  // e-posta) — binlerce satırda RSC render'ını kaynak limitine çarptırıp
  // çökertiyor (canlıda yaşandı). Sadece internal_date'i JSON path ile al.
  const leads = await fetchAllRows<Row>((from, to) =>
    supabase
      .from("leads")
      .select("id, source, status, event_type, location, created_at, internal_date:raw_source_payload->internal_date")
      .neq("status", "archived")
      .order("created_at", { ascending: false })
      .range(from, to)
  );

  const rows = leads;

  // ── Aylık trend (tüm kaynaklar) — biten aylar monthly_lead_stats'tan
  // önbellekli okunur, sadece içinde bulunulan ay canlı hesaplanır ──
  const monthKeys = last12MonthKeys();
  const trendMap = await getMonthlyTrend(monthKeys);
  const trendBars = monthKeys.map((key) => ({
    key,
    label: monthLabelOf(key),
    count: trendMap.get(key)?.total ?? 0,
  }));

  // ── Kaynak bazlı dönüşüm ──
  const sourceIds = [...new Set(rows.map((r) => r.source))];
  const bySource = sourceIds
    .map((s) => ({ source: s, ...conversionRow(rows.filter((r) => r.source === s)) }))
    .sort((a, b) => b.total - a.total);

  // ── Kategori (etkinlik türü) bazlı dönüşüm ──
  const typeIds = [...new Set(rows.map((r) => r.event_type).filter(Boolean))] as string[];
  const byType = typeIds
    .map((t) => ({ type: t, ...conversionRow(rows.filter((r) => r.event_type === t)) }))
    .sort((a, b) => b.total - a.total);

  // ── Şehir bazlı dönüşüm ──
  const cityOf = (loc: string | null) => (loc ? loc.split(",")[0]?.trim() : null);
  const cityIds = [...new Set(rows.map((r) => cityOf(r.location)).filter(Boolean))] as string[];
  const byCity = cityIds
    .map((c) => ({ city: c, ...conversionRow(rows.filter((r) => cityOf(r.location) === c)) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 12);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Lead Analitiği</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tüm kaynaklar — aylık trend, kaynak/kategori/şehir bazlı dönüşüm (Phase 2)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/leads/rapor" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            📊 Armut Raporu
          </Link>
          <Link href="/admin/leads" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Inbox
          </Link>
        </div>
      </div>

      {/* Aylık trend */}
      <MonthlyTrendChart bars={trendBars} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Kaynak bazlı dönüşüm */}
        <div className="bg-white rounded-2xl border border-border p-5">
          <p className="text-xs text-muted-foreground tracking-[0.15em] uppercase font-medium mb-4">
            Kaynak Bazlı Dönüşüm
          </p>
          <div className="space-y-3">
            {bySource.length === 0 && <p className="text-xs text-muted-foreground">Veri yok</p>}
            {bySource.map((s) => (
              <div key={s.source} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">{SOURCE_LABELS[s.source] ?? s.source}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {s.total} talep{s.conversionPct != null ? ` · %${s.conversionPct} kazanma (${s.won}/${s.won + s.lost})` : ""}
                  </span>
                </div>
                <Bar value={s.total} max={bySource[0]?.total ?? 1} />
              </div>
            ))}
          </div>
        </div>

        {/* Kategori bazlı dönüşüm */}
        <div className="bg-white rounded-2xl border border-border p-5">
          <p className="text-xs text-muted-foreground tracking-[0.15em] uppercase font-medium mb-4">
            Etkinlik Türü Bazlı Dönüşüm
          </p>
          <div className="space-y-3">
            {byType.length === 0 && <p className="text-xs text-muted-foreground">Veri yok</p>}
            {byType.map((t) => (
              <div key={t.type} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">{EVENT_TYPE_LABELS[t.type] ?? t.type}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {t.total} talep{t.conversionPct != null ? ` · %${t.conversionPct} kazanma (${t.won}/${t.won + t.lost})` : ""}
                  </span>
                </div>
                <Bar value={t.total} max={byType[0]?.total ?? 1} className="bg-violet-500" />
              </div>
            ))}
          </div>
        </div>

        {/* Şehir bazlı dönüşüm */}
        <div className="bg-white rounded-2xl border border-border p-5 lg:col-span-2">
          <p className="text-xs text-muted-foreground tracking-[0.15em] uppercase font-medium mb-4">
            Şehir Bazlı Dönüşüm — İlk 12
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
            {byCity.length === 0 && <p className="text-xs text-muted-foreground">Veri yok</p>}
            {byCity.map((c) => (
              <div key={c.city} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">{c.city}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {c.total} talep{c.conversionPct != null ? ` · %${c.conversionPct} kazanma` : ""}
                  </span>
                </div>
                <Bar value={c.total} max={byCity[0]?.total ?? 1} className="bg-emerald-500" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Not: dönüşüm oranı yalnızca sonuçlanmış (kazanılan+kaybedilen) talepler üzerinden hesaplanır —
        &ldquo;incelenecek/bekliyor&rdquo; durumundaki talepler henüz sonuçlanmadığı için oranı etkilemez.
      </p>
    </div>
  );
}
