"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";

type Concept = {
  id: string;
  slug: string;
  name: string;
  emoji: string | null;
  description: string | null;
  cover_image_url: string | null;
  color: string | null;
  is_dark: boolean | null;
  atmosphere: string[] | null;
  is_signature: boolean | null;
  energy_level: number | null;
};

// Static fallback cards shown when DB is empty
const STATIC_CONCEPTS = [
  {
    slug: "gun-batimi",
    name: "Gün Batımı",
    emoji: "🌅",
    description: "NOQT'un imza konsepti. Anadolu esintileri, organik ritimler ve modern elektronik müziğin birleştiği sıcak atmosfer.",
    cover_image_url: null,
    color: "bg-[oklch(0.88_0.055_65)]",
    is_dark: false,
    atmosphere: ["Sıcak", "Duygusal", "Modern"],
    is_signature: true,
    energy_level: 5,
  },
  {
    slug: "disko-gecesi",
    name: "Disko Gecesi",
    emoji: "🪩",
    description: "Disco, funk ve nu-disco'nun zamansız enerjisi. Dans etmeye başlamak için cesaret gerektirmez.",
    cover_image_url: null,
    color: "bg-[oklch(0.90_0.025_320)]",
    is_dark: false,
    atmosphere: ["Eğlenceli", "Şık", "Dans Odaklı"],
    is_signature: false,
    energy_level: 8,
  },
  {
    slug: "gece-kulubu",
    name: "Gece Kulübü",
    emoji: "🌃",
    description: "Kulüp enerjisiyle devam eden after party. Sabaha kadar süren dans ve ritim.",
    cover_image_url: null,
    color: "bg-[oklch(0.14_0.01_260)]",
    is_dark: true,
    atmosphere: ["Karanlık", "Enerjik", "Yoğun"],
    is_signature: false,
    energy_level: 10,
  },
];

export default function FeaturedExperiences({ concepts }: { concepts?: Concept[] }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  const items = concepts && concepts.length >= 3 ? concepts.slice(0, 6) : STATIC_CONCEPTS;

  return (
    <section ref={ref} id="deneyimler" className="py-24 lg:py-36 bg-background">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="flex flex-col lg:flex-row lg:items-end justify-between mb-16 gap-6"
        >
          <div>
            <span className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-medium">
              Müzik Konseptlerimiz
            </span>
            <h2
              className="text-4xl lg:text-5xl mt-4 text-foreground leading-tight"
              style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
            >
              Deneyimler
            </h2>
          </div>
          <Link
            href="/konseptler"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors tracking-wide border-b border-muted-foreground/30 hover:border-foreground/60 pb-0.5 self-start lg:self-auto"
          >
            Tüm Konseptler →
          </Link>
        </motion.div>

        {/* Concept cards */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${items.length >= 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"} gap-4`}>
          {items.map((concept, i) => {
            const dark = concept.is_dark ?? false;
            const textColor = dark ? "text-white" : "text-foreground";
            const mutedColor = dark ? "text-white/60" : "text-foreground/55";
            const tagBg = dark ? "bg-white/15 text-white/70" : "bg-black/8 text-foreground/60";

            return (
              <motion.div
                key={concept.slug}
                initial={{ opacity: 0, y: 32 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.08 }}
              >
                <Link
                  href={`/konseptler/${concept.slug}`}
                  className={`block group rounded-2xl overflow-hidden relative h-80 ${concept.color ?? "bg-secondary"}`}
                >
                  {/* Cover photo */}
                  {concept.cover_image_url && (
                    <Image
                      src={concept.cover_image_url}
                      alt={concept.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      unoptimized
                    />
                  )}

                  {/* Gradient overlay */}
                  <div className={`absolute inset-0 ${concept.cover_image_url ? "bg-gradient-to-t from-black/75 via-black/25 to-transparent" : "bg-gradient-to-t from-black/30 to-transparent"}`} />

                  {/* Index */}
                  <div className="absolute top-5 left-5 text-xs tracking-[0.2em] text-white/40 font-medium">
                    {String(i + 1).padStart(2, "0")}
                  </div>

                  {/* Signature badge */}
                  {concept.is_signature && (
                    <div className="absolute top-5 right-5">
                      <span className="text-[10px] font-semibold tracking-wider bg-white/90 text-foreground px-2.5 py-1 rounded-full uppercase">
                        NOQT İmzası
                      </span>
                    </div>
                  )}

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    {/* Atmosphere tags */}
                    {concept.atmosphere && concept.atmosphere.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {concept.atmosphere.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2.5 py-0.5 rounded-full border border-white/25 text-white/65"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <h3
                          className="text-2xl text-white leading-tight flex items-center gap-2"
                          style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
                        >
                          {concept.emoji && <span className="text-xl">{concept.emoji}</span>}
                          {concept.name}
                        </h3>
                        {concept.description && (
                          <p className="text-sm mt-1.5 text-white/60 leading-relaxed line-clamp-2">
                            {concept.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Energy bar */}
                    {concept.energy_level != null && (
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-[10px] text-white/40 font-medium">Enerji</span>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 10 }, (_, j) => (
                            <div
                              key={j}
                              className={`h-1 rounded-full ${
                                j < concept.energy_level!
                                  ? "bg-white/70 w-2"
                                  : "bg-white/15 w-1.5"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <Link
            href="/planla"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="border-b border-muted-foreground/30 hover:border-foreground/60 transition-colors pb-0.5">
              Bu konseptlerden birini seç, etkinliğini planla →
            </span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
