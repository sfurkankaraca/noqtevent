"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { type PlannerData, MUSIC_CONCEPTS, type MusicConcept, type EventSections } from "../PlannerStore";

type Props = {
  data: PlannerData;
  update: (partial: Partial<PlannerData>) => void;
  onNext: () => void;
  conceptCovers?: Record<string, string>;
  activeSlugs?: string[];
};

// ─── RECOMMENDATION LOGIC ─────────────────────────────────────────────────────

function fitScore(c: MusicConcept, eventType: string): number {
  const base =
    eventType === "wedding" ? c.weddingFit :
    eventType === "corporate" ? c.corporateFit :
    eventType === "cocktail" ? c.cocktailFit :
    eventType === "after-party" ? c.afterPartyFit :
    eventType === "private-party" ? (c.weddingFit + c.afterPartyFit) / 2 :
    eventType === "sunset" ? c.cocktailFit :
    (c.weddingFit + c.corporateFit) / 2;
  return base + (c.signature ? 0.5 : 0);
}

function getTop(concepts: MusicConcept[], eventType: string, n: number): string[] {
  return [...concepts]
    .sort((a, b) => fitScore(b, eventType) - fitScore(a, eventType))
    .slice(0, n)
    .map((c) => c.id);
}

function recommendReason(c: MusicConcept, eventType: string): string {
  if (c.signature) return "NOQT'un imza konsepti — en çok tercih edilen";
  const score = fitScore(c, eventType);
  if (score >= 9.5) return "Bu etkinlik tipi için en ideal atmosfer";
  if (score >= 8) return "Misafir profilinle çok uyumlu";
  if (score >= 7) return "Bu tür etkinliklerde sıkça tercih ediliyor";
  return "Senin için özel seçtik";
}

// ─── CONCEPT CARD ─────────────────────────────────────────────────────────────

