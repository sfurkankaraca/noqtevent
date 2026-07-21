import { createServiceClient, fetchAllRows } from "@/lib/supabase";
import { LEAD_SOURCES, isStaleLead, demandDate } from "@/lib/leads";

// Sales OS — kaynak-bağımsız günlük operasyon şeridi (orijinal tasarımın
// "Dashboard" adımı + Phase 2 kaynak/dönüşüm analitiğinin temeli).
// Rapor sayfasındaki analitikten farkı: TÜM kaynakları kapsar, günlük
// operasyona odaklanır (tam analitik değil, "bugün ne durumdayız" özeti).

const SOURCE_LABELS = Object.fromEntries(LEAD_SOURCES.map((s) => [s.id, s.label]));
const PENDING_STATUSES = ["new", "needs_review", "proposal_ready"];

function startOfTodayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export default async function DashboardStrip() {
  const supabase = createServiceClient();

  const [rows, { data: sentEvents }] = await Promise.all([
    // raw_source_payload'ın TAMAMINI çekme (satır başına ~8000 karakter ham
    // e-posta) — binlerce satırda RSC render'ını kaynak limitine çarptırıp
    // çökertiyor (canlıda yaşandı). Sadece internal_date'i JSON path ile al.
    fetchAllRows((from, to) =>
      supabase
        .from("leads")
        .select("id, source, status, created_at, event_date, internal_date:raw_source_payload->internal_date")
        .neq("status", "archived")
        .range(from, to)
    ),
    supabase.from("lead_events").select("lead_id, created_at").eq("type", "marked_sent"),
  ]);
  // Gerçek talebin geldiği gün — sistemin ne zaman işlediği değil (backfill
  // sırasında created_at yanıltıcı olabilir, bkz. leads.ts demandDate()).
  const todayIso = startOfTodayIso();
  const todayCount = rows.filter(
    (l) => demandDate(l as { created_at: string; internal_date?: number | null }).toISOString() >= todayIso
  ).length;

  const won = rows.filter((l) => l.status === "won").length;
  const lost = rows.filter((l) => l.status === "lost").length;
  const winRate = won + lost > 0 ? Math.round((won / (won + lost)) * 100) : null;

  // Eski/pasif (14+ gün işlem görmemiş veya etkinlik tarihi geçmiş) talepler
  // "bekleyen yanıt" sayısına dahil edilmez — aksi halde yüzlerce ölü Armut
  // ilanı gerçek bekleyen iş yükünü gizler.
  const pending = rows.filter((l) => PENDING_STATUSES.includes(l.status) && !isStaleLead(l)).length;

  // Ortalama yanıt süresi: her lead'in İLK "gönderildi" olayı ile GERÇEK talep
  // (e-posta geliş) zamanı arasındaki fark (saat) — sistem işleme anı değil.
  const createdAt = new Map(
    rows.map((l) => [l.id, demandDate(l as { created_at: string; internal_date?: number | null }).toISOString()])
  );
  const firstSentAt = new Map<string, string>();
  for (const ev of sentEvents ?? []) {
    const existing = firstSentAt.get(ev.lead_id);
    if (!existing || ev.created_at < existing) firstSentAt.set(ev.lead_id, ev.created_at);
  }
  const responseHours: number[] = [];
  for (const [leadId, sentAt] of firstSentAt) {
    const created = createdAt.get(leadId);
    if (!created) continue;
    const hours = (new Date(sentAt).getTime() - new Date(created).getTime()) / 3_600_000;
    if (hours >= 0) responseHours.push(hours);
  }
  const avgResponseHours =
    responseHours.length > 0 ? responseHours.reduce((a, b) => a + b, 0) / responseHours.length : null;

  const bySource = new Map<string, number>();
  for (const l of rows) bySource.set(l.source, (bySource.get(l.source) ?? 0) + 1);
  const sourceEntries = [...bySource.entries()].sort((a, b) => b[1] - a[1]);
  const maxSource = sourceEntries[0]?.[1] ?? 1;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      <div className="bg-white rounded-2xl border border-border p-4">
        <p className="text-2xl font-semibold text-foreground tabular-nums">{todayCount}</p>
        <p className="text-xs text-muted-foreground mt-1">Bugünün Lead&apos;leri</p>
      </div>
      <div className="bg-white rounded-2xl border border-border p-4">
        <p className="text-2xl font-semibold text-foreground tabular-nums">
          {avgResponseHours != null
            ? avgResponseHours < 1
              ? `${Math.round(avgResponseHours * 60)}dk`
              : `${avgResponseHours.toFixed(1)}sa`
            : "—"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">Ort. Yanıt Süresi</p>
      </div>
      <div className="bg-white rounded-2xl border border-border p-4">
        <p className="text-2xl font-semibold text-foreground tabular-nums">
          {winRate != null ? `%${winRate}` : "—"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">Kazanma Oranı{won + lost > 0 ? ` (${won}/${won + lost})` : ""}</p>
      </div>
      <div className="bg-white rounded-2xl border border-border p-4">
        <p className="text-2xl font-semibold text-foreground tabular-nums">{pending}</p>
        <p className="text-xs text-muted-foreground mt-1">Bekleyen Yanıt</p>
      </div>
      <div className="bg-white rounded-2xl border border-border p-4 col-span-2 lg:col-span-1">
        <p className="text-xs text-muted-foreground mb-2">Kaynak Dağılımı</p>
        <div className="space-y-1.5">
          {sourceEntries.slice(0, 3).map(([source, count]) => (
            <div key={source} className="flex items-center gap-2 text-[11px]">
              <span className="w-14 truncate text-foreground">{SOURCE_LABELS[source] ?? source}</span>
              <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-foreground rounded-full" style={{ width: `${Math.max(8, (count / maxSource) * 100)}%` }} />
              </div>
              <span className="tabular-nums text-muted-foreground w-4 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
