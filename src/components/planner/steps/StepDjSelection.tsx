"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { type PlannerData, MUSIC_CONCEPTS } from "../PlannerStore";

type Dj = {
  id: string; name: string; bio: string | null; performer_type: string | null;
  speciality: string | null; city: string | null; photo_url: string | null;
  instagram_url: string | null; spotify_url: string | null; website_url: string | null;
  soundcloud_url: string | null; concept_tags: string[] | null;
};

type Props = {
  data: PlannerData;
  update: (p: Partial<PlannerData>) => void;
  onNext: () => void;
  djs?: Dj[];
};

const PERFORMER_TYPE_LABELS: Record<string, string> = {
  dj: "DJ", artist: "Solo Sanatçı", trio: "Trio / Grup",
  dance: "Dans Ekibi", band: "Bando / Orkestra",
  host: "Sunucu / MC", moderator: "Moderatör",
};

export default function StepDjSelection({ data, update, onNext, djs = [] }: Props) {
  const selectedConceptIds = [
    ...(data.eventSections?.karsilama?.conceptIds ?? []),
    ...(data.eventSections?.anaKutlama?.conceptIds ?? []),
    ...(data.eventSections?.afterParti?.conceptIds ?? []),
  ];

  // Seçilen konseptleri icra edebilen sanatçılar
  const matching = djs.filter((dj) =>
    (dj.concept_tags ?? []).some((tag) => selectedConceptIds.includes(tag))
  );

  // Eşleşme yoksa tüm sanatçıları göster
  const eligible = matching.length > 0 ? matching : djs;

  const conceptNames = Array.from(new Set(selectedConceptIds))
    .map((id) => MUSIC_CONCEPTS.find((c) => c.id === id)?.name)
    .filter(Boolean) as string[];

  const toggle = (id: string) =>
    update({
      selectedDjIds: data.selectedDjIds.includes(id)
        ? data.selectedDjIds.filter((d) => d !== id)
        : [...data.selectedDjIds, id],
    });

  if (eligible.length === 0) {
    return (
      <div className="max-w-2xl space-y-6">
        <p className="text-muted-foreground leading-relaxed">
          Şu an seçtiğin konseptlere uygun kayıtlı sanatçımız görünmüyor. Merak etme —
          talebini aldıktan sonra ekibimiz sana en uygun isimleri önerecek.
        </p>
        <button
          onClick={onNext}
          className="inline-flex items-center gap-2 bg-foreground text-background px-7 py-3.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Devam Et
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <p className="text-muted-foreground leading-relaxed">
        {conceptNames.length > 0 ? (
          <>
            <strong className="text-foreground">{conceptNames.join(", ")}</strong> konseptlerini
            icra edebilen sanatçılar. Beğendiklerini seç — birden fazla seçebilirsin.
          </>
        ) : (
          <>Sanatçı kadromuzdan beğendiklerini seç — birden fazla seçebilirsin.</>
        )}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {eligible.map((dj, i) => {
          const selected = data.selectedDjIds.includes(dj.id);
          const djConcepts = (dj.concept_tags ?? [])
            .map((id) => MUSIC_CONCEPTS.find((c) => c.id === id)?.name)
            .filter(Boolean) as string[];
          return (
            <motion.button
              key={dj.id}
              type="button"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => toggle(dj.id)}
              className={`text-left rounded-2xl border-2 p-4 transition-all ${
                selected
                  ? "border-foreground bg-foreground/[0.03]"
                  : "border-border bg-card hover:border-foreground/30"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-secondary flex-shrink-0 relative">
                  {dj.photo_url ? (
                    <Image src={dj.photo_url} alt={dj.name} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm font-medium">
                      {dj.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground truncate">{dj.name}</p>
                    <span
                      className={`flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center text-[11px] ${
                        selected ? "bg-foreground text-background border-foreground" : "border-border text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                    {dj.performer_type && (
                      <span className="text-[10px] px-2 py-0.5 bg-secondary rounded-full text-muted-foreground">
                        {PERFORMER_TYPE_LABELS[dj.performer_type] ?? dj.performer_type}
                      </span>
                    )}
                    {dj.city && <span className="text-[10px] text-muted-foreground">📍 {dj.city}</span>}
                  </div>
                  {djConcepts.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {djConcepts.slice(0, 3).map((name) => (
                        <span key={name} className="text-[10px] px-2 py-0.5 bg-secondary/60 rounded-full text-muted-foreground">
                          {name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      <button
        onClick={onNext}
        className="inline-flex items-center gap-2 bg-foreground text-background px-7 py-3.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
      >
        {data.selectedDjIds.length > 0
          ? `${data.selectedDjIds.length} sanatçı seçildi — Devam`
          : "Şimdilik geç"}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
