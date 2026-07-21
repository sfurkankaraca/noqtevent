import Link from "next/link";
import { createServiceClient } from "@/lib/supabase";
import { EVENT_TYPE_LABELS } from "@/lib/eventTypeLabels";
import ReportAiComment from "./ReportAiComment";

// "AI Yorumu Üret" server action'ı AI çağrısı yapar
export const maxDuration = 60;
export const dynamic = "force-dynamic";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

function countBy(rows: Row[], fn: (r: Row) => string | null): [string, number][] {
  const m = new Map<string, number>();
  for (const r of rows) {
    const k = fn(r);
    if (!k) continue;
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

function firstLine(desc: string | null, label: string): string | null {
  if (!desc) return null;
  const m = desc.match(new RegExp(`^${label}:\\s*(.+)$`, "m"));
  return m ? m[1].trim() : null;
}

// Haftalık geliş trendi (son 8 hafta) — bileşen dışında (Date.now saflık kuralı)
function weeklyTrend(rows: Row[]): [string, number][] {
  const weekMs = 7 * 86_400_000;
  const now = Date.now();
  const trend: [string, number][] = [];
  for (let w = 7; w >= 0; w--) {
    const start = now - (w + 1) * weekMs;
    const end = now - w * weekMs;
    const label = w === 0 ? "Bu hafta" : `${w} hf önce`;
    trend.push([label, rows.filter((r) => {
      const t = new Date(r.created_at).getTime();
      return t >= start && t < end;
    }).length]);
  }
  return trend;
}

function Bar({ value, max }: { value: number; max: number }) {
  return (
    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
      <div className="h-full bg-foreground rounded-full" style={{ width: `${Math.max(4, (value / max) * 100)}%` }} />
    </div>
  );
}

function DistCard({ title, entries }: { title: string; entries: [string, number][] }) {
  const max = entries[0]?.[1] ?? 1;
  return (
    <div className="bg-white rounded-2xl border border-border p-5">
      <p className="text-xs text-muted-foreground tracking-[0.15em] uppercase font-medium mb-4">{title}</p>
      <div className="space-y-2.5">
        {entries.length === 0 && <p className="text-xs text-muted-foreground">Veri yok</p>}
        {entries.slice(0, 8).map(([k, v]) => (
          <div key={k} className="flex items-center gap-3 text-xs">
            <span className="w-32 truncate text-foreground" title={k}>{k}</span>
            <Bar value={v} max={max} />
            <span className="w-6 text-right tabular-nums text-muted-foreground">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function LeadReportPage() {
  const supabase = createServiceClient();
  const { data: leads } = await supabase
    .from("leads")
    .select("created_at, event_type, event_date, location, status, description, ai_analysis")
    .eq("source", "armut")
    .order("created_at", { ascending: false })
    .limit(500);

  const rows = (leads ?? []) as Row[];

  // ── Deterministik istatistikler ──
  const total = rows.length;
  const byService = countBy(rows, (r) => firstLine(r.description, "Hizmet"));
  const byCity = countBy(rows, (r) => (r.location ? String(r.location).split(",")[0].trim() : null));
  const byType = countBy(rows, (r) => (r.event_type ? (EVENT_TYPE_LABELS[r.event_type] ?? r.event_type) : null));
  const byScore = countBy(rows, (r) => {
    const p = r.ai_analysis?.probability;
    return p ? `${p}/5` : null;
  }).sort((a, b) => b[0].localeCompare(a[0]));
  const priceShoppers = rows.filter((r) => /sadece fiyat/i.test(r.description ?? "")).length;
  const withDate = rows.filter((r) => r.event_date).length;
  const byStatus = countBy(rows, (r) => r.status);

  const trend = weeklyTrend(rows);

  const stats = {
    toplam_talep: total,
    hizmet_dagilimi: Object.fromEntries(byService.slice(0, 8)),
    il_dagilimi: Object.fromEntries(byCity.slice(0, 8)),
    etkinlik_turu: Object.fromEntries(byType.slice(0, 8)),
    skor_dagilimi: Object.fromEntries(byScore),
    sadece_fiyat_bakan: priceShoppers,
    net_tarihi_olan: withDate,
    durum_dagilimi: Object.fromEntries(byStatus),
    haftalik_trend: Object.fromEntries(trend),
  };

  const samples = rows.slice(0, 12).map((r) => String(r.description ?? "").slice(0, 220));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Armut Talep Raporu</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gmail&apos;den içeri alınan tüm Armut talepleri — son 500 kayıt üzerinden
          </p>
        </div>
        <Link href="/admin/leads" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Lead Inbox
        </Link>
      </div>

      {/* Özet şerit */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ["Toplam talep", String(total)],
          ["Net tarihi olan", `${withDate}`],
          ["Sadece fiyat bakan", `${priceShoppers}`],
          ["Kazanılan", `${byStatus.find(([k]) => k === "won")?.[1] ?? 0}`],
        ].map(([label, value]) => (
          <div key={label} className="bg-white rounded-2xl border border-border p-4">
            <p className="text-2xl font-semibold text-foreground tabular-nums">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* AI yorum */}
      <ReportAiComment statsJson={JSON.stringify(stats, null, 1)} samples={samples} />

      {/* Dağılımlar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <DistCard title="Hizmet Dağılımı (Armut kategorisi)" entries={byService} />
        <DistCard title="İl Dağılımı" entries={byCity} />
        <DistCard title="Etkinlik Türü (AI tahmini)" entries={byType} />
        <DistCard title="AI Skor Dağılımı" entries={byScore} />
        <DistCard title="Haftalık Geliş Trendi" entries={trend} />
        <DistCard title="Durum Dağılımı" entries={byStatus} />
      </div>
    </div>
  );
}
