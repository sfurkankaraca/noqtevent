import Link from "next/link";
import { createServiceClient } from "@/lib/supabase";
import { EVENT_TYPE_LABELS } from "@/lib/eventTypeLabels";
import { LEAD_SOURCES } from "@/lib/leads";

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

// Talebin GERÇEKTE ne zaman geldiğini yansıtır — backfill/manuel giriş sırasında
// leads.created_at yalnızca "bize ne zaman düştüğü"nü gösterir (ör. bir yıllık
// geçmiş Armut postası tek haftada içeri alınırsa hepsi aynı haftaya yığılır,
// yanıltıcı olur). Armut için ham e-postanın internal_date'i (Gmail'in kendi
// zaman damgası) gerçek talep anıdır; yoksa created_at'e düşer.
function demandDate(r: Row): Date {
  const internal = r.raw_source_payload?.internal_date;
  if (typeof internal === "number" && internal > 0) return new Date(internal);
  return new Date(r.created_at);
}

function monthlyTrend(rows: Row[]): { label: string; count: number }[] {
  const now = new Date();
  const buckets: { key: string; label: string }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("tr-TR", { month: "short", year: "2-digit" }),
    });
  }
  const counts = new Map<string, number>();
  for (const r of rows) {
    const d = demandDate(r);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return buckets.map((b) => ({ label: b.label, count: counts.get(b.key) ?? 0 }));
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
  const { data: leads } = await supabase
    .from("leads")
    .select("id, source, status, event_type, location, created_at, raw_source_payload")
    .neq("status", "archived")
    .order("created_at", { ascending: false })
    .limit(5000);

  const rows = (leads ?? []) as Row[];

  // ── Aylık trend (tüm kaynaklar) ──
  const trend = monthlyTrend(rows);
  const trendMax = Math.max(1, ...trend.map((t) => t.count));

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
      <div className="bg-white rounded-2xl border border-border p-5">
        <p className="text-xs text-muted-foreground tracking-[0.15em] uppercase font-medium mb-5">
          Aylık Talep Trendi — Son 12 Ay
        </p>
        <div className="flex items-end gap-2 h-32">
          {trend.map((t) => (
            <div key={t.label} className="flex-1 flex flex-col items-center justify-end gap-1.5">
              <span className="text-[10px] text-muted-foreground tabular-nums">{t.count || ""}</span>
              <div
                className="w-full bg-foreground rounded-t-md min-h-[2px]"
                style={{ height: `${Math.max(2, (t.count / trendMax) * 100)}px` }}
              />
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">{t.label}</span>
            </div>
          ))}
        </div>
      </div>

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
