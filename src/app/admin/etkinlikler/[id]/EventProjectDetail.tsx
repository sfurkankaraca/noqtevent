"use client";

import { useState, useTransition } from "react";
import { updateEventProjectStatus } from "../actions";
import EventChecklistManager from "./EventChecklistManager";
import RunSheetManager from "./RunSheetManager";
import AIStudio from "./AIStudio";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/checklistTemplate";
import { type ChecklistItem, type ChecklistComment, type ScheduleItem, dueStatus, daysOverdue, fmtDate } from "./types";

const STATUS_META: Record<string, { label: string; cls: string }> = {
  planning:  { label: "Planlanıyor", cls: "bg-blue-50 text-blue-700" },
  active:    { label: "Aktif",       cls: "bg-amber-50 text-amber-700" },
  completed: { label: "Tamamlandı",  cls: "bg-green-50 text-green-700" },
};

const STATUS_FLOW: Record<string, { next: "planning" | "active" | "completed"; label: string }[]> = {
  planning:  [{ next: "active", label: "Aktife Al →" }],
  active:    [{ next: "completed", label: "Tamamlandı ✓" }],
  completed: [],
};

const TABS = [
  { key: "overview", label: "Özet" },
  { key: "tasks", label: "Görevler" },
  { key: "runsheet", label: "Gün Planı" },
  { key: "studio", label: "İçerik Stüdyosu" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Project = Record<string, any>;

export default function EventProjectDetail({
  project, initialItems, initialComments, initialSchedule,
}: {
  project: Project;
  initialItems: ChecklistItem[];
  initialComments: ChecklistComment[];
  initialSchedule: ScheduleItem[];
}) {
  const [tab, setTab] = useState<TabKey>("overview");
  const [items, setItems] = useState<ChecklistItem[]>(initialItems);
  // Sayfa açılış anına sabitlenir — render sırasında Date.now() saf olmadığı için state'te tutulur
  const [now] = useState(() => Date.now());
  const [isPending, startTransition] = useTransition();
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const meta = STATUS_META[project.status] ?? STATUS_META.planning;
  const actions = STATUS_FLOW[project.status] ?? [];

  const doneCount = items.filter((i) => i.is_done).length;
  const progressPct = items.length ? Math.round((doneCount / items.length) * 100) : 0;
  const overdueItems = items.filter((i) => dueStatus(i) === "overdue")
    .sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? ""));
  const soonItems = items.filter((i) => dueStatus(i) === "soon")
    .sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? ""));

  const daysToEvent = project.event_date
    ? Math.ceil((new Date(project.event_date).getTime() - now) / (24 * 60 * 60 * 1000))
    : null;

  const handleStatusChange = (next: "planning" | "active" | "completed") => {
    setErr(null);
    startTransition(async () => {
      try { await updateEventProjectStatus(project.id, next); }
      catch (e) { setErr(e instanceof Error ? e.message : "Hata"); }
    });
  };

  const handleDownloadPdf = async () => {
    setPdfGenerating(true);
    setErr(null);
    try {
      const res = await fetch(`/api/event-projects/${project.id}/project-file`, { method: "POST" });
      if (!res.ok) throw new Error("PDF oluşturulamadı");
      const blob = await res.blob();
      window.open(URL.createObjectURL(blob), "_blank");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Hata");
    } finally {
      setPdfGenerating(false);
    }
  };

  const handleCopyLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://www.noqt.events";
    navigator.clipboard.writeText(`${origin}/planlama/${project.checklist_token}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const eventDateStr = project.event_date
    ? new Date(project.event_date).toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="space-y-5">
      {err && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{err}</p>}

      {/* Başlık şeridi: durum + geri sayım + ilerleme */}
      <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${meta.cls}`}>{meta.label}</span>
            {eventDateStr && <span className="text-sm text-muted-foreground">{eventDateStr}{project.event_time ? ` · ${project.event_time}` : ""}</span>}
            {daysToEvent !== null && daysToEvent >= 0 && (
              <span className={`text-sm font-semibold ${daysToEvent <= 7 ? "text-red-600" : daysToEvent <= 30 ? "text-amber-600" : "text-foreground"}`}>
                {daysToEvent === 0 ? "🎉 Bugün!" : `${daysToEvent} gün kaldı`}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {actions.map((a) => (
              <button key={a.next} onClick={() => handleStatusChange(a.next)} disabled={isPending}
                className="text-sm px-4 py-2 rounded-full font-medium bg-foreground text-background hover:opacity-90 disabled:opacity-50 transition-opacity">
                {a.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs text-muted-foreground">Genel ilerleme</p>
            <p className="text-xs text-muted-foreground">{doneCount} / {items.length} görev · %{progressPct}</p>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div className="h-full bg-foreground transition-all" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      {/* Sekmeler */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>
            {t.label}
            {t.key === "overview" && overdueItems.length > 0 && (
              <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold">{overdueItems.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Özet */}
      {tab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            {overdueItems.length > 0 && (
              <div className="bg-red-50 rounded-2xl border border-red-200 p-5 space-y-2">
                <p className="text-xs font-medium text-red-800 uppercase tracking-wide">🔴 Gecikmiş Görevler ({overdueItems.length})</p>
                {overdueItems.map((i) => (
                  <div key={i.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-red-900">{i.title}</span>
                    <span className="text-xs text-red-700 flex-shrink-0">
                      {i.assigned_to ? `${i.assigned_to} · ` : ""}{i.due_date ? `${daysOverdue(i.due_date)} gün gecikti` : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {soonItems.length > 0 && (
              <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5 space-y-2">
                <p className="text-xs font-medium text-amber-800 uppercase tracking-wide">🟡 Önümüzdeki 7 Gün ({soonItems.length})</p>
                {soonItems.map((i) => (
                  <div key={i.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-amber-900">{i.title}</span>
                    <span className="text-xs text-amber-700 flex-shrink-0">
                      {i.assigned_to ? `${i.assigned_to} · ` : ""}{i.due_date ? fmtDate(i.due_date) : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {overdueItems.length === 0 && soonItems.length === 0 && items.length > 0 && (
              <div className="bg-green-50 rounded-2xl border border-green-200 p-5">
                <p className="text-sm text-green-800">✓ Her şey yolunda — gecikmiş veya bu hafta acil görev yok.</p>
              </div>
            )}

            {/* Kategori ilerlemeleri */}
            <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Kategori İlerlemesi</p>
              {CATEGORY_ORDER.filter((cat) => items.some((i) => i.category === cat)).map((cat) => {
                const catItems = items.filter((i) => i.category === cat);
                const catDone = catItems.filter((i) => i.is_done).length;
                const pct = Math.round((catDone / catItems.length) * 100);
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm text-foreground">{CATEGORY_LABELS[cat]}</p>
                      <p className="text-xs text-muted-foreground">{catDone}/{catItems.length}{pct === 100 ? " ✓" : ""}</p>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div className={`h-full transition-all ${pct === 100 ? "bg-green-500" : "bg-foreground"}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              {items.length === 0 && <p className="text-sm text-muted-foreground">Henüz görev yok.</p>}
            </div>
          </div>

          <div className="space-y-5">
            {/* Etkinlik bilgileri */}
            <div className="bg-white rounded-2xl border border-border p-5 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Etkinlik</p>
              <div className="space-y-1.5 text-sm">
                {[
                  ["Müşteri", project.client_name],
                  ["Tür", project.event_type],
                  ["Misafir", project.guest_count],
                  ["Mekan", project.venue_name],
                  ["Şehir", project.venue_city],
                  ["Bütçe", project.budget ? `${Number(project.budget).toLocaleString("tr-TR")} ₺` : null],
                ].filter(([, v]) => v).map(([k, v]) => (
                  <div key={k as string} className="flex gap-2">
                    <span className="text-muted-foreground w-16 flex-shrink-0">{k}</span>
                    <span className="text-foreground font-medium">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hızlı aksiyonlar */}
            <div className="bg-white rounded-2xl border border-border p-5 space-y-2.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Hızlı Aksiyonlar</p>
              <button onClick={handleDownloadPdf} disabled={pdfGenerating}
                className="w-full py-2.5 rounded-xl bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                {pdfGenerating ? "Oluşturuluyor…" : "📄 Proje Dosyası (PDF)"}
              </button>
              {project.checklist_token && (
                <button onClick={handleCopyLink}
                  className="w-full py-2.5 rounded-xl border border-border text-sm text-foreground hover:bg-secondary transition-colors">
                  {copied ? "✓ Kopyalandı" : "🔗 Müşteri Linkini Kopyala"}
                </button>
              )}
              <p className="text-xs text-muted-foreground">
                PDF; etkinlik bilgileri, gün planı ve görev listesini içerir. Müşteri linkiyle müşteri kendi görevlerini işaretleyebilir.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Görevler */}
      {tab === "tasks" && (
        <EventChecklistManager projectId={project.id} items={items} setItems={setItems} initialComments={initialComments} />
      )}

      {/* Gün planı */}
      {tab === "runsheet" && (
        <RunSheetManager projectId={project.id} initialSchedule={initialSchedule} />
      )}

      {/* İçerik stüdyosu */}
      {tab === "studio" && (
        <AIStudio projectId={project.id} />
      )}
    </div>
  );
}
