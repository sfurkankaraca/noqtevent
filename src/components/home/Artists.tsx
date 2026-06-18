"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";

type Dj = {
  id: string;
  name: string;
  bio: string | null;
  photo_url: string | null;
  photos?: string[] | null;
  focal_points?: Record<string, { x: number; y: number }> | null;
  concept_tags: string[];
};

const BG_COLORS = [
  "bg-[oklch(0.88_0.04_75)]",
  "bg-[oklch(0.92_0.02_320)]",
  "bg-[oklch(0.94_0.01_200)]",
  "bg-[oklch(0.91_0.025_160)]",
];

export default function Artists({ djs }: { djs: Dj[] }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const displayed = djs.slice(0, 4);

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

        {displayed.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            Yakında sanatçılarımızla tanışacaksınız.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {displayed.map((dj, i) => {
              const initials = dj.name
                .split(" ")
                .map((w) => w[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
              const bgColor = BG_COLORS[i % BG_COLORS.length];

              return (
                <motion.div
                  key={dj.id}
                  initial={{ opacity: 0, y: 32 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                >
                  <Link href="/sanatcilar" className="block group">
                    <div className="bg-card rounded-2xl overflow-hidden border border-border hover:border-foreground/20 transition-all duration-300 group-hover:shadow-lg">
                      <div className={`${bgColor} h-48 relative flex items-center justify-center`}>
                        {dj.photo_url ? (
                          <Image
                            src={dj.photo_url}
                            alt={dj.name}
                            fill
                            className="object-cover"
                            style={{
                              objectPosition: (() => {
                                const fp = dj.focal_points?.[dj.photo_url];
                                return fp ? `${fp.x}% ${fp.y}%` : "center";
                              })(),
                            }}
                            unoptimized
                          />
                        ) : (
                          <span
                            className="text-4xl font-light text-foreground/40"
                            style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)" }}
                          >
                            {initials}
                          </span>
                        )}
                      </div>
                      <div className="p-5">
                        <h3 className="font-medium text-foreground">{dj.name}</h3>
                        {dj.concept_tags?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {dj.concept_tags.slice(0, 2).map((tag) => (
                              <span key={tag} className="text-xs px-2.5 py-1 bg-secondary rounded-full text-muted-foreground">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
