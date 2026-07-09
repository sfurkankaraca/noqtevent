"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CATEGORY_LABELS, WIZARD_CATEGORIES, type ChecklistCategory, type CategoryDecision } from "@/lib/checklistTemplate";

const CATEGORY_HINT: Partial<Record<ChecklistCategory, string>> = {
  catering: "Catering firması",
  dekor: "Dekor/çiçek firması",
  muzik: "DJ / Sanatçı adı",
  fotograf: "Fotoğrafçı/videografer",
  gun_plani: "Koordinatör",
};

const EVENT_TYPES = [
  { label: "Düğün", emoji: "💍" },
  { label: "Kına", emoji: "🌙" },
  { label: "Nişan", emoji: "💐" },
  { label: "Mezuniyet", emoji: "🎓" },
  { label: "Kurumsal Etkinlik", emoji: "🏢" },
  { label: "Doğum Günü", emoji: "🎂" },
  { label: "Diğer", emoji: "✨" },
];
const GUEST_RANGES = [
  { label: "0-50", value: "50" },
  { label: "50-100", value: "100" },
  { label: "100-200", value: "200" },
  { label: "200-400", value: "400" },
  { label: "400+", value: "500" },
];
const BUDGET_RANGES = [
  { label: "0-50.000₺", value: "50000" },
  { label: "50-150.000₺", value: "150000" },
  { label: "150-300.000₺", value: "300000" },
  { label: "300.000₺+", value: "500000" },
];

const CONCEPT_CATEGORY_LABELS: Record<string, string> = {
  cocktail: "Kokteyl & Karşılama",
  celebration: "Kutlama & Parti",
  traditional: "Geleneksel",
  "after-party": "After Party",
};

type Concept = {
  slug: string;
  name: string;
  emoji: string | null;
  category: string;
  description: string | null;
  atmosphere: string[] | null;
  musical_direction: string[] | null;
  energy_level: number | null;
  is_signature: boolean | null;
};

type Suggestion = { slug: string; name: string; reason: string };

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

// Organizatörün gerçek karar sırası: ne → ne zaman/kaç kişi → atmosfer → hizmetler → kayıt+onay
const STEPS = [
  { key: "type", label: "Ne?" },
  { key: "when", label: "Ne zaman?" },
  { key: "concept", label: "Atmosfer" },
  { key: "services", label: "Hizmetler" },
  { key: "client", label: "Onay" },
] as const;
type StepKey = (typeof STEPS)[number]["key"];

