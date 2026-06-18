"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type PlannerData, MUSIC_CONCEPTS, type EventSections } from "../PlannerStore";

type Props = {
  data: PlannerData;
  update: (partial: Partial<PlannerData>) => void;
  onNext: () => void;
};

// ─── COMPACT CONCEPT CARD ─────────────────────────────────────────────────────

function ConceptPill({
  concept,
  selected,
  onToggle,
}: {
  concept: (typeof MUSIC_CONCEPTS)[0];
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`relative flex flex-col gap-1.5 p-3 rounded-2xl border-2 text-left transition-all duration-150 ${
        selected ? "border-foreground" : "border-transparent"
      } ${concept.color}`}
    >
      {selected && (
        <span
          className={`absolute top-2 right-2 text-xs font-bold ${
            concept.dark ? "text-white" : "text-foreground"
          }`}
        >
          ✓
        </span>
      )}
      <span className="text-lg leading-none">{concept.emoji}</span>
      <p
        className={`text-xs font-semibold leading-tight ${
          concept.dark ? "text-white" : "text-foreground"
        }`}
      >
        {concept.name}
      </p>
      <div className="flex flex-wrap gap-1">
        {concept.atmosphere.slice(0, 2).map((a) => (
          <span
            key={a}
            className={`text-[9px] px-1.5 py-0.5 rounded-full ${
              concept.dark
                ? "bg-white/15 text-white/65"
                : "bg-black/6 text-foreground/55"
            }`}
          >
            {a}
          </span>
        ))}
      </div>
    </button>
  );
}

// ─── TIME PICKER ──────────────────────────────────────────────────────────────

function TimePicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground tracking-wide uppercase font-medium mb-2">
        {label}
      </p>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-foreground/40 transition-colors w-36"
      />
    </div>
  );
}

// ─── SUB-STEP PANELS ─────────────────────────────────────────────────────────

const SUB_STEPS = [
  { id: "karsilama", label: "Karşılama", emoji: "🥂" },
  { id: "anaKutlama", label: "Ana Kutlama", emoji: "🎉" },
  { id: "afterParti", label: "After Parti", emoji: "🌙" },
];

