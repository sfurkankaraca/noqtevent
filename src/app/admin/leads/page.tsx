import Link from "next/link";
import { createServiceClient } from "@/lib/supabase";
import { EVENT_TYPE_LABELS } from "@/lib/eventTypeLabels";
import {
  LEAD_SOURCES,
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  LEAD_STATUS_STYLES,
  followupDue,
  isStaleLead,
  type LeadStatus,
} from "@/lib/leads";
import LeadFilters from "./LeadFilters";
import DashboardStrip from "./DashboardStrip";
import StaleBanner from "./StaleBanner";
import ReanalyzeBanner from "./ReanalyzeBanner";

export const dynamic = "force-dynamic";

const SOURCE_LABELS = Object.fromEntries(LEAD_SOURCES.map((s) => [s.id, s.label]));

// Inbox sıralaması: takibi gelenler → new → needs_review → diğerleri (yeni üstte)
const STATUS_ORDER: Record<string, number> = {
  new: 1, needs_review: 2, proposal_ready: 3, sent: 4, waiting: 5,
  won: 6, lost: 7, archived: 8,
};

// "İstanbul, Beykoz, Çamlıbahçe Mah" → "İstanbul"
function cityOf(location: string | null): string | null {
  if (!location) return null;
  const first = location.split(",")[0]?.trim();
  return first || null;
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; city?: string; type?: string; sort?: string; stale?: string }>;
}) {
  const { status: filter, city: cityFilter, type: typeFilter, sort = "smart", stale } = await searchParams;
  const showStale = stale === "1";
  const supabase = createServiceClient();

  // Supabase/PostgREST varsayılanı 1000 satırda kesiyor — backfill sonrası
  // binlerce lead varken bu sayıları/eski-tespitini sessizce bozar.
  let query = supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(5000);
  if (filter && (LEAD_STATUSES as readonly string[]).includes(filter)) {
    query = query.eq("status", filter);
  } else {
    query = query.neq("status", "archived");
  }
  const { data: leads, error } = await query;

  const now = new Date();
  const withMeta = (leads ?? []).map((l) => ({
    ...l,
    followup_due: followupDue(l, now),
    call_due: Boolean(l.call_reminder_at && new Date(l.call_reminder_at) <= now),
    city: cityOf(l.location),
    stale: isStaleLead(l, now),
  }));

  // Backfill ile giren, hiç işlem görmemiş eski talepler varsayılan görünümde
  // gizlenir — canlı inbox'ı yüzlerce ölü Armut ilanı basmasın. "Eski/Pasif"
  // filtresiyle (?stale=1) ayrıca görülebilir ve toplu arşivlenebilir.
  const staleCount = withMeta.filter((l) => l.stale).length;
  const stuckNewCount = withMeta.filter((l) => l.status === "new").length;

  // Filtre seçenekleri: mevcut durum görünümündeki verilerden türetilir, seçili
  // filtre uygulanmadan — böylece dropdown daralıp seçenek kaybolmaz.
  const cityOptions = [...new Set(withMeta.map((l) => l.city).filter((c): c is string => Boolean(c)))]
    .sort((a, b) => a.localeCompare(b, "tr"))
    .map((c) => ({ value: c, label: c }));
  const typeOptions = [...new Set(withMeta.map((l) => l.event_type).filter((t): t is string => Boolean(t)))]
    .sort((a, b) => (EVENT_TYPE_LABELS[a] ?? a).localeCompare(EVENT_TYPE_LABELS[b] ?? b, "tr"))
    .map((t) => ({ value: t, label: EVENT_TYPE_LABELS[t] ?? t }));

  let rows = showStale ? withMeta.filter((l) => l.stale) : withMeta.filter((l) => !l.stale);
  if (cityFilter) rows = rows.filter((l) => l.city === cityFilter);
  if (typeFilter) rows = rows.filter((l) => l.event_type === typeFilter);

  // final_score = kalite (AI) + coğrafi kademe birleşimi; eski lead'lerde henüz
  // yoksa (backfill/geo öncesi) AI'nın ham probability'sine düşer.
  const scoreOf = (l: (typeof rows)[number]) =>
    (l.ai_analysis?.final_score as number | undefined) ?? (l.ai_analysis?.probability as number | undefined) ?? 0;

  rows = [...rows].sort((a, b) => {
    switch (sort) {
      case "date_desc":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "date_asc":
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case "score_desc":
        return scoreOf(b) - scoreOf(a);
      case "score_asc":
        return scoreOf(a) - scoreOf(b);
      case "event_date_asc": {
        if (!a.event_date && !b.event_date) return 0;
        if (!a.event_date) return 1;
        if (!b.event_date) return -1;
        return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
      }
      default: {
        // Akıllı sıralama: arama zamanı gelenler → takibi gelenler → durum önceliği → en yeni
        const ca = a.call_due ? 0 : 1;
        const cb = b.call_due ? 0 : 1;
        if (ca !== cb) return ca - cb;
        const fa = a.followup_due ? 0 : 1;
        const fb = b.followup_due ? 0 : 1;
        if (fa !== fb) return fa - fb;
        const sa = STATUS_ORDER[a.status] ?? 9;
        const sb = STATUS_ORDER[b.status] ?? 9;
        if (sa !== sb) return sa - sb;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    }
  });

  const counts: Record<string, number> = {};
  for (const l of leads ?? []) counts[l.status] = (counts[l.status] ?? 0) + 1;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Lead Inbox</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tüm kaynaklardan gelen fırsat talepleri — Sales OS
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/leads/analitik"
            className="border border-border text-foreground px-4 py-2.5 rounded-full text-sm hover:border-foreground/40 transition-colors"
          >
            📈 Analitik
          </Link>
          <Link
            href="/admin/leads/rapor"
            className="border border-border text-foreground px-4 py-2.5 rounded-full text-sm hover:border-foreground/40 transition-colors"
          >
            📊 Armut Raporu
          </Link>
          <Link
            href="/admin/leads/new"
            className="bg-foreground text-background px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
          >
            + Yeni Talep
          </Link>
        </div>
      </div>

      <DashboardStrip />

      {stuckNewCount > 0 && <ReanalyzeBanner count={stuckNewCount} />}

      {/* Durum filtreleri */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/leads"
          className={`px-3.5 py-1.5 rounded-full text-xs border transition-colors ${
            !filter ? "bg-foreground text-background border-foreground" : "bg-white text-muted-foreground border-border hover:border-foreground/40"
          }`}
        >
          Aktif Tümü
        </Link>
        {LEAD_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/leads?status=${s}`}
            className={`px-3.5 py-1.5 rounded-full text-xs border transition-colors ${
              filter === s ? "bg-foreground text-background border-foreground" : "bg-white text-muted-foreground border-border hover:border-foreground/40"
            }`}
          >
            {LEAD_STATUS_LABELS[s]}{counts[s] ? ` (${counts[s]})` : ""}
          </Link>
        ))}
        <Link
          href="/admin/leads?stale=1"
          className={`px-3.5 py-1.5 rounded-full text-xs border transition-colors ${
            showStale ? "bg-foreground text-background border-foreground" : "bg-amber-50 text-amber-700 border-amber-200 hover:border-amber-400"
          }`}
        >
          🗄 Eski/Pasif{staleCount ? ` (${staleCount})` : ""}
        </Link>
      </div>

      {showStale && staleCount > 0 && <StaleBanner count={staleCount} />}

      {/* Şehir / tür / sıralama */}
      <LeadFilters cities={cityOptions} types={typeOptions} />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error.message}
        </div>
      )}

      {!rows.length && !error && (
        <div className="bg-white rounded-2xl border border-border p-12 text-center">
          <p className="text-4xl mb-4">📥</p>
          <p className="text-foreground font-medium">Bu görünümde lead yok</p>
          <p className="text-sm text-muted-foreground mt-1">
            Filtreleri temizlemeyi dene ya da &ldquo;+ Yeni Talep&rdquo; ile ekle.
          </p>
        </div>
      )}

      {rows.length > 0 && (
        <div className="bg-white rounded-2xl border border-border overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground tracking-wide">MÜŞTERİ</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground tracking-wide">KAYNAK</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground tracking-wide">ETKİNLİK</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground tracking-wide">ŞEHİR</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground tracking-wide">TARİH</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground tracking-wide">SKOR</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground tracking-wide">DURUM</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground tracking-wide">GELİŞ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((lead) => {
                const finalScore = scoreOf(lead) || undefined;
                const isCombined = lead.ai_analysis?.final_score != null;
                return (
                  <tr key={lead.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-5 py-3.5">
                      <Link href={`/admin/leads/${lead.id}`} className="block">
                        <div className="flex items-center gap-2">
                          {lead.call_due && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 font-medium whitespace-nowrap">
                              📞 Ara
                            </span>
                          )}
                          {lead.followup_due && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200 font-medium whitespace-nowrap">
                              ⚡ Takip {lead.followup_due}
                            </span>
                          )}
                          <p className="font-medium text-foreground">
                            {lead.customer_name || "(isimsiz)"}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 max-w-[280px]">
                          {lead.description}
                        </p>
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">
                      {SOURCE_LABELS[lead.source] ?? lead.source}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">
                      {lead.event_type ? (EVENT_TYPE_LABELS[lead.event_type] ?? lead.event_type) : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                      {lead.city ?? "—"}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                      {lead.event_date
                        ? new Date(lead.event_date + "T00:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })
                        : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-xs">
                      {finalScore ? (
                        <span
                          className="tabular-nums"
                          title={isCombined ? `Skor ${finalScore}/5 (kalite + konum)` : `Skor ${finalScore}/5 (yalnızca kalite — konum henüz hesaplanmadı)`}
                        >
                          {"●".repeat(finalScore)}{"○".repeat(5 - finalScore)}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-[11px] px-2.5 py-1 rounded-full border font-medium whitespace-nowrap ${LEAD_STATUS_STYLES[lead.status as LeadStatus]}`}>
                        {LEAD_STATUS_LABELS[lead.status as LeadStatus]}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(lead.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
