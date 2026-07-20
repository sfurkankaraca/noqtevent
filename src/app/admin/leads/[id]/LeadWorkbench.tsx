"use client";

import { useState, useTransition } from "react";
import { EVENT_TYPES } from "@/components/planner/PlannerStore";
import { EVENT_TYPE_LABELS } from "@/lib/eventTypeLabels";
import {
  LEAD_SOURCES,
  LEAD_STATUS_LABELS,
  LEAD_STATUS_STYLES,
  LEAD_TRANSITIONS,
  LEAD_EVENT_LABELS,
  INTENT_LABELS,
  URGENCY_LABELS,
  BUDGET_SIGNAL_LABELS,
  followupDue,
  type LeadStatus,
} from "@/lib/leads";
import {
  regenerateAnalysis,
  saveEditedReply,
  markSent,
  changeLeadStatus,
  updateLeadNotes,
  updateLeadFields,
} from "../actions";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LeadRow = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventRow = Record<string, any>;

const SOURCE_LABELS = Object.fromEntries(LEAD_SOURCES.map((s) => [s.id, s.label]));
const inputCls =
  "w-full px-3 py-2 rounded-lg border border-border bg-white text-foreground text-sm focus:outline-none focus:border-foreground/40 transition-colors";

function Card({ title, children, extra }: { title: string; children: React.ReactNode; extra?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-muted-foreground tracking-[0.15em] uppercase font-medium">{title}</p>
        {extra}
      </div>
      {children}
    </div>
  );
}

