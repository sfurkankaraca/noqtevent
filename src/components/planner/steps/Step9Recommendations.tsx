"use client";

import { type PlannerData, MUSIC_CONCEPTS, EVENT_TYPES, PARTNER_SERVICES } from "../PlannerStore";
import { getEventFlow } from "../eventFlows";
import { motion } from "framer-motion";

type Props = {
  data: PlannerData;
  onNext: () => void;
  activeSlugs?: string[];
};

const ARTIST_DB: Record<string, { name: string; style: string }> = {
  "mert-yilmaz": { name: "Mert Yılmaz", style: "Deep House & Organic" },
  "elif-kaya": { name: "Elif Kaya", style: "Disco, Funk & Nu-Disco" },
  "can-demir": { name: "Can Demir", style: "Techno & House" },
  "zeynep-arslan": { name: "Zeynep Arslan", style: "Jazz, Soul & Deep" },
  "bora-sen": { name: "Bora Şen", style: "Afrobeat & Latin" },
  "ada-kurt": { name: "Ada Kurt", style: "Electronic & Ambient" },
};

export default function Step9Recommendations({ data, onNext, activeSlugs }: Props) {
  const eventType = EVENT_TYPES.find((e) => e.id === data.eventType);

  // Collect all selected concept IDs across sections
  const allConceptIds = [
    ...(data.eventSections?.karsilama?.conceptIds ?? []),
    ...(data.eventSections?.anaKutlama?.conceptIds ?? []),
    ...(data.eventSections?.afterParti?.conceptIds ?? []),
  ];

  const flow = getEventFlow(data.eventType, allConceptIds);

  const selectedConcepts = Array.from(new Set(allConceptIds))
    .map((id) => MUSIC_CONCEPTS.find((c) => c.id === id))
    .filter(Boolean) as typeof MUSIC_CONCEPTS;

  const activeConcepts = activeSlugs
    ? MUSIC_CONCEPTS.filter((c) => activeSlugs.includes(c.id))
    : MUSIC_CONCEPTS;

  const displayConcepts =
    selectedConcepts.length > 0
      ? selectedConcepts.filter((c) => !activeSlugs || activeSlugs.includes(c.id)).slice(0, 4)
      : activeConcepts.filter((c) => c.idealEventTypes.includes(data.eventType)).slice(0, 2);

  const artistIds = Array.from(
    new Set(displayConcepts.flatMap((c) => c.suggestedArtistIds))
  ).slice(0, 3);

  const selectedServiceLabels = data.services
    .map((id) => PARTNER_SERVICES.find((s) => s.id === id)?.label)
    .filter(Boolean) as string[];

  const flowConceptIds = Array.from(new Set(flow.slots.map((s) => s.conceptId)));

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Intro */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-muted-foreground leading-relaxed"
      >
        Cevaplarına göre{" "}
        <strong className="text-foreground">{eventType?.label || "etkinliğin"}</strong> için
        kişisel bir deneyim paketi hazırladık.
      </motion.p>

      {/* Event Flow Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-2xl p-5"
      >
        <p className="text-xs text-muted-foreground tracking-[0.2em] uppercase font-medium mb-4">
          Etkinlik Akışı — {flow.name}
        </p>

        {/* Desktop: horizontal */}
        <div className="hidden sm:flex items-start gap-0 overflow-x-auto pb-2">
          {flow.slots.map((slot, i) => {
            const concept = MUSIC_CONCEPTS.find((c) => c.id === slot.conceptId);
            return (
              <div key={i} className="flex items-start flex-shrink-0">
                <div className="flex flex-col items-center min-w-[100px] max-w-[120px]">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium mb-2 ${
                      concept?.dark ? "bg-foreground text-background" : "bg-foreground/10 text-foreground"
                    }`}
                  >
                    {i + 1}
                  </div>
                  {slot.time && (
                    <span className="text-[10px] text-muted-foreground mb-1">{slot.time}</span>
                  )}
                  <span className="text-xs font-medium text-foreground text-center leading-tight mb-1">
                    {slot.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground text-center leading-tight">
                    {concept?.name}
                  </span>
                </div>
                {i < flow.slots.length - 1 && (
                  <div className="w-8 h-px bg-border mt-4 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile: vertical */}
        <div className="sm:hidden space-y-3">
          {flow.slots.map((slot, i) => {
            const concept = MUSIC_CONCEPTS.find((c) => c.id === slot.conceptId);
            return (
              <div key={i} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-foreground/10 flex items-center justify-center text-xs font-medium text-foreground flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{slot.label}</span>
                    {slot.time && <span className="text-xs text-muted-foreground">{slot.time}</span>}
                  </div>
                  <span className="text-xs text-muted-foreground">{concept?.name}</span>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Selected Music Concepts */}
      {displayConcepts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-xs text-muted-foreground tracking-[0.2em] uppercase font-medium mb-3">
            {selectedConcepts.length > 0 ? "Seçilen Konseptler" : "Önerilen Konseptler"}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {displayConcepts.map((concept) => (
              <div
                key={concept.id}
                className={`${concept.color} rounded-xl p-4`}
              >
                <h4
                  className={`font-semibold mb-1 ${concept.dark ? "text-white" : "text-foreground"}`}
                >
                  {concept.name}
                </h4>
                <div className="flex flex-wrap gap-1">
                  {concept.atmosphere.map((a) => (
                    <span
                      key={a}
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
                        concept.dark ? "bg-white/15 text-white/70" : "bg-foreground/8 text-foreground/60"
                      }`}
                    >
                      {a}
                    </span>
                  ))}
                </div>
                <p className={`text-xs mt-2 leading-relaxed line-clamp-2 ${concept.dark ? "text-white/60" : "text-foreground/60"}`}>
                  {concept.references.slice(0, 4).join(" · ")}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Suggested Artists */}
      {artistIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-2xl p-5"
        >
          <p className="text-xs text-muted-foreground tracking-[0.2em] uppercase font-medium mb-4">
            Önerilen Sanatçılar
          </p>
          <div className="space-y-3">
            {artistIds.map((id) => {
              const artist = ARTIST_DB[id];
              if (!artist) return null;
              return (
                <div key={id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground font-medium text-xs flex-shrink-0">
                    {artist.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{artist.name}</p>
                    <p className="text-xs text-muted-foreground">{artist.style}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Partner Services */}
      {selectedServiceLabels.length > 0 && (
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
            {selectedServiceLabels.map((label) => (
              <span
                key={label}
                className="text-xs px-3 py-1.5 bg-secondary rounded-full text-foreground"
              >
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
        onClick={onNext}
        className="inline-flex items-center gap-2 bg-foreground text-background px-7 py-3.5 rounded-full text-sm font-medium tracking-wide hover:opacity-90 transition-opacity"
      >
        Teklif Al
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.button>
    </div>
  );
}
