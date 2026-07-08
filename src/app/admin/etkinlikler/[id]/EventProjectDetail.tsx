"use client";

import { useState, useTransition } from "react";
import { updateEventProjectStatus } from "../actions";
import EventChecklistManager from "./EventChecklistManager";

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function EventProjectDetail({ project }: { project: Record<string, any> }) {
  const [isPending, startTransition] = useTransition();
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const meta = STATUS_META[project.status] ?? STATUS_META.planning;
  const actions = STATUS_FLOW[project.status] ?? [];

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

  const origin = typeof window !== "undefined" ? window.location.origin : "https://www.noqt.events";
  const eventDateStr = project.event_date
    ? new Date(project.event_date).toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-5">
        {err && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{err}</p>}

        <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${meta.cls}`}>{meta.label}</span>
            {actions.length > 0 && (
              <div className="flex gap-2">
                {actions.map((a) => (
                  <button key={a.next} onClick={() => handleStatusChange(a.next)} disabled={isPending}
                    className="text-sm px-4 py-2 rounded-full font-medium bg-foreground text-background hover:opacity-90 disabled:opacity-50 transition-opacity">
                    {a.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm pt-2">
            {[
              ["Müşteri", project.client_name],
              ["E-posta", project.client_email],
              ["Telefon", project.client_phone],
              ["Tür", project.event_type],
              ["Tarih", eventDateStr],
              ["Saat", project.event_time],
              ["Misafir", project.guest_count],
              ["Mekan", project.venue_name],
              ["Şehir", project.venue_city],
              ["Adres", project.venue_address],
              ["Bütçe", project.budget ? `${Number(project.budget).toLocaleString("tr-TR")} ₺` : null],
            ].filter(([, v]) => v).map(([k, v]) => (
              <div key={k as string} className="flex gap-2">
                <span className="text-muted-foreground w-20 flex-shrink-0">{k}</span>
                <span className="text-foreground font-medium">{v}</span>
              </div>
            ))}
          </div>
        </div>

        <EventChecklistManager projectId={project.id} />
      </div>

      <div className="space-y-5">
        <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Proje Dosyası</p>
          <button onClick={handleDownloadPdf} disabled={pdfGenerating}
            className="w-full py-2.5 rounded-xl bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
            {pdfGenerating ? "Oluşturuluyor…" : "📄 PDF İndir"}
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Müşteri Linki</p>
          {project.checklist_token ? (
            <>
              <div className="px-3 py-2 rounded-xl border border-border bg-secondary/10 text-xs font-mono text-muted-foreground truncate">
                {origin}/planlama/{project.checklist_token}
              </div>
              <button onClick={handleCopyLink}
                className="w-full py-2 rounded-xl border border-border text-sm text-foreground hover:bg-secondary transition-colors">
                {copied ? "✓ Kopyalandı" : "Kopyala"}
              </button>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">Link üretilemedi.</p>
          )}
          <p className="text-xs text-muted-foreground">
            Müşteri giriş yapmadan bu linkle checklist&apos;i görüntüleyip işaretleyebilir ve yorum ekleyebilir.
          </p>
        </div>
      </div>
    </div>
  );
}