export default function EventWizard({
  bookings, concepts,
}: {
  bookings: { id: string; client_name: string; event_date: string | null }[];
  concepts: Concept[];
}) {
  const router = useRouter();
  const [stepIdx, setStepIdx] = useState(0);
  const [maxVisited, setMaxVisited] = useState(0);
  const [basics, setBasics] = useState<Basics>(EMPTY_BASICS);
  const [customType, setCustomType] = useState(false);
  const [selectedConcepts, setSelectedConcepts] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggesting, setSuggesting] = useState(false);
  const suggestAttempted = useRef(false);
  const [openNotes, setOpenNotes] = useState<Record<string, boolean>>({});
  const [decisions, setDecisions] = useState<Record<string, CategoryDecision>>(
    Object.fromEntries(WIZARD_CATEGORIES.map((c) => [c, { included: true }]))
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step: StepKey = STEPS[stepIdx].key;

  const goTo = (idx: number) => {
    setStepIdx(idx);
    setMaxVisited((m) => Math.max(m, idx));
  };

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-foreground/40";
  const labelCls = "text-xs text-muted-foreground mb-1.5 block";
  const chip = (active: boolean) =>
    `px-3 py-2 rounded-full text-sm border transition-colors ${
      active ? "bg-foreground text-background border-foreground" : "border-border text-foreground hover:bg-secondary"
    }`;

  const updateDecision = (cat: string, patch: Partial<CategoryDecision>) => {
    setDecisions((prev) => ({ ...prev, [cat]: { ...prev[cat], ...patch } }));
  };

  const toggleConcept = (slug: string) => {
    setSelectedConcepts((prev) => prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]);
  };

  const fetchSuggestions = async () => {
    setSuggesting(true);
    try {
      const res = await fetch("/api/event-projects/concept-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type: basics.event_type || null,
          guest_count: basics.guest_count ? Number(basics.guest_count) : null,
          budget: basics.budget ? Number(basics.budget) : null,
          venue_name: basics.venue_name || null,
          event_date: basics.event_date || null,
        }),
      });
      const json = await res.json();
      if (res.ok) setSuggestions(json.suggestions ?? []);
      // hata durumunda sessizce katalog-only moda düş
    } catch {
      // sessiz — katalog zaten görünüyor
    } finally {
      setSuggesting(false);
    }
  };

  // Konsept adımına girildiğinde AI önerileri otomatik yüklenir (bir kez)
  useEffect(() => {
    if (step === "concept" && !suggestAttempted.current && concepts.length > 0) {
      suggestAttempted.current = true;
      fetchSuggestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const selectType = (label: string) => {
    if (label === "Diğer") {
      setCustomType(true);
      setBasics((b) => ({ ...b, event_type: "" }));
      return;
    }
    setCustomType(false);
    setBasics((b) => ({ ...b, event_type: label }));
    // Tek seçimlik ekran — otomatik ilerle
    setTimeout(() => goTo(1), 250);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const conceptNames = selectedConcepts
        .map((slug) => concepts.find((c) => c.slug === slug)?.name)
        .filter(Boolean) as string[];
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
          decisions: {
            ...decisions,
            konsept: { slugs: selectedConcepts, names: conceptNames },
          },
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

  const suggestionFor = (slug: string) => suggestions.find((s) => s.slug === slug);
  const suggestedConcepts = suggestions
    .map((s) => concepts.find((c) => c.slug === s.slug))
    .filter(Boolean) as Concept[];
  const conceptCategories = [...new Set(concepts.map((c) => c.category))];

  const renderConceptCard = (c: Concept, highlight = false) => {
    const selected = selectedConcepts.includes(c.slug);
    const suggestion = suggestionFor(c.slug);
    return (
      <button key={c.slug} onClick={() => toggleConcept(c.slug)}
        className={`text-left rounded-xl border p-3 space-y-1.5 transition-colors ${
          selected ? "border-foreground bg-foreground/5" :
          highlight ? "border-amber-400 bg-amber-50/50" : "border-border hover:bg-secondary/30"
        }`}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">
            {c.emoji} {c.name}
            {c.is_signature && <span className="ml-1 text-[10px] text-amber-600">★</span>}
          </p>
          {selected && <span className="text-xs text-foreground">✓</span>}
        </div>
        {highlight && suggestion && (
          <p className="text-[11px] text-amber-800">{suggestion.reason}</p>
        )}
        {!highlight && c.atmosphere && c.atmosphere.length > 0 && (
          <p className="text-[11px] text-muted-foreground">{c.atmosphere.join(" · ")}</p>
        )}
        {c.energy_level !== null && (
          <div className="flex items-center gap-1">
            <div className="h-1 flex-1 rounded-full bg-secondary overflow-hidden">
              <div className="h-full bg-foreground/60" style={{ width: `${(c.energy_level / 10) * 100}%` }} />
            </div>
            <span className="text-[10px] text-muted-foreground">enerji {c.energy_level}/10</span>
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="max-w-3xl space-y-5">
      {/* Adım göstergesi — soru odaklı pill'ler */}
      <div className="flex items-center gap-2 flex-wrap">
        {STEPS.map((s, i) => (
          <button key={s.key} onClick={() => i <= maxVisited && setStepIdx(i)}
            disabled={i > maxVisited}
            className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full transition-colors ${
              i === stepIdx ? "bg-foreground text-background font-medium" :
              i <= maxVisited ? "bg-secondary text-foreground cursor-pointer hover:bg-secondary/70" :
              "text-muted-foreground"
            }`}>
            <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center ${
              i === stepIdx ? "bg-background text-foreground" : i < stepIdx ? "bg-foreground text-background" : "border border-border"
            }`}>
              {i < stepIdx ? "✓" : i + 1}
            </span>
            {s.label}
          </button>
        ))}
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}

      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        {/* 1 — Ne planlıyoruz? */}
        {step === "type" && (
          <>
            <p className="text-lg font-semibold text-foreground">Ne planlıyoruz?</p>
            <p className="text-xs text-muted-foreground -mt-2">Seçince otomatik devam eder.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {EVENT_TYPES.map((t) => {
                const active = t.label === "Diğer" ? customType : basics.event_type === t.label;
                return (
                  <button key={t.label} onClick={() => selectType(t.label)}
                    className={`rounded-2xl border p-4 text-center space-y-1.5 transition-all ${
                      active ? "border-foreground bg-foreground/5 scale-[1.02]" : "border-border hover:bg-secondary/30"
                    }`}>
                    <p className="text-2xl">{t.emoji}</p>
                    <p className="text-sm font-medium text-foreground">{t.label}</p>
                  </button>
                );
              })}
            </div>
            {customType && (
              <input className={inputCls} autoFocus value={basics.event_type}
                onChange={(e) => setBasics((b) => ({ ...b, event_type: e.target.value }))}
                placeholder="Etkinlik türünü yazın…" />
            )}
          </>
        )}

        {/* 2 — Ne zaman, kaç kişi? */}
        {step === "when" && (
          <>
            <p className="text-lg font-semibold text-foreground">Ne zaman, kaç kişi?</p>
            <div className="grid grid-cols-2 gap-3">
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
            </div>
            <div>
              <label className={labelCls}>Misafir sayısı</label>
              <div className="flex flex-wrap gap-2">
                {GUEST_RANGES.map((g) => (
                  <button key={g.value} type="button" className={chip(basics.guest_count === g.value)}
                    onClick={() => setBasics((b) => ({ ...b, guest_count: g.value }))}>
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelCls}>Bütçe</label>
              <div className="flex flex-wrap gap-2">
                {BUDGET_RANGES.map((bud) => (
                  <button key={bud.value} type="button" className={chip(basics.budget === bud.value)}
                    onClick={() => setBasics((b) => ({ ...b, budget: bud.value }))}>
                    {bud.label}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Hepsi opsiyonel — sonradan değiştirilebilir.</p>
          </>
        )}

        {/* 3 — Atmosfer / Konsept */}
        {step === "concept" && (
          <>
            <p className="text-lg font-semibold text-foreground">Nasıl bir atmosfer?</p>
            <p className="text-xs text-muted-foreground -mt-2">
              Birden fazla seçebilirsiniz — örn. karşılama için bir, parti için bir konsept.
            </p>

            {suggesting && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/20 rounded-xl px-4 py-3">
                <div className="w-3.5 h-3.5 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
                AI, etkinliğinize en uygun konseptleri seçiyor…
              </div>
            )}

            {suggestedConcepts.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-amber-700 uppercase tracking-wide">✨ Size özel öneriler</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {suggestedConcepts.map((c) => renderConceptCard(c, true))}
                </div>
              </div>
            )}

            {concepts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Konsept kataloğu boş — bu adımı atlayabilirsiniz. (Konseptler admin panelindeki Konseptler bölümünden eklenir.)
              </p>
            ) : (
              conceptCategories.map((cat) => {
                const catConcepts = concepts.filter((c) => c.category === cat && !suggestionFor(c.slug));
                if (catConcepts.length === 0) return null;
                return (
                  <div key={cat} className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {CONCEPT_CATEGORY_LABELS[cat] ?? cat}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {catConcepts.map((c) => renderConceptCard(c))}
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {/* 4 — Hizmetler & görev dağılımı (mekan dahil) */}
        {step === "services" && (
          <>
            <p className="text-lg font-semibold text-foreground">Nerede, hangi hizmetler, kim sorumlu?</p>
            <p className="text-xs text-muted-foreground -mt-2">
              Bu etkinlikte olmayanları kapatın; olanlara firma ve sorumlu girin — checklist buna göre oluşur.
            </p>
            <div className="space-y-2">
              {WIZARD_CATEGORIES.map((cat) => {
                const d = decisions[cat] ?? { included: true };
                const vendorLabel = CATEGORY_HINT[cat];
                return (
                  <div key={cat} className={`rounded-xl border p-3 space-y-2 transition-colors ${d.included ? "border-border" : "border-border/50 opacity-60"}`}>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={d.included}
                        onChange={(e) => updateDecision(cat, { included: e.target.checked })}
                        className="w-4 h-4 rounded border-border flex-shrink-0" />
                      <p className="text-sm font-medium text-foreground flex-1">{CATEGORY_LABELS[cat]}</p>
                      {d.included && (
                        <button onClick={() => setOpenNotes((p) => ({ ...p, [cat]: !p[cat] }))}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
                          {openNotes[cat] ? "− not" : "+ not"}
                        </button>
                      )}
                    </div>
                    {/* Mekan kartı: mekan bilgileri buraya gömülü */}
                    {cat === "mekan" && d.included && (
                      <div className="grid grid-cols-2 gap-2 pl-7">
                        <input className={`${inputCls} py-2 text-xs`} value={basics.venue_name}
                          onChange={(e) => setBasics((b) => ({ ...b, venue_name: e.target.value }))}
                          placeholder="Mekan adı" />
                        <input className={`${inputCls} py-2 text-xs`} value={basics.venue_city}
                          onChange={(e) => setBasics((b) => ({ ...b, venue_city: e.target.value }))}
                          placeholder="Şehir" />
                        <input className={`${inputCls} py-2 text-xs col-span-2`} value={basics.venue_address}
                          onChange={(e) => setBasics((b) => ({ ...b, venue_address: e.target.value }))}
                          placeholder="Adres (opsiyonel)" />
                      </div>
                    )}
                    {d.included && (
                      <div className="flex gap-2 pl-7">
                        {vendorLabel && (
                          <input className={`${inputCls} py-2 text-xs`} value={d.vendor ?? ""}
                            onChange={(e) => updateDecision(cat, { vendor: e.target.value })}
                            placeholder={vendorLabel} />
                        )}
                        <input className={`${inputCls} py-2 text-xs`} value={d.assignee ?? ""}
                          onChange={(e) => updateDecision(cat, { assignee: e.target.value })}
                          placeholder="Sorumlu (isim/e-posta)" />
                      </div>
                    )}
                    {d.included && openNotes[cat] && (
                      <div className="pl-7">
                        <textarea className={`${inputCls} resize-none text-xs`} rows={2} value={d.note ?? ""}
                          onChange={(e) => updateDecision(cat, { note: e.target.value })}
                          placeholder="Not…" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* 5 — Müşteri bilgisi + özet + onay */}
        {step === "client" && (
          <>
            <p className="text-lg font-semibold text-foreground">Kimin için? Son bir bakış.</p>
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
              <div className="col-span-2">
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

            <div className="border-t border-border pt-4 space-y-2 text-sm">
              <p className="text-muted-foreground">
                {basics.event_type || "Etkinlik türü belirtilmedi"}
                {basics.event_date && ` · ${new Date(basics.event_date).toLocaleDateString("tr-TR")}`}
                {basics.venue_name && ` · ${basics.venue_name}`}
                {basics.guest_count && ` · ~${basics.guest_count} misafir`}
              </p>
              {selectedConcepts.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedConcepts.map((slug) => {
                    const c = concepts.find((x) => x.slug === slug);
                    return c ? (
                      <span key={slug} className="text-xs px-2.5 py-1 rounded-full bg-secondary text-foreground">
                        {c.emoji} {c.name}
                      </span>
                    ) : null;
                  })}
                </div>
              )}
              <div className="space-y-1">
                {WIZARD_CATEGORIES.map((cat) => {
                  const d = decisions[cat];
                  if (!d?.included) return null;
                  return (
                    <div key={cat} className="flex justify-between gap-3 text-xs">
                      <span className="text-foreground">{CATEGORY_LABELS[cat]}</span>
                      <span className="text-muted-foreground text-right">
                        {d.vendor || d.assignee ? [d.vendor, d.assignee].filter(Boolean).join(" · ") : "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground pt-1">
                &quot;Planı Oluştur&quot; ile son tarihli checklist ve proje dosyası hazırlanır; gün planı ve AI içerikleri detay sayfasından üretilir.
              </p>
            </div>
          </>
        )}
      </div>

      <div className="flex justify-between items-center">
        <button onClick={() => setStepIdx((i) => Math.max(0, i - 1))} disabled={stepIdx === 0}
          className="px-4 py-2 rounded-full border border-border text-sm text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors">
          ← Geri
        </button>
        {step === "client" ? (
          <div className="flex items-center gap-3">
            {!basics.client_name.trim() && (
              <p className="text-xs text-muted-foreground">Müşteri adı gerekli</p>
            )}
            <button onClick={handleSubmit} disabled={submitting || !basics.client_name.trim()}
              className="px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
              {submitting ? "Oluşturuluyor…" : "Planı Oluştur"}
            </button>
          </div>
        ) : (
          <button onClick={() => goTo(Math.min(STEPS.length - 1, stepIdx + 1))}
            className="px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity">
            İleri →
          </button>
        )}
      </div>
    </div>
  );
}
