"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { trackEvent } from "@/lib/analytics";
import { EVENT_TYPES } from "@/components/planner/PlannerStore";
import {
  GUEST_RANGES,
  CITIES,
  VENUE_STATUS,
  BUDGET_LEVELS,
  type ConciergeInput,
} from "@/lib/concierge";
import { runConcierge, submitConciergeInquiry, type ConciergeResult } from "./actions";

const TOTAL_STEPS = 5;

const STEP_TITLES = [
  "Ne planlıyorsun?",
  "Birkaç hızlı detay",
  "Hayalindeki atmosferi anlat",
  "Sana özel deneyim önerin",
  "Taslağını bize gönder",
];

const PERFORMER_TYPE_LABELS: Record<string, string> = {
  dj: "DJ", artist: "Solo Sanatçı", trio: "Trio", grup: "Grup",
  dance: "Dans Ekibi", bando: "Bando", orkestra: "Orkestra",
  host: "Sunucu / MC", moderator: "Moderatör",
};

type MonthOption = { id: string; label: string };

function ChipGroup<T extends { id: string; label: string }>({
  label,
  options,
  value,
  onSelect,
}: {
  label: string;
  options: readonly T[];
  value: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-2.5">
      <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const selected = value === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onSelect(opt.id)}
              className={`px-4 py-2.5 rounded-full border-2 text-sm transition-all duration-200 hover:border-foreground/40 ${
                selected
                  ? "border-foreground bg-foreground text-background font-medium"
                  : "border-border bg-card text-foreground"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function ConciergeWizard({ monthOptions }: { monthOptions: MonthOption[] }) {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [input, setInput] = useState<ConciergeInput>({
    eventType: "",
    month: "",
    guestRange: "",
    city: "",
    venueStatus: "",
    budgetLevel: "",
    freeText: "",
  });
  const [result, setResult] = useState<ConciergeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [contact, setContact] = useState({ name: "", surname: "", email: "", phone: "", eventDate: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [availabilityWarning, setAvailabilityWarning] = useState(false);

  // "start" bir kez, sayfa açılışında
  useEffect(() => {
    trackEvent("ai_concierge_start", {});
  }, []);

  // Terk etme sinyali: sayfa kapanırken gönderilmemişse — best effort
  const stateRef = useRef({ step, submitted });
  stateRef.current = { step, submitted };
  useEffect(() => {
    const onPageHide = () => {
      if (!stateRef.current.submitted) {
        trackEvent("ai_concierge_abandon", { step: stateRef.current.step });
      }
    };
    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, []);

  const update = (partial: Partial<ConciergeInput>) =>
    setInput((d) => ({ ...d, ...partial }));

  const goTo = (target: number) => {
    setDirection(target > step ? 1 : -1);
    setStep(target);
  };

  const detailsComplete =
    input.month && input.guestRange && input.city && input.venueStatus && input.budgetLevel;

  const generate = async () => {
    if (input.freeText.trim().length < 10) return;
    setLoading(true);
    setError(null);
    try {
      const res = await runConcierge(input);
      setResult(res);
      trackEvent("ai_concierge_result", {
        eventType: input.eventType,
        aiUsed: res.aiUsed,
        conceptCount: res.concepts.length,
        artistCount: res.artists.length,
      });
      goTo(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu, tekrar dene.");
    } finally {
      setLoading(false);
    }
  };

  const contactValid = contact.name && contact.surname && contact.email && contact.phone;

  const submit = async () => {
    if (!contactValid || !result) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await submitConciergeInquiry({ input, result, ...contact });
      setAvailabilityWarning(res.availabilityWarning);
      trackEvent("ai_concierge_submit", { eventType: input.eventType, aiUsed: result.aiUsed });
      trackEvent("lead_submit", { source: "ai_concierge" });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu, tekrar dene.");
    } finally {
      setSubmitting(false);
    }
  };

  const variants = {
    enter: (d: number) => ({ opacity: 0, x: d > 0 ? 48 : -48 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: d > 0 ? -48 : 48 }),
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-[oklch(0.975_0.006_80)]">
        <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
          <div className="text-5xl mb-6">✨</div>
          <h2
            className="text-3xl text-foreground"
            style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
          >
            Harika, {contact.name}!
          </h2>
          <p className="text-muted-foreground mt-4 leading-relaxed">
            Deneyim taslağın bize ulaştı. En kısa sürede seninle iletişime geçip
            detayları birlikte netleştireceğiz.
          </p>
          {availabilityWarning && (
            <div className="mt-5 bg-[oklch(0.94_0.03_60)] border border-[oklch(0.85_0.06_60)] rounded-2xl px-5 py-4 text-sm text-[oklch(0.4_0.05_60)] leading-relaxed">
              Belirttiğin tarihte müsaitliğimiz sınırlı görünüyor. Sana en kısa sürede
              ulaşıp alternatif seçenekleri birlikte değerlendireceğiz.
            </div>
          )}
          <p className="text-sm text-muted-foreground mt-4">{contact.email} adresine bir özet gönderdik.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[oklch(0.975_0.006_80)] flex flex-col">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-border">
        <motion.div
          className="h-full bg-foreground"
          animate={{ width: `${((step - 1) / (TOTAL_STEPS - 1)) * 100}%` }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        />
      </div>

      {/* Header */}
      <div className="pt-8 pb-6 px-6 lg:px-8 flex items-center justify-between max-w-3xl mx-auto w-full">
        <button
          onClick={() => goTo(Math.max(step - 1, 1))}
          className={`text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 ${
            step === 1 || loading ? "invisible" : ""
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M13 8H3M7 12l-4-4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Geri
        </button>
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted-foreground tracking-[0.2em]">
            {step} / {TOTAL_STEPS}
          </span>
          <Link
            href="/planla"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4 decoration-border"
          >
            Klasik planlayıcı
          </Link>
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-6 lg:px-8 pb-12">
        <motion.p
          key={`label-${step}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-medium mb-4"
        >
          ✨ AI ile Planla
        </motion.p>

        <motion.h1
          key={`title-${step}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-3xl lg:text-4xl text-foreground mb-10"
          style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
        >
          {STEP_TITLES[step - 1]}
        </motion.h1>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="flex-1"
          >
            {/* ── 1: Etkinlik türü ── */}
            {step === 1 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {EVENT_TYPES.map((type) => {
                  const selected = input.eventType === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => {
                        update({ eventType: type.id });
                        setTimeout(() => goTo(2), 200);
                      }}
                      className={`flex flex-col items-start gap-3 p-5 rounded-2xl border-2 text-left transition-all duration-200 hover:border-foreground/40 ${
                        selected
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-card text-foreground"
                      }`}
                    >
                      <span className="text-2xl">{type.emoji}</span>
                      <span className="flex-1 text-sm font-medium leading-snug">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* ── 2: Detay chip'leri ── */}
            {step === 2 && (
              <div className="space-y-8 max-w-2xl">
                <ChipGroup label="Hangi ay?" options={monthOptions} value={input.month} onSelect={(id) => update({ month: id })} />
                <ChipGroup label="Kaç misafir?" options={GUEST_RANGES} value={input.guestRange} onSelect={(id) => update({ guestRange: id })} />
                <ChipGroup label="Nerede?" options={CITIES} value={input.city} onSelect={(id) => update({ city: id })} />
                <ChipGroup label="Mekan durumu" options={VENUE_STATUS} value={input.venueStatus} onSelect={(id) => update({ venueStatus: id })} />
                <ChipGroup label="Bütçe yaklaşımı" options={BUDGET_LEVELS} value={input.budgetLevel} onSelect={(id) => update({ budgetLevel: id })} />

                <button
                  onClick={() => detailsComplete && goTo(3)}
                  disabled={!detailsComplete}
                  className={`inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-medium tracking-wide transition-all ${
                    detailsComplete
                      ? "bg-foreground text-background hover:opacity-90"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  }`}
                >
                  Devam
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            )}

            {/* ── 3: Serbest metin + AI ── */}
            {step === 3 && (
              <div className="space-y-6 max-w-2xl">
                <p className="text-muted-foreground leading-relaxed">
                  Nasıl bir atmosfer ve deneyim hayal ediyorsun? Müzik zevkin, örnek aldığın
                  bir etkinlik, olmazsa olmazların… Ne kadar anlatırsan öneri o kadar isabetli olur.
                </p>
                <textarea
                  value={input.freeText}
                  onChange={(e) => update({ freeText: e.target.value.slice(0, 600) })}
                  placeholder="Örn: Gün batımında açık havada başlayan, kokteyl saatinde soft house çalan, gece ilerledikçe enerjisi yükselen bir düğün hayal ediyoruz…"
                  rows={6}
                  disabled={loading}
                  className="w-full px-5 py-4 rounded-2xl border border-border bg-card text-foreground text-sm leading-relaxed focus:outline-none focus:border-foreground/40 transition-colors resize-none"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{input.freeText.length} / 600</span>
                  {input.freeText.trim().length > 0 && input.freeText.trim().length < 10 && (
                    <span className="text-xs text-muted-foreground">Biraz daha detay ekle</span>
                  )}
                </div>

                {error && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
                )}

                <button
                  onClick={generate}
                  disabled={input.freeText.trim().length < 10 || loading}
                  className={`inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-medium tracking-wide transition-all ${
                    input.freeText.trim().length >= 10 && !loading
                      ? "bg-foreground text-background hover:opacity-90"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  }`}
                >
                  {loading ? (
                    <>
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                        className="inline-block"
                      >
                        ✨
                      </motion.span>
                      Deneyimin hazırlanıyor…
                    </>
                  ) : (
                    <>✨ Deneyimimi Oluştur</>
                  )}
                </button>
              </div>
            )}

            {/* ── 4: Sonuç ── */}
            {step === 4 && result && (
              <div className="space-y-6 max-w-2xl">
                {/* Kişisel anlatı */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-foreground text-background rounded-3xl px-6 py-7"
                >
                  <p className="text-[10px] tracking-[0.35em] uppercase text-background/50 mb-3">
                    NOQT · Sana Özel
                  </p>
                  <p
                    className="text-lg leading-relaxed"
                    style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
                  >
                    {result.narrative}
                  </p>
                </motion.div>

                {/* Konseptler */}
                {result.concepts.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-card border border-border rounded-2xl p-5"
                  >
                    <p className="text-xs text-muted-foreground tracking-[0.2em] uppercase font-medium mb-4">
                      Önerilen Konseptler
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {result.concepts.map((c) => (
                        <div key={c.id} className="relative aspect-[4/3] rounded-xl overflow-hidden">
                          {c.cover ? (
                            <Image src={c.cover} alt={c.name} fill className="object-cover" unoptimized />
                          ) : (
                            <div className={`w-full h-full ${c.color}`} />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                          <div className="absolute bottom-2 left-2.5 right-2.5">
                            <p className="text-[11px] font-medium text-white leading-tight">
                              {c.emoji} {c.name}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Sanatçılar */}
                {result.artists.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-card border border-border rounded-2xl p-5"
                  >
                    <p className="text-xs text-muted-foreground tracking-[0.2em] uppercase font-medium mb-4">
                      Önerilen Sanatçılar
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {result.artists.map((a) => {
                        const initials = a.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
                        return (
                          <Link
                            key={a.id}
                            href={`/sanatcilar/${a.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative aspect-[3/4] rounded-xl overflow-hidden group block"
                          >
                            {a.photo ? (
                              <Image
                                src={a.photo}
                                alt={a.name}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full bg-secondary flex items-center justify-center">
                                <span
                                  className="text-3xl font-light text-muted-foreground"
                                  style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)" }}
                                >
                                  {initials}
                                </span>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                            <div className="absolute bottom-2.5 left-2.5 right-2.5">
                              <p className="text-xs font-semibold text-white leading-tight">{a.name}</p>
                              {a.performerType && (
                                <p className="text-[10px] text-white/70 mt-0.5">
                                  {PERFORMER_TYPE_LABELS[a.performerType] ?? a.performerType}
                                </p>
                              )}
                            </div>
                            <span className="absolute top-2 right-2 text-[9px] px-2 py-0.5 rounded-full bg-white/90 text-black opacity-0 group-hover:opacity-100 transition-opacity">
                              Profil →
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* Tahmini bütçe */}
                {result.priceRangeText && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap"
                  >
                    <div>
                      <p className="text-xs text-muted-foreground tracking-[0.2em] uppercase font-medium">
                        Tahmini Sanatçı Bütçesi
                      </p>
                      <p className="text-xl font-semibold text-foreground mt-1 tabular-nums">
                        {result.priceRangeText}
                      </p>
                    </div>
                    <p className="text-[11px] text-muted-foreground max-w-[220px] leading-relaxed">
                      Tahmini aralıktır, bağlayıcı değildir. Net teklif, detayları
                      birlikte netleştirdikten sonra hazırlanır.
                    </p>
                  </motion.div>
                )}

                {/* Hizmet özeti */}
                {result.serviceLabels.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-card border border-border rounded-2xl p-5"
                  >
                    <p className="text-xs text-muted-foreground tracking-[0.2em] uppercase font-medium mb-3">
                      İstek Listesi
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {result.serviceLabels.map((label) => (
                        <span key={label} className="text-xs px-3 py-1.5 bg-secondary rounded-full text-foreground">
                          {label}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}

                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  onClick={() => goTo(5)}
                  className="inline-flex items-center gap-2 bg-foreground text-background px-7 py-3.5 rounded-full text-sm font-medium tracking-wide hover:opacity-90 transition-opacity"
                >
                  Teklif Al
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.button>
              </div>
            )}

            {/* ── 5: İletişim ── */}
            {step === 5 && (
              <div className="max-w-lg space-y-6">
                <div className="bg-[oklch(0.94_0.008_60)] rounded-2xl p-5 text-sm text-muted-foreground leading-relaxed">
                  Deneyim taslağın hazır. İletişim bilgilerini girerek bize ilet, en kısa
                  sürede ulaşalım.
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground tracking-wide">İsim</label>
                    <input
                      type="text"
                      value={contact.name}
                      onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))}
                      placeholder="Ayşe"
                      className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:border-foreground/40 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground tracking-wide">Soyisim</label>
                    <input
                      type="text"
                      value={contact.surname}
                      onChange={(e) => setContact((c) => ({ ...c, surname: e.target.value }))}
                      placeholder="Yılmaz"
                      className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:border-foreground/40 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground tracking-wide">E-posta</label>
                  <input
                    type="email"
                    value={contact.email}
                    onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
                    placeholder="ayse@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:border-foreground/40 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground tracking-wide">Telefon</label>
                  <input
                    type="tel"
                    value={contact.phone}
                    onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
                    placeholder="+90 5xx xxx xx xx"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:border-foreground/40 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground tracking-wide">
                    Etkinlik Tarihi <span className="opacity-60">(netleştiyse)</span>
                  </label>
                  <input
                    type="date"
                    value={contact.eventDate}
                    onChange={(e) => setContact((c) => ({ ...c, eventDate: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:border-foreground/40 transition-colors"
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
                )}

                <button
                  onClick={submit}
                  disabled={!contactValid || submitting}
                  className={`w-full py-4 rounded-full text-sm font-medium tracking-wide transition-all ${
                    contactValid && !submitting
                      ? "bg-foreground text-background hover:opacity-90"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  }`}
                >
                  {submitting ? "Gönderiliyor..." : "Deneyim Taslağımı Gönder"}
                </button>

                <p className="text-xs text-muted-foreground text-center">
                  Bilgilerin yalnızca seninle iletişim kurmak için kullanılır. Asla üçüncü
                  şahıslarla paylaşılmaz.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
