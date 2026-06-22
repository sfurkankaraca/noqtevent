"use client";

import Link from "next/link";
import Image from "next/image";
import { type PlannerData, MUSIC_CONCEPTS, EVENT_TYPES, PARTNER_SERVICES } from "../PlannerStore";
import { getEventFlow } from "../eventFlows";
import { motion } from "framer-motion";

type Dj = {
  id: string; name: string; bio: string | null; performer_type: string | null;
  speciality: string | null; city: string | null; photo_url: string | null;
  instagram_url: string | null; spotify_url: string | null; website_url: string | null;
  soundcloud_url: string | null; concept_tags: string[] | null;
};

type Venue = {
  id: string; business_name: string; description: string | null;
  category: string[] | null; city: string | null;
  logo_url: string | null; photos: string[] | null;
  instagram_url: string | null; website_url: string | null;
};

type Props = {
  data: PlannerData;
  onNext: () => void;
  activeSlugs?: string[];
  djs?: Dj[];
  venues?: Venue[];
};

const PERFORMER_TYPE_LABELS: Record<string, string> = {
  dj: "DJ", artist: "Solo Sanatçı", trio: "Trio / Grup",
  dance: "Dans Ekibi", band: "Bando / Orkestra",
  host: "Sunucu / MC", moderator: "Moderatör",
};

function SocialLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[10px] px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
    >
      {label}
    </a>
  );
}