function KarsilamaPanel({
  sections,
  onChange,
}: {
  sections: EventSections;
  onChange: (s: EventSections) => void;
}) {
  const concepts = MUSIC_CONCEPTS.filter((c) => c.category === "cocktail");

  const toggleConcept = (id: string) => {
    const prev = sections.karsilama.conceptIds;
    const next = prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id];
    onChange({ ...sections, karsilama: { ...sections.karsilama, conceptIds: next } });
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground leading-relaxed">
        Misafirlerinizi nasıl karşılamak istiyorsunuz? Atmosferi seçin, biz müziği ayarlayalım.
      </p>

      <TimePicker
        label="Başlangıç saati"
        value={sections.karsilama.startTime}
        onChange={(v) =>
          onChange({ ...sections, karsilama: { ...sections.karsilama, startTime: v } })
        }
      />

      <div>
        <p className="text-xs text-muted-foreground tracking-wide uppercase font-medium mb-3">
          Karşılama Konsepti
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {concepts.map((c) => (
            <ConceptPill
              key={c.id}
              concept={c}
              selected={sections.karsilama.conceptIds.includes(c.id)}
              onToggle={() => toggleConcept(c.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function AnaKutlamaPanel({
  sections,
  onChange,
}: {
  sections: EventSections;
  onChange: (s: EventSections) => void;
}) {
  const style = sections.anaKutlama.style;
  const concepts = MUSIC_CONCEPTS.filter((c) =>
    style === "traditional" ? c.category === "traditional" : c.category === "celebration"
  );

  const toggleConcept = (id: string) => {
    const prev = sections.anaKutlama.conceptIds;
    const next = prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id];
    onChange({ ...sections, anaKutlama: { ...sections.anaKutlama, conceptIds: next } });
  };

  const setStyle = (s: "modern" | "traditional") => {
    onChange({ ...sections, anaKutlama: { ...sections.anaKutlama, style: s, conceptIds: [] } });
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground leading-relaxed">
        Ana kutlama bölümünüzün ruhunu belirleyin.
      </p>

      <div>
        <p className="text-xs text-muted-foreground tracking-wide uppercase font-medium mb-2.5">
          Tarz
        </p>
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
      </div>

      <TimePicker
        label="Başlangıç saati"
        value={sections.anaKutlama.startTime}
        onChange={(v) =>
          onChange({ ...sections, anaKutlama: { ...sections.anaKutlama, startTime: v } })
        }
      />

      {style && (
        <div>
          <p className="text-xs text-muted-foreground tracking-wide uppercase font-medium mb-3">
            {style === "modern" ? "Modern Konseptler" : "Geleneksel Konseptler"}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {concepts.map((c) => (
              <ConceptPill
                key={c.id}
                concept={c}
                selected={sections.anaKutlama.conceptIds.includes(c.id)}
                onToggle={() => toggleConcept(c.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AfterPartiPanel({
  sections,
  onChange,
}: {
  sections: EventSections;
  onChange: (s: EventSections) => void;
}) {
  const pref = sections.afterParti.musicPref;
  const concepts = MUSIC_CONCEPTS.filter((c) => c.category === "after-party");

  const toggleConcept = (id: string) => {
    const prev = sections.afterParti.conceptIds;
    const next = prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id];
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
                onChange({
                  ...sections,
                  afterParti: { ...sections.afterParti, musicPref: opt.id, conceptIds: [] },
                })
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

      <div>
        <p className="text-xs text-muted-foreground tracking-wide uppercase font-medium mb-3">
          After Parti Konsepti
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {concepts.map((c) => (
            <ConceptPill
              key={c.id}
              concept={c}
              selected={sections.afterParti.conceptIds.includes(c.id)}
              onToggle={() => toggleConcept(c.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const variants = {
  enter: (d: number) => ({ opacity: 0, x: d > 0 ? 32 : -32 }),
  center: { opacity: 1, x: 0 },
  exit: (d: number) => ({ opacity: 0, x: d > 0 ? -32 : 32 }),
};

export default function StepEventSections({ data, update, onNext }: Props) {
  const [subStep, setSubStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const sections = data.eventSections;

  const setSection = (s: EventSections) => update({ eventSections: s });

  const goNext = () => {
    if (subStep < SUB_STEPS.length - 1) {
      setDirection(1);
      setSubStep((s) => s + 1);
    } else {
      onNext();
    }
  };

  const goPrev = () => {
    if (subStep > 0) {
      setDirection(-1);
      setSubStep((s) => s - 1);
    }
  };

  const isLast = subStep === SUB_STEPS.length - 1;

  return (
    <div className="space-y-6">
      {/* Sub-step indicator */}
      <div className="flex gap-2">
        {SUB_STEPS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => {
              setDirection(i > subStep ? 1 : -1);
              setSubStep(i);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              i === subStep
                ? "bg-foreground text-background border-foreground"
                : i < subStep
                ? "bg-foreground/10 text-foreground border-transparent"
                : "border-border text-muted-foreground"
            }`}
          >
            <span>{s.emoji}</span>
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      {/* Animated panel */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={subStep}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.25, ease: "easeInOut" }}
        >
          {subStep === 0 && (
            <KarsilamaPanel sections={sections} onChange={setSection} />
          )}
          {subStep === 1 && (
            <AnaKutlamaPanel sections={sections} onChange={setSection} />
          )}
          {subStep === 2 && (
            <AfterPartiPanel sections={sections} onChange={setSection} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center gap-3 pt-1">
        {subStep > 0 && (
          <button
            onClick={goPrev}
            className="px-5 py-2.5 rounded-full text-sm text-muted-foreground border border-border hover:border-foreground/40 transition-colors"
          >
            ← Geri
          </button>
        )}
        <button
          onClick={goNext}
          className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
        >
          {isLast ? "Devam" : "İleri"}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M3 8h10M9 4l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
