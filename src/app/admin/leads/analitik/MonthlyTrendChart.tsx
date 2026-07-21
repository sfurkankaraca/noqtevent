"use client";

import { useState } from "react";
import Link from "next/link";
import { getLeadsForMonthAction } from "../actions";
import { LEAD_SOURCES, LEAD_STATUS_LABELS, LEAD_STATUS_STYLES, type LeadStatus } from "@/lib/leads";
import { EVENT_TYPE_LABELS } from "@/lib/eventTypeLabels";

const SOURCE_LABELS = Object.fromEntries(LEAD_SOURCES.map((s) => [s.id, s.label]));

type MonthBar = { key: string; label: string; count: number };
type MonthLead = {
  id: string;
  source: string;
  status: string;
  event_type: string | null;
  location: string | null;
  description: string | null;
  demand_date: string;
};

export default function MonthlyTrendChart({ bars }: { bars: MonthBar[] }) {
  const max = Math.max(1, ...bars.map((b) => b.count));
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<MonthLead[]>([]);
  const [error, setError] = useState<string | null>(null);

  const openMonth = async (key: string) => {
    if (openKey === key) {
      setOpenKey(null);
      return;
    }
    setOpenKey(key);
    setLoading(true);
    setError(null);
    try {
      const rows = await getLeadsForMonthAction(key);
      setLeads(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  const openBar = bars.find((b) => b.key === openKey);

  return (
    <div className="bg-white rounded-2xl border border-border p-5">
      <p className="text-xs text-muted-foreground tracking-[0.15em] uppercase font-medium mb-5">
        Aylık Talep Trendi — Son 12 Ay (bir aya tıklayın)
      </p>
      <div className="flex items-end gap-2 h-32">
        {bars.map((b) => (
          <button
            key={b.key}
            type="button"
            onClick={() => openMonth(b.key)}
            className="flex-1 flex flex-col items-center justify-end gap-1.5 group cursor-pointer"
          >
            <span className="text-[10px] text-muted-foreground tabular-nums">{b.count || ""}</span>
            <div
              className={`w-full rounded-t-md min-h-[2px] transition-colors ${
                openKey === b.key ? "bg-violet-600" : "bg-foreground group-hover:bg-violet-500"
              }`}
              style={{ height: `${Math.max(2, (b.count / max) * 100)}px` }}
            />
            <span
              className={`text-[10px] whitespace-nowrap ${
                openKey === b.key ? "text-violet-600 font-medium" : "text-muted-foreground"
              }`}
            >
              {b.label}
            </span>
          </button>
        ))}
      </div>

      {openKey && (
        <div className="mt-5 pt-4 border-t border-border">
          <p className="text-xs font-medium text-foreground mb-3">
            {openBar?.label} — {openBar?.count ?? 0} talep
          </p>
          {loading && <p className="text-xs text-muted-foreground">Yükleniyor...</p>}
          {error && <p className="text-xs text-red-600">{error}</p>}
          {!loading && !error && leads.length === 0 && (
            <p className="text-xs text-muted-foreground">Bu ay için kayıt yok.</p>
          )}
          {!loading && !error && leads.length > 0 && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {leads.map((l) => (
                <Link
                  key={l.id}
                  href={`/admin/leads/${l.id}`}
                  className="flex items-start gap-3 text-xs p-2 rounded-lg hover:bg-secondary transition-colors"
                >
                  <span className="w-20 shrink-0 text-muted-foreground">
                    {new Date(l.demand_date).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" })}
                  </span>
                  <span className="w-16 shrink-0 text-muted-foreground">{SOURCE_LABELS[l.source] ?? l.source}</span>
                  <span
                    className={`w-24 shrink-0 px-1.5 py-0.5 rounded text-[10px] text-center ${LEAD_STATUS_STYLES[l.status as LeadStatus] ?? ""}`}
                  >
                    {LEAD_STATUS_LABELS[l.status as LeadStatus] ?? l.status}
                  </span>
                  <span className="w-28 shrink-0 text-foreground truncate">
                    {l.event_type ? EVENT_TYPE_LABELS[l.event_type] ?? l.event_type : "—"}
                  </span>
                  <span className="w-24 shrink-0 text-muted-foreground truncate">{l.location ?? "—"}</span>
                  <span className="flex-1 text-muted-foreground truncate">{l.description ?? ""}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