export default function Step9Recommendations({ data, onNext, activeSlugs, djs = [], venues = [] }: Props) {
  const eventType = EVENT_TYPES.find((e) => e.id === data.eventType);

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

  // DJ önerileri: müşterinin seçtikleri öncelikli, sonra konsept eşleşmesi
  const suggestedDjs = djs.length > 0
    ? (() => {
        const picked = data.selectedDjIds
          .map((id) => djs.find((d) => d.id === id))
          .filter(Boolean) as typeof djs;
        if (picked.length > 0) return picked;
        const withMatch = djs.filter((dj) =>
          (dj.concept_tags ?? []).some((tag) => allConceptIds.includes(tag))
        );
        return (withMatch.length > 0 ? withMatch : djs).slice(0, 3);
      })()
    : [];

  const hasPicks = data.selectedDjIds.length > 0;

  // Mekan önerileri: sadece mekan seçmediyse
  const suggestedVenues = !data.hasVenue ? venues.slice(0, 3) : [];

  const selectedServiceLabels = data.services
    .map((id) => PARTNER_SERVICES.find((s) => s.id === id)?.label)
    .filter(Boolean) as string[];

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
        <div className="hidden sm:flex items-start gap-0 overflow-x-auto pb-2">
          {flow.slots.map((slot, i) => {
            const concept = MUSIC_CONCEPTS.find((c) => c.id === slot.conceptId);
            return (
              <div key={i} className="flex items-start flex-shrink-0">
                <div className="flex flex-col items-center min-w-[100px] max-w-[120px]">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium mb-2 ${concept?.dark ? "bg-foreground text-background" : "bg-foreground/10 text-foreground"}`}>
                    {i + 1}
                  </div>
                  {slot.time && <span className="text-[10px] text-muted-foreground mb-1">{slot.time}</span>}
                  <span className="text-xs font-medium text-foreground text-center leading-tight mb-1">{slot.label}</span>
                  <span className="text-[10px] text-muted-foreground text-center leading-tight">{concept?.name}</span>
                </div>
                {i < flow.slots.length - 1 && <div className="w-8 h-px bg-border mt-4 flex-shrink-0" />}
              </div>
            );
          })}
        </div>
        <div className="sm:hidden space-y-3">
          {flow.slots.map((slot, i) => {
            const concept = MUSIC_CONCEPTS.find((c) => c.id === slot.conceptId);
            return (
              <div key={i} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-foreground/10 flex items-center justify-center text-xs font-medium text-foreground flex-shrink-0">{i + 1}</div>
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

      {/* Seçilen konseptler */}
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
              <div key={concept.id} className={`${concept.color} rounded-xl p-4`}>
                <h4 className={`font-semibold mb-1 ${concept.dark ? "text-white" : "text-foreground"}`}>{concept.emoji} {concept.name}</h4>
                <div className="flex flex-wrap gap-1">
                  {concept.atmosphere.map((a) => (
                    <span key={a} className={`text-[10px] px-2 py-0.5 rounded-full ${concept.dark ? "bg-white/15 text-white/70" : "bg-foreground/8 text-foreground/60"}`}>{a}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* DJ / Sanatçı Önerileri */}
      {suggestedDjs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-2xl p-5"
        >
          <p className="text-xs text-muted-foreground tracking-[0.2em] uppercase font-medium mb-4">
            {hasPicks ? "Seçtiğin Sanatçılar" : "Önerilen Sanatçılar"}
          </p>
          <div className="space-y-4">
            {suggestedDjs.map((dj) => (
              <div key={dj.id} className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-secondary flex-shrink-0">
                  {dj.photo_url ? (
                    <Image src={dj.photo_url} alt={dj.name} width={48} height={48} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs font-medium">
                      {dj.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-foreground">{dj.name}</p>
                    {dj.performer_type && (
                      <span className="text-[10px] px-2 py-0.5 bg-secondary rounded-full text-muted-foreground">
                        {PERFORMER_TYPE_LABELS[dj.performer_type] ?? dj.performer_type}
                      </span>
                    )}
                    {dj.city && <span className="text-[10px] text-muted-foreground">📍 {dj.city}</span>}
                  </div>
                  {dj.speciality && <p className="text-xs text-muted-foreground mt-0.5">{dj.speciality}</p>}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <Link
                      href={`/sanatcilar/${dj.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] px-2.5 py-1 rounded-full bg-foreground text-background hover:opacity-90 transition-opacity"
                    >
                      Profil →
                    </Link>
                    {dj.instagram_url && <SocialLink href={dj.instagram_url} label="Instagram" />}
                    {dj.spotify_url && <SocialLink href={dj.spotify_url} label="Spotify" />}
                    {dj.soundcloud_url && <SocialLink href={dj.soundcloud_url} label="SoundCloud" />}
                    {dj.website_url && <SocialLink href={dj.website_url} label="Web" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Mekan Önerileri */}
      {suggestedVenues.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-card border border-border rounded-2xl p-5"
        >
          <p className="text-xs text-muted-foreground tracking-[0.2em] uppercase font-medium mb-4">
            Önerilen Mekanlar
          </p>
          <div className="space-y-4">
            {suggestedVenues.map((venue) => {
              const cover = venue.photos?.[0] ?? venue.logo_url;
              return (
                <div key={venue.id} className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-secondary flex-shrink-0">
                    {cover ? (
                      <Image src={cover} alt={venue.business_name} width={48} height={48} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">🏛️</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground">{venue.business_name}</p>
                      {venue.city && <span className="text-[10px] text-muted-foreground">📍 {venue.city}</span>}
                    </div>
                    {venue.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{venue.description}</p>
                    )}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <Link
                        href={`/ortaklar/${venue.id}`}
                        className="text-[10px] px-2.5 py-1 rounded-full bg-foreground text-background hover:opacity-90 transition-opacity"
                      >
                        Detay →
                      </Link>
                      {venue.instagram_url && <SocialLink href={venue.instagram_url} label="Instagram" />}
                      {venue.website_url && <SocialLink href={venue.website_url} label="Web" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Hizmet listesi */}
      {selectedServiceLabels.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-border rounded-2xl p-5"
        >
          <p className="text-xs text-muted-foreground tracking-[0.2em] uppercase font-medium mb-3">İstek Listesi</p>
          <div className="flex flex-wrap gap-2">
            {selectedServiceLabels.map((label) => (
              <span key={label} className="text-xs px-3 py-1.5 bg-secondary rounded-full text-foreground">{label}</span>
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
