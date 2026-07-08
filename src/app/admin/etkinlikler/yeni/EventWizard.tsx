"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CATEGORY_LABELS, WIZARD_CATEGORIES, type ChecklistCategory, type CategoryDecision } from "@/lib/checklistTemplate";

const CATEGORY_HINT: Partial<Record<ChecklistCategory, { vendorLabel: string; question: string }>> = {
  mekan: { vendorLabel: "Mekan adı", question: "Mekan bu etkinlikte belirlendi mi?" },
  sozlesme: { vendorLabel: "", question: "Sözleşme & ödeme takibi bu etkinlikte gerekli mi?" },
  catering: { vendorLabel: "Catering firması", question: "Catering bu etkinliğe dahil mi?" },
  dekor: { vendorLabel: "Dekor/çiçek firması", question: "Dekor & çiçek bu etkinliğe dahil mi?" },
  muzik: { vendorLabel: "DJ / Sanatçı adı", question: "Müzik/sanatçı bu etkinliğe dahil mi?" },
  fotograf: { vendorLabel: "Fotoğrafçı/videografer", question: "Fotoğraf & video bu etkinliğe dahil mi?" },
  davetiye: { vendorLabel: "", question: "Davetiye & misafir takibi gerekli mi?" },
  gun_plani: { vendorLabel: "Koordinatör", question: "Gün planı & koordinasyon gerekli mi?" },
  ulasim: { vendorLabel: "", question: "Ulaşım/konaklama planlaması gerekli mi?" },
  son_kontrol: { vendorLabel: "", question: "Son kontrol listesi bu etkinliğe dahil mi?" },
};

type Basics = {
  client_name: string; client_email: string; client_phone: string;
  event_type: string; event_date: string; event_time: string;
  guest_count: string; budget: string;
  venue_name: string; venue_city: string; venue_address: string;
  booking_id: string;
};

const EMPTY_BASICS: Basics = {
  client_name: "", client_email: "", client_phone: "",
  event_type: "", event_date: "", event_time: "",
  guest_count: "", budget: "",
  venue_name: "", venue_city: "", venue_address: "",
  booking_id: "",
};

