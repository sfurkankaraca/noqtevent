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
  setCallReminder,
  markCallMade,
} from "../actions";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LeadRow = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventRow = Record<string, any>;

const SOURCE_LABELS = Object.fromEntries(LEAD_SOURCES.map((s) => [s.id, s.label]));
const inputCls =
  "w-full px-3 py-2 rounded-lg border border-border bg-white text-foreground text-sm focus:outline-none focus:border-foreground/40 transition-colors";

// Arama hatırlatıcısı hızlı seçenekleri — yerel saat, ISO olarak döner.
function addHours(h: number): string {
  const d = new Date();
  d.setHours(d.getHours() + h);
  return d.toISOString();
}
function atTomorrow(hour: number): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}
function atToday(hour: number): string {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  if (d <= new Date()) d.setDate(d.getDate() + 1);
  return d.toISOString();
}

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
  // "Yeniden analiz" sonrası sunucudan gelen yeni yanıtı yakala (render sırasında
  // state düzeltme deseni — kullanıcının kaydedilmemiş düzenlemesi varsa ezilmez).
  const [prevSuggested, setPrevSuggested] = useState<string>(lead.suggested_reply ?? "");
  if ((lead.suggested_reply ?? "") !== prevSuggested) {
    setPrevSuggested(lead.suggested_reply ?? "");
    if (!replyDirty) setReply(lead.suggested_reply ?? "");
  }
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
  const callReminderDue = Boolean(lead.call_reminder_at && new Date(lead.call_reminder_at) <= new Date());

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
          {lead.raw_source_payload?.armut_job_url && (
            <a
              href={lead.raw_source_payload.armut_job_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 text-xs px-3 py-1.5 rounded-full bg-secondary text-foreground hover:bg-secondary/70 transition-colors"
            >
              🔗 Armut&apos;ta Görüntüle / Teklif Ver
            </a>
          )}
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
                <p><span className="text-muted-foreground text-xs">Önerilen paket:</span><br />{a.recommended_package ?? "—"}</p>
              </div>

              {/* Skor kırılımı: konum Kayseri'ye yakınlığa göre deterministik, AI'dan gelmez */}
              <div className="grid grid-cols-3 gap-3 pt-1">
                <div className="bg-secondary/40 rounded-xl px-3 py-2.5 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Talep Kalitesi</p>
                  <p className="text-sm font-semibold text-foreground mt-1 tabular-nums">{a.probability}/5</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">AI — netlik/aciliyet</p>
                </div>
                <div className="bg-secondary/40 rounded-xl px-3 py-2.5 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Konum</p>
                  <p className="text-sm font-semibold text-foreground mt-1 tabular-nums">
                    {a.geo_tier != null ? `${a.geo_tier}/5` : "—"}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Kayseri&apos;ye yakınlık</p>
                </div>
                <div className="bg-foreground rounded-xl px-3 py-2.5 text-center">
                  <p className="text-[10px] text-background/60 uppercase tracking-wide">Nihai Skor</p>
                  <p className="text-sm font-semibold text-background mt-1 tabular-nums">
                    {(a.final_score ?? a.probability)}/5
                  </p>
                  <p className="text-[10px] text-background/60 mt-0.5">
                    {a.final_score != null ? "kalite + konum" : "yalnızca kalite"}
                  </p>
                </div>
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
          {lead.landing_token && (
            <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-muted-foreground">Müşteriye özel sayfa:</span>
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(`https://www.noqt.events/t/${lead.landing_token}`);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2500);
                }}
                className="text-[11px] px-3 py-1 rounded-full border border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground transition-colors"
              >
                🔗 Landing linkini kopyala
              </button>
              <span className="text-[10px] text-muted-foreground">
                (telefonla aradıysan WhatsApp&apos;tan bu linki at — müşteri bilgilerini oradan bırakır)
              </span>
            </div>
          )}
        </Card>

        <Card title="Arama Hatırlatıcısı">
          {callReminderDue && (
            <p className="text-xs bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 mb-3">
              📞 Arama zamanı geldi — {new Date(lead.call_reminder_at).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
          {lead.call_reminder_at && !callReminderDue && (
            <p className="text-xs text-muted-foreground mb-3">
              🕐 {new Date(lead.call_reminder_at).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} için ayarlandı
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => act(() => setCallReminder(lead.id, addHours(2)))}
              disabled={pending}
              className="px-3.5 py-1.5 rounded-full border border-border text-xs text-muted-foreground hover:border-foreground/40 transition-colors disabled:opacity-40"
            >
              2 saat sonra
            </button>
            <button
              onClick={() => act(() => setCallReminder(lead.id, atTomorrow(10)))}
              disabled={pending}
              className="px-3.5 py-1.5 rounded-full border border-border text-xs text-muted-foreground hover:border-foreground/40 transition-colors disabled:opacity-40"
            >
              Yarın 10:00
            </button>
            <button
              onClick={() => act(() => setCallReminder(lead.id, atToday(18)))}
              disabled={pending}
              className="px-3.5 py-1.5 rounded-full border border-border text-xs text-muted-foreground hover:border-foreground/40 transition-colors disabled:opacity-40"
            >
              Bu akşam 18:00
            </button>
            {(lead.call_reminder_at || callReminderDue) && (
              <button
                onClick={() => act(() => markCallMade(lead.id))}
                disabled={pending}
                className="px-3.5 py-1.5 rounded-full border border-green-300 bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100 transition-colors disabled:opacity-40"
              >
                ✓ Arandı
              </button>
            )}
            {lead.call_reminder_at && (
              <button
                onClick={() => act(() => setCallReminder(lead.id, null))}
                disabled={pending}
                className="px-3.5 py-1.5 rounded-full text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 underline underline-offset-2"
              >
                temizle
              </button>
            )}
          </div>
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
