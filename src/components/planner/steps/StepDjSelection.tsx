"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { type PlannerData, MUSIC_CONCEPTS } from "../PlannerStore";

type Dj = {
  id: string; name: string; bio: string | null; performer_type: string | null;
  speciality: string | null; city: string | null; photo_url: string | null;
  photos?: string[] | null; focal_points?: Record<string, { x: number; y: number }> | null;
  instagram_url: string | null; spotify_url: string | null; website_url: string | null;
  soundcloud_url: string | null; mixcloud_url?: string | null; youtube_url?: string | null;
  preview_video_url?: string | null; concept_tags: string[] | null;
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

const BG_COLORS = [
  "bg-[oklch(0.88_0.05_75)]",
  "bg-[oklch(0.92_0.02_320)]",
  "bg-[oklch(0.94_0.01_200)]",
  "bg-[oklch(0.91_0.025_160)]",
  "bg-[oklch(0.90_0.04_55)]",
  "bg-[oklch(0.93_0.008_280)]",
];

function PhotoGallery({ photos, name, bgColor, focalPoints }: { photos: string[]; name: string; bgColor: string; focalPoints?: Record<string, { x: number; y: number }> | null }) {
  const [active, setActive] = useState(0);
  const fp = focalPoints?.[photos[active]] ?? { x: 50, y: 50 };
  return (
    <div className={`${bgColor} h-44 relative overflow-hidden`}>
      <Image src={photos[active]} alt={name} fill className="object-cover" style={{ objectPosition: `${fp.x}% ${fp.y}%` }} unoptimized />
      {photos.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
          {photos.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActive(i); }}
              className={`w-1.5 h-1.5 rounded-full transition-all ${i === active ? "bg-white scale-125" : "bg-white/50"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DjCard({ dj, selected, onToggle, bgColor }: { dj: Dj; selected: boolean; onToggle: () => void; bgColor: string }) {
  const allPhotos = (dj.photos && dj.photos.length > 0 ? dj.photos : dj.photo_url ? [dj.photo_url] : []);
  const initials = dj.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div
      className={`rounded-2xl overflow-hidden border-2 bg-card transition-all ${
        selected ? "border-foreground" : "border-border hover:border-foreground/30"
      }`}
    >
      {/* Visual */}
      <div className="relative group cursor-pointer" onClick={onToggle}>
        {allPhotos.length > 0 ? (
          <PhotoGallery photos={allPhotos} name={dj.name} bgColor={bgColor} focalPoints={dj.focal_points} />
        ) : (
          <div className={`${bgColor} h-44 flex items-center justify-center`}>
            <span className="text-4xl font-light text-foreground/30" style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)" }}>
              {initials}
            </span>
          </div>
        )}

        {/* Hover video */}
        {dj.preview_video_url && (
          <video
            src={dj.preview_video_url}
            muted loop playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            onMouseEnter={(e) => (e.currentTarget as HTMLVideoElement).play()}
            onMouseLeave={(e) => { const v = e.currentTarget as HTMLVideoElement; v.pause(); v.currentTime = 0; }}
          />
        )}

        {/* Selection check */}
        <span
          className={`absolute top-3 right-3 z-10 w-6 h-6 rounded-full border flex items-center justify-center text-xs ${
            selected ? "bg-foreground text-background border-foreground" : "bg-background/80 backdrop-blur-sm border-border text-transparent"
          }`}
        >
          ✓
        </span>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-foreground">{dj.name}</p>
          {dj.performer_type && (
            <span className="text-[10px] px-2 py-0.5 bg-secondary rounded-full text-muted-foreground">
              {PERFORMER_TYPE_LABELS[dj.performer_type] ?? dj.performer_type}
            </span>
          )}
        </div>
        {(dj.city || dj.speciality) && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {[dj.city ? `📍 ${dj.city}` : null, dj.speciality].filter(Boolean).join(" · ")}
          </p>
        )}
        <div className="flex items-center gap-2 mt-3">
          <button
            type="button"
            onClick={onToggle}
            className={`flex-1 text-xs py-2 rounded-full font-medium transition-all ${
              selected ? "bg-foreground text-background" : "bg-secondary text-foreground hover:bg-foreground/10"
            }`}
          >
            {selected ? "Seçildi ✓" : "Seç"}
          </button>
          <Link
            href={`/sanatcilar/${dj.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs py-2 px-3 rounded-full border border-border text-foreground hover:border-foreground/40 transition-colors whitespace-nowrap"
          >
            Profile git →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function StepDjSelection({ data, update, onNext, djs = [] }: Props) {
  const selectedConceptIds = Array.from(new Set([
    ...(data.eventSections?.karsilama?.conceptIds ?? []),
    ...(data.eventSections?.anaKutlama?.conceptIds ?? []),
    ...(data.eventSections?.afterParti?.conceptIds ?? []),
  ]));

  const toggle = (id: string) =>
    update({
      selectedDjIds: data.selectedDjIds.includes(id)
        ? data.selectedDjIds.filter((d) => d !== id)
        : [...data.selectedDjIds, id],
    });

  // Konsept başına önerilen sanatçılar
  const conceptGroups = selectedConceptIds
    .map((conceptId) => {
      const concept = MUSIC_CONCEPTS.find((c) => c.id === conceptId);
      if (!concept) return null;
      const matchedDjs = djs.filter((dj) => (dj.concept_tags ?? []).includes(conceptId));
      return { concept, djs: matchedDjs };
    })
    .filter((g): g is { concept: typeof MUSIC_CONCEPTS[number]; djs: Dj[] } => !!g && g.djs.length > 0);

  // Hiç konsept seçilmemişse ya da eşleşme yoksa tüm sanatçılar
  const noGroups = conceptGroups.length === 0;

  if (djs.length === 0) {
    return (
      <div className="max-w-2xl space-y-6">
        <p className="text-muted-foreground leading-relaxed">
          Talebini aldıktan sonra ekibimiz sana en uygun sanatçıları önerecek.
        </p>
        <button onClick={onNext} className="inline-flex items-center gap-2 bg-foreground text-background px-7 py-3.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity">
          Devam Et
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8">
      <p className="text-muted-foreground leading-relaxed">
        {noGroups
          ? "Sanatçı kadromuzdan beğendiklerini seç — birden fazla seçebilirsin."
          : "İşte seçtiğin konseptler için önerdiğimiz sanatçılar. Beğendiklerini seç, dilersen profillerini yeni sekmede inceleyebilirsin."}
      </p>

      {noGroups ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {djs.map((dj, i) => (
            <DjCard key={dj.id} dj={dj} selected={data.selectedDjIds.includes(dj.id)} onToggle={() => toggle(dj.id)} bgColor={BG_COLORS[i % BG_COLORS.length]} />
          ))}
        </div>
      ) : (
        conceptGroups.map((group, gi) => (
          <motion.div
            key={group.concept.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: gi * 0.08 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{group.concept.emoji}</span>
              <h3 className="text-lg text-foreground" style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}>
                {group.concept.name}
              </h3>
              <span className="text-xs text-muted-foreground">— önerdiğimiz sanatçılar</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.djs.map((dj, i) => (
                <DjCard key={`${group.concept.id}-${dj.id}`} dj={dj} selected={data.selectedDjIds.includes(dj.id)} onToggle={() => toggle(dj.id)} bgColor={BG_COLORS[i % BG_COLORS.length]} />
              ))}
            </div>
          </motion.div>
        ))
      )}

      <button
        onClick={onNext}
        className="inline-flex items-center gap-2 bg-foreground text-background px-7 py-3.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
      >
        {data.selectedDjIds.length > 0 ? `${data.selectedDjIds.length} sanatçı seçildi — Devam` : "Şimdilik geç"}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
    </div>
  );
}