export default function EventWizard({ bookings }: { bookings: { id: string; client_name: string; event_date: string | null }[] }) {
  const router = useRouter();
  const steps: ("basics" | ChecklistCategory | "review")[] = ["basics", ...WIZARD_CATEGORIES, "review"];
  const [stepIdx, setStepIdx] = useState(0);
  const [basics, setBasics] = useState<Basics>(EMPTY_BASICS);
  const [decisions, setDecisions] = useState<Record<string, CategoryDecision>>(
    Object.fromEntries(WIZARD_CATEGORIES.map((c) => [c, { included: true }]))
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step = steps[stepIdx];
  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-foreground/40";
  const labelCls = "text-xs text-muted-foreground mb-1.5 block";

  const updateDecision = (cat: string, patch: Partial<CategoryDecision>) => {
    setDecisions((prev) => ({ ...prev, [cat]: { ...prev[cat], ...patch } }));
  };

  const canGoNext = step === "basics" ? basics.client_name.trim().length > 0 : true;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/event-projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: basics.client_name,
          client_email: basics.client_email || null,
          client_phone: basics.client_phone || null,
          event_type: basics.event_type || null,
          event_date: basics.event_date || null,
          event_time: basics.event_time || null,
          guest_count: basics.guest_count ? Number(basics.guest_count) : null,
          budget: basics.budget ? Number(basics.budget) : null,
          venue_name: basics.venue_name || null,
          venue_city: basics.venue_city || null,
          venue_address: basics.venue_address || null,
          booking_id: basics.booking_id || null,
          decisions,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Etkinlik oluşturulamadı");
      }
      const { id } = await res.json();
      router.push(`/admin/etkinlikler/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hata");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-5">
      {/* İlerleme */}
      <div className="flex items-center gap-1">
        {steps.map((s, i) => (
          <div key={s} className={`h-1 flex-1 rounded-full ${i <= stepIdx ? "bg-foreground" : "bg-border"}`} />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Adım {stepIdx + 1} / {steps.length}</p>

      {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}

      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        {step === "basics" && (
          <>
            <p className="text-sm font-medium text-foreground mb-1">Temel Bilgiler</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className={labelCls}>Müşteri adı *</label>
                <input className={inputCls} value={basics.client_name}
                  onChange={(e) => setBasics((b) => ({ ...b, client_name: e.target.value }))} placeholder="Ayşe & Mehmet" />
              </div>
              <div>
                <label className={labelCls}>E-posta</label>
                <input className={inputCls} value={basics.client_email}
                  onChange={(e) => setBasics((b) => ({ ...b, client_email: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Telefon</label>
                <input className={inputCls} value={basics.client_phone}
                  onChange={(e) => setBasics((b) => ({ ...b, client_phone: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Etkinlik türü</label>
                <input className={inputCls} value={basics.event_type}
                  onChange={(e) => setBasics((b) => ({ ...b, event_type: e.target.value }))} placeholder="Düğün, kına, mezuniyet…" />
              </div>
              <div>
                <label className={labelCls}>Misafir sayısı</label>
                <input type="number" className={inputCls} value={basics.guest_count}
                  onChange={(e) => setBasics((b) => ({ ...b, guest_count: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Tarih</label>
                <input type="date" className={inputCls} value={basics.event_date}
                  onChange={(e) => setBasics((b) => ({ ...b, event_date: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Saat</label>
                <input type="time" className={inputCls} value={basics.event_time}
                  onChange={(e) => setBasics((b) => ({ ...b, event_time: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Mekan adı</label>
                <input className={inputCls} value={basics.venue_name}
                  onChange={(e) => setBasics((b) => ({ ...b, venue_name: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Şehir</label>
                <input className={inputCls} value={basics.venue_city}
                  onChange={(e) => setBasics((b) => ({ ...b, venue_city: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Adres</label>
                <input className={inputCls} value={basics.venue_address}
                  onChange={(e) => setBasics((b) => ({ ...b, venue_address: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Bütçe (₺)</label>
                <input type="number" className={inputCls} value={basics.budget}
                  onChange={(e) => setBasics((b) => ({ ...b, budget: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Bağlı booking (opsiyonel)</label>
                <select className={inputCls} value={basics.booking_id}
                  onChange={(e) => setBasics((b) => ({ ...b, booking_id: e.target.value }))}>
                  <option value="">— Yok —</option>
                  {bookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.client_name}{b.event_date ? ` — ${new Date(b.event_date).toLocaleDateString("tr-TR")}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </>
        )}

        {WIZARD_CATEGORIES.includes(step as ChecklistCategory) && (() => {
          const cat = step as ChecklistCategory;
          const hint = CATEGORY_HINT[cat];
          const d = decisions[cat] ?? { included: true };
          return (
            <>
              <p className="text-sm font-medium text-foreground mb-1">{CATEGORY_LABELS[cat]}</p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={d.included}
                  onChange={(e) => updateDecision(cat, { included: e.target.checked })}
                  className="w-4 h-4 rounded border-border" />
                <span className="text-sm text-foreground">{hint?.question ?? "Bu kategori bu etkinlikte var mı?"}</span>
              </label>
              {d.included && (
                <div className="space-y-3 pt-1">
                  {hint?.vendorLabel && (
                    <div>
                      <label className={labelCls}>{hint.vendorLabel}</label>
                      <input className={inputCls} value={d.vendor ?? ""}
                        onChange={(e) => updateDecision(cat, { vendor: e.target.value })} />
                    </div>
                  )}
                  <div>
                    <label className={labelCls}>Sorumlu (isim/e-posta)</label>
                    <input className={inputCls} value={d.assignee ?? ""}
                      onChange={(e) => updateDecision(cat, { assignee: e.target.value })} placeholder="Ayşe Yılmaz" />
                  </div>
                  <div>
                    <label className={labelCls}>Not</label>
                    <textarea className={`${inputCls} resize-none`} rows={2} value={d.note ?? ""}
                      onChange={(e) => updateDecision(cat, { note: e.target.value })} />
                  </div>
                </div>
              )}
            </>
          );
        })()}

        {step === "review" && (
          <>
            <p className="text-sm font-medium text-foreground mb-1">Özet & Onay</p>
            <div className="space-y-2 text-sm">
              <p className="text-foreground font-medium">{basics.client_name || "—"}</p>
              <p className="text-muted-foreground">
                {basics.event_type || "Etkinlik türü belirtilmedi"}
                {basics.event_date && ` · ${new Date(basics.event_date).toLocaleDateString("tr-TR")}`}
                {basics.venue_name && ` · ${basics.venue_name}`}
              </p>
              <div className="border-t border-border pt-3 space-y-1.5">
                {WIZARD_CATEGORIES.map((cat) => {
                  const d = decisions[cat];
                  if (!d?.included) return null;
                  return (
                    <div key={cat} className="flex justify-between gap-3">
                      <span className="text-foreground">{CATEGORY_LABELS[cat]}</span>
                      <span className="text-muted-foreground text-right">
                        {d.vendor || d.assignee ? [d.vendor, d.assignee].filter(Boolean).join(" · ") : "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <p className="text-xs text-muted-foreground pt-2">
              &quot;Planı Oluştur&quot; butonuna basınca checklist ve proje dosyası otomatik hazırlanır.
            </p>
          </>
        )}
      </div>

      <div className="flex justify-between">
        <button onClick={() => setStepIdx((i) => Math.max(0, i - 1))} disabled={stepIdx === 0}
          className="px-4 py-2 rounded-full border border-border text-sm text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors">
          ← Geri
        </button>
        {step === "review" ? (
          <button onClick={handleSubmit} disabled={submitting}
            className="px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
            {submitting ? "Oluşturuluyor…" : "Planı Oluştur"}
          </button>
        ) : (
          <button onClick={() => setStepIdx((i) => Math.min(steps.length - 1, i + 1))} disabled={!canGoNext}
            className="px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
            İleri →
          </button>
        )}
      </div>
    </div>
  );
}