export default function LeadWorkbench({ lead, events }: { lead: LeadRow; events: EventRow[] }) {
  const [pending, startTransition] = useTransition();
  const [reply, setReply] = useState<string>(lead.suggested_reply ?? "");
  const [replyDirty, setReplyDirty] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notes, setNotes] = useState<string>(lead.admin_notes ?? "");
  const [editFields, setEditFields] = useState(false);
  const [fields, setFields] = useState({
    customer_name: lead.customer_name ?? "",
    event_type: lead.event_type ?? "",
    event_date: lead.event_date ?? "",
    location: lead.location ?? "",
    budget_text: lead.budget_text ?? "",
  });
  const [lostReason, setLostReason] = useState("");
  const [askLostReason, setAskLostReason] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const a = lead.ai_analysis;
  const status = lead.status as LeadStatus;
  const transitions = LEAD_TRANSITIONS[status] ?? [];
  const due = followupDue({
    status: lead.status,
    sent_at: lead.sent_at ?? null,
    last_followup_at: lead.last_followup_at ?? null,
    followup_count: lead.followup_count ?? 0,
  });

  const act = (fn: () => Promise<void>) =>
    startTransition(async () => {
      setError(null);
      try { await fn(); } catch (err) { setError(err instanceof Error ? err.message : "Hata oluştu."); }
    });

  const copyReply = async () => {
    await navigator.clipboard.writeText(reply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    if (replyDirty) act(() => saveEditedReply(lead.id, reply).then(() => setReplyDirty(false)));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* ── SOL: ham talep + alanlar + notlar ── */}
      <div className="space-y-5">
        <Card
          title={`Ham Talep · ${SOURCE_LABELS[lead.source] ?? lead.source}`}
          extra={
            <span className={`text-[11px] px-2.5 py-1 rounded-full border font-medium ${LEAD_STATUS_STYLES[status]}`}>
              {LEAD_STATUS_LABELS[status]}
            </span>
          }
        >
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{lead.description}</p>
          <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            {!editFields ? (
              <>
                <p><span className="text-muted-foreground">Müşteri:</span> {lead.customer_name || "—"}</p>
                <p><span className="text-muted-foreground">Etkinlik:</span> {lead.event_type ? (EVENT_TYPE_LABELS[lead.event_type] ?? lead.event_type) : "—"}</p>
                <p><span className="text-muted-foreground">Tarih:</span> {lead.event_date || "—"}</p>
                <p><span className="text-muted-foreground">Konum:</span> {lead.location || "—"}</p>
                <p className="col-span-2"><span className="text-muted-foreground">Bütçe (ham):</span> {lead.budget_text || "—"}</p>
                <button onClick={() => setEditFields(true)} className="text-left text-muted-foreground underline underline-offset-2 hover:text-foreground col-span-2">
                  alanları düzenle
                </button>
              </>
            ) : (
              <>
                <input className={inputCls} placeholder="Müşteri adı" value={fields.customer_name} onChange={(e) => setFields((f) => ({ ...f, customer_name: e.target.value }))} />
                <select className={inputCls} value={fields.event_type} onChange={(e) => setFields((f) => ({ ...f, event_type: e.target.value }))}>
                  <option value="">Etkinlik türü?</option>
                  {EVENT_TYPES.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
                </select>
                <input type="date" className={inputCls} value={fields.event_date} onChange={(e) => setFields((f) => ({ ...f, event_date: e.target.value }))} />
                <input className={inputCls} placeholder="Konum" value={fields.location} onChange={(e) => setFields((f) => ({ ...f, location: e.target.value }))} />
                <input className={`${inputCls} col-span-2`} placeholder="Bütçe (ham ifade)" value={fields.budget_text} onChange={(e) => setFields((f) => ({ ...f, budget_text: e.target.value }))} />
                <div className="col-span-2 flex gap-2">
                  <button
                    onClick={() => act(() => updateLeadFields(lead.id, fields).then(() => setEditFields(false)))}
                    disabled={pending}
                    className="px-4 py-1.5 rounded-full bg-foreground text-background text-xs font-medium hover:opacity-90"
                  >
                    Kaydet
                  </button>
                  <button onClick={() => setEditFields(false)} className="px-4 py-1.5 rounded-full border border-border text-xs text-muted-foreground">
                    Vazgeç
                  </button>
                </div>
              </>
            )}
          </div>
        </Card>

        <Card title="Notlar">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Satış notları… (müşteri dönüşleri, arama özetleri)"
            className={`${inputCls} resize-y`}
          />
          <button
            onClick={() => act(() => updateLeadNotes(lead.id, notes))}
            disabled={pending || notes === (lead.admin_notes ?? "")}
            className="mt-2 px-4 py-1.5 rounded-full border border-border text-xs text-muted-foreground hover:border-foreground/40 disabled:opacity-40"
          >
            Notu Kaydet
          </button>
        </Card>

        <Card title="Zaman Çizgisi">
          <div className="space-y-2.5">
            {events.length === 0 && <p className="text-xs text-muted-foreground">Henüz olay yok.</p>}
            {events.map((ev) => (
              <div key={ev.id} className="flex items-baseline gap-3 text-xs">
                <span className="text-muted-foreground whitespace-nowrap tabular-nums">
                  {new Date(ev.created_at).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className="text-foreground">
                  {LEAD_EVENT_LABELS[ev.type] ?? ev.type}
                  {ev.type === "status_changed" && ev.data?.to ? ` → ${LEAD_STATUS_LABELS[ev.data.to as LeadStatus] ?? ev.data.to}` : ""}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── SAĞ: AI analiz + yanıt + durum ── */}
      <div className="space-y-5">
        <Card
          title="AI Analiz"
          extra={
            <button
              onClick={() => act(() => regenerateAnalysis(lead.id))}
              disabled={pending}
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground disabled:opacity-40"
            >
              {pending ? "çalışıyor…" : "yeniden analiz"}
            </button>
          }
        >
          {!a ? (
            <p className="text-sm text-muted-foreground">
              Analiz yok — AI Gateway erişilemez olabilir. &ldquo;yeniden analiz&rdquo; ile tekrar dene.
            </p>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <p><span className="text-muted-foreground text-xs">Tür tahmini:</span><br />{a.event_type_guess ? (EVENT_TYPE_LABELS[a.event_type_guess] ?? a.event_type_guess) : "belirsiz"}</p>
                <p><span className="text-muted-foreground text-xs">Niyet:</span><br />{a.intent ? INTENT_LABELS[a.intent] : "belirsiz"}</p>
                <p><span className="text-muted-foreground text-xs">Aciliyet:</span><br />{a.urgency ? URGENCY_LABELS[a.urgency] : "belirsiz"}</p>
                <p><span className="text-muted-foreground text-xs">Bütçe sinyali:</span><br />{BUDGET_SIGNAL_LABELS[a.budget_signal] ?? "—"}</p>
                <p><span className="text-muted-foreground text-xs">Olasılık:</span><br /><span className="tabular-nums">{"●".repeat(a.probability)}{"○".repeat(5 - a.probability)}</span> {a.probability}/5</p>
                <p><span className="text-muted-foreground text-xs">Önerilen paket:</span><br />{a.recommended_package ?? "—"}</p>
              </div>
              {a.missing_info?.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Eksik bilgiler:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {a.missing_info.map((m: string) => (
                      <span key={m} className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">{m}</span>
                    ))}
                  </div>
                </div>
              )}
              {a.sales_notes && (
                <p className="text-xs bg-secondary/50 rounded-lg px-3 py-2 text-foreground leading-relaxed">💡 {a.sales_notes}</p>
              )}
            </div>
          )}
        </Card>

        <Card title="Önerilen Yanıt — onaysız hiçbir şey gönderilmez">
          <textarea
            value={reply}
            onChange={(e) => { setReply(e.target.value); setReplyDirty(true); }}
            rows={7}
            placeholder="Henüz yanıt üretilmedi — 'yeniden analiz' yanıtı da üretir."
            className={`${inputCls} resize-y leading-relaxed`}
          />
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              onClick={copyReply}
              disabled={!reply || pending}
              className="px-5 py-2 rounded-full bg-foreground text-background text-xs font-medium hover:opacity-90 disabled:opacity-40"
            >
              {copied ? "✓ Kopyalandı" : "📋 Kopyala"}
            </button>
            {replyDirty && (
              <button
                onClick={() => act(() => saveEditedReply(lead.id, reply).then(() => setReplyDirty(false)))}
                disabled={pending}
                className="px-4 py-2 rounded-full border border-border text-xs text-muted-foreground hover:border-foreground/40"
              >
                Düzenlemeyi Kaydet
              </button>
            )}
            {(status === "needs_review" || status === "proposal_ready" || status === "new") && (
              <button
                onClick={() => act(() => markSent(lead.id))}
                disabled={pending}
                className="px-4 py-2 rounded-full border border-green-300 bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100 disabled:opacity-40"
              >
                ✓ Gönderildi olarak işaretle
              </button>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Akış: kopyala → Armut/WhatsApp&apos;ta kendin gönder → burada &ldquo;gönderildi&rdquo; işaretle.
          </p>
        </Card>

        <Card title="Durum">
          {due && (
            <p className="text-xs bg-orange-50 border border-orange-200 text-orange-700 rounded-lg px-3 py-2 mb-3">
              ⚡ Takip {due} zamanı geldi — müşteriye nazik bir hatırlatma gönderme vakti.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {transitions.map((t) => (
              <button
                key={t}
                onClick={() => {
                  if (t === "lost") { setAskLostReason(true); return; }
                  act(() => changeLeadStatus(lead.id, t));
                }}
                disabled={pending}
                className={`px-4 py-2 rounded-full text-xs border font-medium transition-colors disabled:opacity-40 ${LEAD_STATUS_STYLES[t]} hover:opacity-80`}
              >
                → {LEAD_STATUS_LABELS[t]}
              </button>
            ))}
          </div>
          {askLostReason && (
            <div className="mt-3 space-y-2">
              <input
                className={inputCls}
                placeholder="Kayıp nedeni (kısa) — Phase 3 win/loss analizi için önemli"
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => act(() => changeLeadStatus(lead.id, "lost", lostReason).then(() => setAskLostReason(false)))}
                  disabled={pending}
                  className="px-4 py-1.5 rounded-full bg-red-600 text-white text-xs font-medium hover:opacity-90"
                >
                  Kaybedildi işaretle
                </button>
                <button onClick={() => setAskLostReason(false)} className="px-4 py-1.5 rounded-full border border-border text-xs text-muted-foreground">
                  Vazgeç
                </button>
              </div>
            </div>
          )}
        </Card>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
        )}
      </div>
    </div>
  );
}
