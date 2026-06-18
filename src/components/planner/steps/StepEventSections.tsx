"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { type PlannerData, MUSIC_CONCEPTS, type EventSections } from "../PlannerStore";

type Props = {
  data: PlannerData;
  update: (partial: Partial<PlannerData>) => void;
  onNext: () => void;
  conceptCovers?: Record<string, string>;
};

// ─── RICH CONCEPT CARD ────────────────────────────────────────────────────────

function ConceptCard({
  concept,
  selected,
  onSelect,
  coverUrl,
}: {
  concept: (typeof MUSIC_CONCEPTS)[0];
  selected: boolean;
  onSelect: () => void;
  coverUrl?: string;
}) {
  const textColor = concept.dark ? "text-white" : "text-foreground";
  const mutedColor = concept.dark ? "text-white/65" : "text-foreground/60";
  const tagBg = concept.dark ? "bg-white/15 text-white/75" : "bg-black/8 text-foreground/65";

  return (
    <button
      onClick={onSelect}
      className={`relative flex flex-col text-left rounded-2xl overflow-hidden border-2 transition-all duration-200 ${
        selected
          ? "border-foreground shadow-lg scale-[1.01]"
          : "border-transparent hover:border-foreground/25"
      } ${concept.color}`}
    >
      {/* Cover photo */}
      {coverUrl && (
        <div className="relative h-40 w-full overflow-hidden flex-shrink-0">
          <Image
            src={coverUrl}
            alt={concept.name}
            fill
            className="object-cover"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
          {/* Signature badge on photo */}
          {concept.signature && (
            <span className="absolute top-2.5 left-2.5 text-[10px] font-semibold tracking-wider bg-white/90 text-foreground px-2 py-0.5 rounded-full uppercase">
              NOQT İmzası
            </span>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-3 flex-1">
        {/* Header */}
        <div className="flex items-start gap-2">
          <span className="text-2xl leading-none mt-0.5">{concept.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className={`text-sm font-semibold leading-tight ${textColor}`}>
                {concept.name}
              </p>
              {concept.signature && !coverUrl && (
                <span className={`text-[9px] font-semibold tracking-wider px-1.5 py-0.5 rounded-full ${
                  concept.dark ? "bg-white/25 text-white" : "bg-foreground/15 text-foreground"
                }`}>
                  NOQT
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <p className={`text-xs leading-relaxed ${mutedColor}`}>
          {concept.description}
        </p>

        {/* Musical direction */}
        <div className="flex flex-wrap gap-1">
          {concept.musicalDirection.slice(0, 3).map((d) => (
            <span key={d} className={`text-[10px] px-2 py-0.5 rounded-full ${tagBg}`}>
              {d}
            </span>
          ))}
        </div>

        {/* Energy bar */}
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-medium ${mutedColor}`}>Enerji</span>
          <div className="flex gap-0.5">
            {Array.from({ length: 10 }, (_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all ${
                  i < concept.energyLevel
                    ? concept.dark
                      ? "bg-white/80 w-2"
                      : "bg-foreground/55 w-2"
                    : concept.dark
                    ? "bg-white/15 w-1.5"
                    : "bg-foreground/12 w-1.5"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Atmosphere tags */}
        <div className="flex flex-wrap gap-1">
          {concept.atmosphere.map((a) => (
            <span key={a} className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
              concept.dark
                ? "border-white/20 text-white/60"
                : "border-foreground/15 text-foreground/55"
            }`}>
              {a}
            </span>
          ))}
        </div>
      </div>

      {/* Selected checkmark */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center shadow-md"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}

// ─── TIME PICKER ──────────────────────────────────────────────────────────────

function TimePicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-4">
      <p className="text-xs text-muted-foreground tracking-wide uppercase font-medium">{label}</p>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-4 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-foreground/40 transition-colors"
      />
    </div>
  );
}

// ─── SUB-STEPS ────────────────────────────────────────────────────────────────

const SUB_STEPS = [
  { id: "karsilama", label: "Karşılama", emoji: "🥂" },
  { id: "anaKutlama", label: "Ana Kutlama", emoji: "🎉" },
  { id: "afterParti", label: "After Parti", emoji: "🌙" },
];

// ─── PANELS ──────────────────────────────────────────────────────────────────

function KarsilamaPanel({
  sections, onChange, coverMap, onAdvance,
}: {
  sections: EventSections;
  onChange: (s: EventSections) => void;
  coverMap: Record<string, string>;
  onAdvance: () => void;
}) {
  const concepts = MUSIC_CONCEPTS.filter((c) => c.category === "cocktail");
  const selected = sections.karsilama.conceptIds;
  const advancedRef = useRef(false);

  const selectConcept = (id: string) => {
    // single select: if already selected deselect, else pick only this
    const next = selected.includes(id) ? [] : [id];
    onChange({ ...sections, karsilama: { ...sections.karsilama, conceptIds: next } });
  };

  // auto-advance 700ms after first selection
  useEffect(() => {
    if (selected.length > 0 && !advancedRef.current) {
      advancedRef.current = true;
      const t = setTimeout(onAdvance, 700);
      return () => clearTimeout(t);
    }
  }, [selected, onAdvance]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Misafirlerinizi nasıl karşılamak istersiniz? Bir atmosfer seçin.
        </p>
        {sections.karsilama.startTime && (
          <span className="text-xs text-muted-foreground flex-shrink-0 ml-4">
            {sections.karsilama.startTime}
          </span>
        )}
      </div>

      <TimePicker
        label="Başlangıç saati"
        value={sections.karsilama.startTime}
        onChange={(v) => onChange({ ...sections, karsilama: { ...sections.karsilama, startTime: v } })}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {concepts.map((c) => (
          <ConceptCard
            key={c.id}
            concept={c}
            selected={selected.includes(c.id)}
            onSelect={() => selectConcept(c.id)}
            coverUrl={coverMap[c.id]}
          />
        ))}
      </div>

      {selected.length > 0 && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-muted-foreground text-center"
        >
          Ana kutlamaya geçiliyor…
        </motion.p>
      )}
    </div>
  );
}

function AnaKutlamaPanel({
  sections, onChange, coverMap, onAdvance,
}: {
  sections: EventSections;
  onChange: (s: EventSections) => void;
  coverMap: Record<string, string>;
  onAdvance: () => void;
}) {
  const style = sections.anaKutlama.style;
  const concepts = MUSIC_CONCEPTS.filter((c) =>
    style === "traditional" ? c.category === "traditional" : c.category === "celebration"
  );
  const selected = sections.anaKutlama.conceptIds;
  const advancedRef = useRef(false);

  const setStyle = (s: "modern" | "traditional") => {
    advancedRef.current = false;
    onChange({ ...sections, anaKutlama: { ...sections.anaKutlama, style: s, conceptIds: [] } });
  };

  const selectConcept = (id: string) => {
    const next = selected.includes(id) ? [] : [id];
    onChange({ ...sections, anaKutlama: { ...sections.anaKutlama, conceptIds: next } });
  };

  useEffect(() => {
    if (selected.length > 0 && !advancedRef.current) {
      advancedRef.current = true;
      const t = setTimeout(onAdvance, 700);
      return () => clearTimeout(t);
    }
  }, [selected, onAdvance]);

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground leading-relaxed">
        Ana kutlamanın ruhunu belirleyin.
      </p>

      <TimePicker
        label="Başlangıç saati"
        value={sections.anaKutlama.startTime}
        onChange={(v) => onChange({ ...sections, anaKutlama: { ...sections.anaKutlama, startTime: v } })}
      />

      {/* Style picker */}
      <div className="flex gap-3">
        {(["modern", "traditional"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStyle(s)}
            className={`flex-1 py-3 rounded-2xl text-sm font-medium border-2 transition-all ${
              style === s
                ? "border-foreground bg-foreground text-background"
                : "border-border text-foreground hover:border-foreground/40"
            }`}
          >
            {s === "modern" ? "✨ Modern" : "🔥 Geleneksel"}
          </button>
        ))}
      </div>

      {style && (
        <AnimatePresence mode="wait">
          <motion.div
            key={style}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            <p className="text-xs text-muted-foreground tracking-wide uppercase font-medium">
              {style === "modern" ? "Modern Konseptler" : "Geleneksel Konseptler"}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {concepts.map((c) => (
                <ConceptCard
                  key={c.id}
                  concept={c}
                  selected={selected.includes(c.id)}
                  onSelect={() => selectConcept(c.id)}
                  coverUrl={coverMap[c.id]}
                />
              ))}
            </div>
            {selected.length > 0 && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-muted-foreground text-center"
              >
                After parti bölümüne geçiliyor…
              </motion.p>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

function AfterPartiPanel({
  sections, onChange, coverMap,
}: {
  sections: EventSections;
  onChange: (s: EventSections) => void;
  coverMap: Record<string, string>;
}) {
  const pref = sections.afterParti.musicPref;
  const concepts = MUSIC_CONCEPTS.filter((c) => c.category === "after-party");
  const selected = sections.afterParti.conceptIds;

  const selectConcept = (id: string) => {
    const next = selected.includes(id) ? [] : [id];
    onChange({ ...sections, afterParti: { ...sections.afterParti, conceptIds: next } });
  };

  const PREF_OPTIONS = [
    { id: "local" as const, label: "Yerli" },
    { id: "international" as const, label: "Yabancı" },
    { id: "mixed" as const, label: "Karışık" },
  ];

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground leading-relaxed">
        Gece nasıl kapansın?
      </p>

      <div>
        <p className="text-xs text-muted-foreground tracking-wide uppercase font-medium mb-2.5">
          Müzik tercihi
        </p>
        <div className="flex gap-2">
          {PREF_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() =>
                onChange({ ...sections, afterParti: { ...sections.afterParti, musicPref: opt.id } })
              }
              className={`flex-1 py-2.5 rounded-full text-xs font-medium border transition-all ${
                pref === opt.id
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-foreground hover:border-foreground/30"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {concepts.map((c) => (
          <ConceptCard
            key={c.id}
            concept={c}
            selected={selected.includes(c.id)}
            onSelect={() => selectConcept(c.id)}
            coverUrl={coverMap[c.id]}
          />
        ))}
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

const slideVariants = {
  enter: (d: number) => ({ opacity: 0, x: d > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0 },
  exit: (d: number) => ({ opacity: 0, x: d > 0 ? -40 : 40 }),
};

export default function StepEventSections({ data, update, onNext, conceptCovers = {} }: Props) {
  const [subStep, setSubStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const sections = data.eventSections;
  const setSection = (s: EventSections) => update({ eventSections: s });

  const advance = () => {
    setDirection(1);
    if (subStep < SUB_STEPS.length - 1) {
      setSubStep((s) => s + 1);
    } else {
      onNext();
    }
  };

  const goBack = () => {
    if (subStep > 0) {
      setDirection(-1);
      setSubStep((s) => s - 1);
    }
  };

  const isLast = subStep === SUB_STEPS.length - 1;

  // Has user selected something in current sub-step?
  const hasSelection =
    subStep === 0
      ? sections.karsilama.conceptIds.length > 0
      : subStep === 1
      ? sections.anaKutlama.conceptIds.length > 0
      : sections.afterParti.conceptIds.length > 0;

  return (
    <div className="space-y-6">
      {/* Sub-step breadcrumb */}
      <div className="flex items-center gap-1">
        {SUB_STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-1">
            <button
              onClick={() => {
                if (i < subStep) {
                  setDirection(i > subStep ? 1 : -1);
                  setSubStep(i);
                }
              }}
              disabled={i > subStep}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                i === subStep
                  ? "bg-foreground text-background"
                  : i < subStep
                  ? "bg-foreground/12 text-foreground cursor-pointer hover:bg-foreground/20"
                  : "text-muted-foreground/40 cursor-default"
              }`}
            >
              <span>{s.emoji}</span>
              <span>{s.label}</span>
            </button>
            {i < SUB_STEPS.length - 1 && (
              <span className={`text-xs ${i < subStep ? "text-foreground/30" : "text-muted-foreground/20"}`}>›</span>
            )}
          </div>
        ))}
      </div>

      {/* Panel */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={subStep}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.28, ease: "easeInOut" }}
        >
          {subStep === 0 && (
            <KarsilamaPanel
              sections={sections}
              onChange={setSection}
              coverMap={conceptCovers}
              onAdvance={advance}
            />
          )}
          {subStep === 1 && (
            <AnaKutlamaPanel
              sections={sections}
              onChange={setSection}
              coverMap={conceptCovers}
              onAdvance={advance}
            />
          )}
          {subStep === 2 && (
            <AfterPartiPanel
              sections={sections}
              onChange={setSection}
              coverMap={conceptCovers}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center gap-3 pt-2">
        {subStep > 0 && (
          <button
            onClick={goBack}
            className="px-5 py-2.5 rounded-full text-sm text-muted-foreground border border-border hover:border-foreground/40 transition-colors"
          >
            ← Geri
          </button>
        )}
        <AnimatePresence>
          {(isLast || !hasSelection) && (
            <motion.button
              key="next-btn"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              onClick={advance}
              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
                hasSelection
                  ? "bg-foreground text-background hover:opacity-90"
                  : "bg-foreground/10 text-foreground/50 hover:bg-foreground/15"
              }`}
            >
              {isLast ? "Devam" : "Atla"}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