function ConceptCard({
  concept,
  selected,
  onSelect,
  coverUrl,
  isRecommended,
  recommendText,
}: {
  concept: MusicConcept;
  selected: boolean;
  onSelect: () => void;
  coverUrl?: string;
  isRecommended?: boolean;
  recommendText?: string;
}) {
  const dark = concept.dark;
  const textColor = dark ? "text-white" : "text-foreground";
  const mutedColor = dark ? "text-white/60" : "text-foreground/55";
  const tagBg = dark ? "bg-white/12 text-white/70" : "bg-black/7 text-foreground/60";
  const borderColor = dark ? "border-white/10" : "border-foreground/8";

  return (
    <button
      onClick={onSelect}
      className={`relative flex flex-col text-left rounded-2xl overflow-hidden border-2 transition-all duration-200 w-full ${
        selected
          ? "border-foreground shadow-lg scale-[1.01]"
          : "border-transparent hover:border-foreground/20"
      } ${concept.color}`}
    >
      {/* Cover */}
      {coverUrl && (
        <div className="relative h-36 w-full overflow-hidden flex-shrink-0">
          <Image src={coverUrl} alt={concept.name} fill className="object-cover" unoptimized />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />
          {isRecommended && (
            <span className="absolute top-2.5 left-2.5 text-[10px] font-semibold tracking-wider bg-white/95 text-foreground px-2 py-0.5 rounded-full uppercase">
              ★ Önerilen
            </span>
          )}
        </div>
      )}

      <div className="p-4 space-y-2.5 flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl leading-none">{concept.emoji}</span>
            <p className={`text-sm font-semibold leading-tight ${textColor}`}>{concept.name}</p>
          </div>
          {isRecommended && !coverUrl && (
            <span className={`text-[9px] font-semibold tracking-wider px-1.5 py-0.5 rounded-full flex-shrink-0 ${
              dark ? "bg-white/20 text-white" : "bg-foreground/12 text-foreground"
            }`}>
              ★ Önerilen
            </span>
          )}
        </div>

        {/* Description */}
        <p className={`text-xs leading-relaxed ${mutedColor}`}>{concept.description}</p>

        {/* Musical direction */}
        <div className="flex flex-wrap gap-1">
          {concept.musicalDirection.slice(0, 3).map((d) => (
            <span key={d} className={`text-[10px] px-2 py-0.5 rounded-full ${tagBg}`}>{d}</span>
          ))}
        </div>

        {/* Example artists */}
        {concept.references.length > 0 && (
          <div className={`text-[10px] leading-relaxed ${mutedColor} border-t ${borderColor} pt-2`}>
            <span className="font-medium">Örnek sanatçılar: </span>
            {concept.references.slice(0, 4).join(", ")}
          </div>
        )}

        {/* Energy */}
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-medium ${mutedColor}`}>Enerji</span>
          <div className="flex gap-0.5">
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} className={`h-1 rounded-full ${
                i < concept.energyLevel
                  ? dark ? "bg-white/75 w-2" : "bg-foreground/50 w-2"
                  : dark ? "bg-white/12 w-1.5" : "bg-foreground/10 w-1.5"
              }`} />
            ))}
          </div>
        </div>

        {/* Recommend reason */}
        {isRecommended && recommendText && (
          <p className={`text-[10px] italic ${dark ? "text-white/45" : "text-foreground/40"}`}>
            ✦ {recommendText}
          </p>
        )}
      </div>

      {/* Checkmark */}
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

// ─── EXPAND BUTTON ────────────────────────────────────────────────────────────

function ExpandButton({ expanded, count, onToggle }: { expanded: boolean; count: number; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-2 flex items-center justify-center gap-1.5 border border-dashed border-border rounded-xl hover:border-foreground/30"
    >
      {expanded ? "▲ Daha az göster" : `▼ Diğer ${count} konsepti gör`}
    </button>
  );
}

// ─── TIME PICKER ──────────────────────────────────────────────────────────────

function TimePicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3">
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      <input
        type="time" value={value} onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-foreground/40 transition-colors"
      />
    </div>
  );
}

// ─── KARŞILAMA PANEL ──────────────────────────────────────────────────────────

function KarsilamaPanel({ sections, onChange, coverMap, onAdvance, eventType, activeSlugs }: {
  sections: EventSections;
  onChange: (s: EventSections) => void;
  coverMap: Record<string, string>;
  onAdvance: () => void;
  eventType: string;
  activeSlugs?: string[];
}) {
  const allConcepts = MUSIC_CONCEPTS.filter((c) => c.category === "cocktail" && (!activeSlugs || activeSlugs.includes(c.id)));
  const recommendedIds = getTop(allConcepts, eventType, 2);
  const recommended = allConcepts.filter((c) => recommendedIds.includes(c.id));
  const others = allConcepts.filter((c) => !recommendedIds.includes(c.id));

  const selected = sections.karsilama.conceptIds;
  const [expanded, setExpanded] = useState(false);
  const advancedRef = useRef(false);

  const selectConcept = (id: string) => {
    const next = selected.includes(id) ? [] : [id];
    onChange({ ...sections, karsilama: { ...sections.karsilama, conceptIds: next } });
  };

  useEffect(() => {
    if (selected.length > 0 && !advancedRef.current) {
      advancedRef.current = true;
      const t = setTimeout(onAdvance, 800);
      return () => clearTimeout(t);
    }
  }, [selected, onAdvance]);

  return (
    <div className="space-y-5">
      {/* Section explanation */}
      <div className="bg-[oklch(0.97_0.005_80)] rounded-2xl p-4 border border-border">
        <p className="text-sm text-foreground leading-relaxed">
          <span className="font-medium">Karşılama</span>, misafirlerinizin birbirleriyle sohbet edip müzikle atmosfere yavaş yavaş girdiği ısınma bölümü. Müzik arka planda akar, sohbeti destekler — dikkat çekmez.
        </p>
      </div>

      <TimePicker
        label="Başlangıç saati"
        value={sections.karsilama.startTime}
        onChange={(v) => onChange({ ...sections, karsilama: { ...sections.karsilama, startTime: v } })}
      />

      <div>
        <p className="text-sm font-medium text-foreground mb-3">Nasıl bir atmosfer olsun?</p>

        {/* Recommended */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {recommended.map((c) => (
            <ConceptCard
              key={c.id}
              concept={c}
              selected={selected.includes(c.id)}
              onSelect={() => selectConcept(c.id)}
              coverUrl={coverMap[c.id]}
              isRecommended
              recommendText={recommendReason(c, eventType)}
            />
          ))}
        </div>

        {/* Expand */}
        {others.length > 0 && (
          <div className="mt-3 space-y-3">
            <ExpandButton expanded={expanded} count={others.length} onToggle={() => setExpanded((p) => !p)} />
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-hidden"
                >
                  {others.map((c) => (
                    <ConceptCard
                      key={c.id}
                      concept={c}
                      selected={selected.includes(c.id)}
                      onSelect={() => selectConcept(c.id)}
                      coverUrl={coverMap[c.id]}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
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

// ─── ANA KUTLAMA PANEL ────────────────────────────────────────────────────────

function AnaKutlamaPanel({ sections, onChange, coverMap, onAdvance, eventType, activeSlugs }: {
  sections: EventSections;
  onChange: (s: EventSections) => void;
  coverMap: Record<string, string>;
  onAdvance: () => void;
  eventType: string;
  activeSlugs?: string[];
}) {
  const modernAll = MUSIC_CONCEPTS.filter((c) => c.category === "celebration" && (!activeSlugs || activeSlugs.includes(c.id)));
  const traditionalAll = MUSIC_CONCEPTS.filter((c) => c.category === "traditional" && (!activeSlugs || activeSlugs.includes(c.id)));

  const modernRecIds = getTop(modernAll, eventType, 2);
  const modernRec = modernAll.filter((c) => modernRecIds.includes(c.id));
  const modernOther = modernAll.filter((c) => !modernRecIds.includes(c.id));

  const tradRecIds = getTop(traditionalAll, eventType, 2);
  const tradRec = traditionalAll.filter((c) => tradRecIds.includes(c.id));
  const tradOther = traditionalAll.filter((c) => !tradRecIds.includes(c.id));

  const selected = sections.anaKutlama.conceptIds;
  const [modernExpanded, setModernExpanded] = useState(false);
  const [tradExpanded, setTradExpanded] = useState(false);

  const toggleConcept = (id: string) => {
    const next = selected.includes(id)
      ? selected.filter((x) => x !== id)
      : [...selected, id];
    onChange({ ...sections, anaKutlama: { ...sections.anaKutlama, conceptIds: next } });
  };

  return (
    <div className="space-y-6">
      {/* Modern */}
      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium text-foreground">✨ Modern</p>
          <p className="text-xs text-muted-foreground mt-0.5">Birden fazla seçebilirsin</p>
        </div>

        <TimePicker
          label="Başlangıç saati"
          value={sections.anaKutlama.startTime}
          onChange={(v) => onChange({ ...sections, anaKutlama: { ...sections.anaKutlama, startTime: v } })}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {modernRec.map((c) => (
            <ConceptCard
              key={c.id}
              concept={c}
              selected={selected.includes(c.id)}
              onSelect={() => toggleConcept(c.id)}
              coverUrl={coverMap[c.id]}
              isRecommended
              recommendText={recommendReason(c, eventType)}
            />
          ))}
        </div>

        {modernOther.length > 0 && (
          <div className="space-y-3">
            <ExpandButton expanded={modernExpanded} count={modernOther.length} onToggle={() => setModernExpanded((p) => !p)} />
            <AnimatePresence>
              {modernExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-hidden"
                >
                  {modernOther.map((c) => (
                    <ConceptCard
                      key={c.id}
                      concept={c}
                      selected={selected.includes(c.id)}
                      onSelect={() => toggleConcept(c.id)}
                      coverUrl={coverMap[c.id]}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground font-medium">Geleneksel</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Traditional */}
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">🔥 Geleneksel dokunuşlar eklemek ister misin?</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tradRec.map((c) => (
            <ConceptCard
              key={c.id}
              concept={c}
              selected={selected.includes(c.id)}
              onSelect={() => toggleConcept(c.id)}
              coverUrl={coverMap[c.id]}
              isRecommended
              recommendText={recommendReason(c, eventType)}
            />
          ))}
        </div>

        {tradOther.length > 0 && (
          <div className="space-y-3">
            <ExpandButton expanded={tradExpanded} count={tradOther.length} onToggle={() => setTradExpanded((p) => !p)} />
            <AnimatePresence>
              {tradExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-hidden"
                >
                  {tradOther.map((c) => (
                    <ConceptCard
                      key={c.id}
                      concept={c}
                      selected={selected.includes(c.id)}
                      onSelect={() => toggleConcept(c.id)}
                      coverUrl={coverMap[c.id]}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Devam button */}
      <button
        onClick={onAdvance}
        className={`w-full py-3 rounded-2xl text-sm font-medium transition-all ${
          selected.length > 0
            ? "bg-foreground text-background hover:opacity-90"
            : "bg-foreground/10 text-foreground/50"
        }`}
      >
        {selected.length > 0
          ? `${selected.length} seçim yapıldı — After Parti'ye geç →`
          : "Seçim yapmadan geç →"}
      </button>
    </div>
  );
}

