"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";

const artists = [
  {
    id: "a1",
    name: "Mert Yılmaz",
    role: "DJ & Prodüktör",
    styles: ["Deep House", "Organic"],
    specialty: "Düğün & Sunset Sessions",
    initials: "MY",
    color: "bg-[oklch(0.88_0.04_75)]",
  },
  {
    id: "a2",
    name: "Elif Kaya",
    role: "DJ",
    styles: ["Disco", "Funk", "Nu-Disco"],
    specialty: "After Party & Özel Parti",
    initials: "EK",
    color: "bg-[oklch(0.92_0.02_320)]",
  },
  {
    id: "a3",
    name: "Can Demir",
    role: "DJ & Live Act",
    styles: ["Techno", "House"],
    specialty: "Kurumsal & Açılış",
    initials: "CD",
    color: "bg-[oklch(0.94_0.01_200)]",
  },
  {
    id: "a4",
    name: "Zeynep Arslan",
    role: "Live Vocalist & DJ",
    styles: ["Jazz", "Soul", "Deep"],
    specialty: "Cocktail Reception & Düğün",
    initials: "ZA",
    color: "bg-[oklch(0.91_0.025_160)]",
  },
];

export default function Artists() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-24 lg:py-36 bg-[oklch(0.975_0.006_80)]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="flex flex-col lg:flex-row lg:items-end justify-between mb-16 gap-6"
        >
          <div>
            <span className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-medium">
              Kadromuz
            </span>
            <h2
              className="text-4xl lg:text-5xl mt-4 text-foreground leading-tight"
              style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
            >
              Sanatçılar
            </h2>
          </div>
          <Link
            href="/sanatcilar"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors tracking-wide border-b border-muted-foreground/30 hover:border-foreground/60 pb-0.5 self-start lg:self-auto"
          >
            Tüm Kadroyu Gör →
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {artists.map((artist, i) => (
            <motion.div
              key={artist.id}
              initial={{ opacity: 0, y: 32 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.1 }}
            >
              <Link href={`/sanatcilar/${artist.id}`} className="block group">
                <div className="bg-card rounded-2xl overflow-hidden border border-border hover:border-foreground/20 transition-all duration-300 group-hover:shadow-lg">
                  {/* Avatar placeholder */}
                  <div className={`${artist.color} h-48 flex items-center justify-center`}>
                    <span
                      className="text-4xl font-light text-foreground/40"
                      style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)" }}
                    >
                      {artist.initials}
                    </span>
                  </div>

                  <div className="p-5">
                    <h3 className="font-medium text-foreground">{artist.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{artist.role}</p>

                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {artist.styles.map((style) => (
                        <span
                          key={style}
                          className="text-xs px-2.5 py-1 bg-secondary rounded-full text-muted-foreground"
                        >
                          {style}
                        </span>
                      ))}
                    </div>

                    <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                      {artist.specialty}
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
