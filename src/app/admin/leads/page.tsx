import Link from "next/link";
import { createServiceClient } from "@/lib/supabase";
import { EVENT_TYPE_LABELS } from "@/lib/eventTypeLabels";
import {
  LEAD_SOURCES,
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  LEAD_STATUS_STYLES,
  followupDue,
  type LeadStatus,
} from "@/lib/leads";

export const dynamic = "force-dynamic";

const SOURCE_LABELS = Object.fromEntries(LEAD_SOURCES.map((s) => [s.id, s.label]));

// Inbox sıralaması: takibi gelenler → new → needs_review → diğerleri (yeni üstte)
const STATUS_ORDER: Record<string, number> = {
  new: 1, needs_review: 2, proposal_ready: 3, sent: 4, waiting: 5,
  won: 6, lost: 7, archived: 8,
};

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: filter } = await searchParams;
  const supabase = createServiceClient();

  let query = supabase.from("leads").select("*").order("created_at", { ascending: false });
  if (filter && (LEAD_STATUSES as readonly string[]).includes(filter)) {
    query = query.eq("status", filter);
  } else {
    query = query.neq("status", "archived");
  }
  const { data: leads, error } = await query;

  const now = new Date();
  const rows = (leads ?? [])
    .map((l) => ({ ...l, followup_due: followupDue(l, now) }))
    .sort((a, b) => {
      const fa = a.followup_due ? 0 : 1;
      const fb = b.followup_due ? 0 : 1;
      if (fa !== fb) return fa - fb;
      const sa = STATUS_ORDER[a.status] ?? 9;
      const sb = STATUS_ORDER[b.status] ?? 9;
      if (sa !== sb) return sa - sb;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
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
        <Link
          href="/admin/leads/new"
          className="bg-foreground text-background px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
        >
          + Yeni Talep
        </Link>
      </div>

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
      </div>

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
            Yeni bir talep geldiğinde &ldquo;+ Yeni Talep&rdquo; ile ekle.
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
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground tracking-wide">TARİH</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground tracking-wide">SKOR</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground tracking-wide">DURUM</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground tracking-wide">GELİŞ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((lead) => {
                const prob = lead.ai_analysis?.probability as number | undefined;
                return (
                  <tr key={lead.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-5 py-3.5">
                      <Link href={`/admin/leads/${lead.id}`} className="block">
                        <div className="flex items-center gap-2">
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
                      {lead.event_date
                        ? new Date(lead.event_date + "T00:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })
                        : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-xs">
                      {prob ? (
                        <span className="tabular-nums" title={`Olasılık ${prob}/5`}>
                          {"●".repeat(prob)}{"○".repeat(5 - prob)}
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