// ─── AFTER PARTİ PANEL ───────────────────────────────────────────────────────

function AfterPartiPanel({ sections, onChange, coverMap, eventType, activeSlugs }: {
  sections: EventSections;
  onChange: (s: EventSections) => void;
  coverMap: Record<string, string>;
  eventType: string;
  activeSlugs?: string[];
}) {
  const allConcepts = MUSIC_CONCEPTS.filter((c) => c.category === "after-party" && (!activeSlugs || activeSlugs.includes(c.id)));
  const recommendedIds = getTop(allConcepts, eventType, 2);
  const recommended = allConcepts.filter((c) => recommendedIds.includes(c.id));
  const others = allConcepts.filter((c) => !recommendedIds.includes(c.id));

  const selected = sections.afterParti.conceptIds;
  const [expanded, setExpanded] = useState(false);

  const selectConcept = (id: string) => {
    const next = selected.includes(id) ? [] : [id];
    onChange({ ...sections, afterParti: { ...sections.afterParti, conceptIds: next } });
  };

  return (
    <div className="space-y-5">
      <div className="bg-[oklch(0.14_0.01_260)] rounded-2xl p-4 border border-white/10">
        <p className="text-sm text-white/80 leading-relaxed">
          <span className="font-medium text-white">After Parti</span>, gecenin kapanış bölümü. Enerjinin zirveye çıktığı, dans pistinin en dolduğu ve en uzun süren an.
        </p>
      </div>

      <div>
        <p className="text-sm font-medium text-foreground mb-3">Gece nasıl kapansın?</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {recommended.map((c) => (
            <ConceptCard
              key={c.id}
              concept={c}
              selected={selected.includes(c.id)}
              onSelect={() => selectConcept(c.id)}
              coverUrl={coverMap[c.id]}
              isRecommended
              recommendText={recommendReason(c, eventType)}
            />
          ))}
        </div>

        {others.length > 0 && (
          <div className="mt-3 space-y-3">
            <ExpandButton expanded={expanded} count={others.length} onToggle={() => setExpanded((p) => !p)} />
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-hidden"
                >
                  {others.map((c) => (
                    <ConceptCard
                      key={c.id}
                      concept={c}
                      selected={selected.includes(c.id)}
                      onSelect={() => selectConcept(c.id)}
                      coverUrl={coverMap[c.id]}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

const SUB_STEPS = [
  { id: "karsilama", label: "Karşılama", emoji: "🥂" },
  { id: "anaKutlama", label: "Ana Kutlama", emoji: "🎉" },
  { id: "afterParti", label: "After Parti", emoji: "🌙" },
];

const slideVariants = {
  enter: (d: number) => ({ opacity: 0, x: d > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0 },
  exit: (d: number) => ({ opacity: 0, x: d > 0 ? -40 : 40 }),
};

export default function StepEventSections({ data, update, onNext, conceptCovers = {}, activeSlugs }: Props) {
  const [subStep, setSubStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const sections = data.eventSections;
  const setSection = (s: EventSections) => update({ eventSections: s });
  const eventType = data.eventType;

  const advance = () => {
    setDirection(1);
    if (subStep < SUB_STEPS.length - 1) setSubStep((s) => s + 1);
    else onNext();
  };

  const goBack = () => {
    if (subStep > 0) { setDirection(-1); setSubStep((s) => s - 1); }
  };

  const isLast = subStep === SUB_STEPS.length - 1;
  const hasSelection =
    subStep === 0 ? sections.karsilama.conceptIds.length > 0
    : subStep === 1 ? sections.anaKutlama.conceptIds.length > 0
    : sections.afterParti.conceptIds.length > 0;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1">
        {SUB_STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-1">
            <button
              onClick={() => { if (i < subStep) { setDirection(-1); setSubStep(i); } }}
              disabled={i > subStep}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                i === subStep ? "bg-foreground text-background"
                : i < subStep ? "bg-foreground/12 text-foreground cursor-pointer hover:bg-foreground/20"
                : "text-muted-foreground/40 cursor-default"
              }`}
            >
              <span>{s.emoji}</span><span>{s.label}</span>
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
            <KarsilamaPanel sections={sections} onChange={setSection} coverMap={conceptCovers} onAdvance={advance} eventType={eventType} activeSlugs={activeSlugs} />
          )}
          {subStep === 1 && (
            <AnaKutlamaPanel sections={sections} onChange={setSection} coverMap={conceptCovers} onAdvance={advance} eventType={eventType} activeSlugs={activeSlugs} />
          )}
          {subStep === 2 && (
            <AfterPartiPanel sections={sections} onChange={setSection} coverMap={conceptCovers} eventType={eventType} activeSlugs={activeSlugs} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Nav */}
      <div className="flex items-center gap-3 pt-2">
        {subStep > 0 && (
          <button onClick={goBack} className="px-5 py-2.5 rounded-full text-sm text-muted-foreground border border-border hover:border-foreground/40 transition-colors">
            ← Geri
          </button>
        )}
        {/* After Parti: manual skip/next */}
        {isLast && (
          <AnimatePresence>
            <motion.button
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={advance}
              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
                hasSelection ? "bg-foreground text-background hover:opacity-90" : "bg-foreground/10 text-foreground/50 hover:bg-foreground/15"
              }`}
            >
              {hasSelection ? "Devam" : "Atla"}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.button>
          </AnimatePresence>
        )}
        {/* Karşılama: skip if no selection */}
        {subStep === 0 && !hasSelection && (
          <button onClick={advance} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Atla →
          </button>
        )}
      </div>
    </div>
  );
}
