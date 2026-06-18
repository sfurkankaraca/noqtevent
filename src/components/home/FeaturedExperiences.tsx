"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";

const experiences = [
  {
    id: 1,
    title: "Sunset Escape",
    subtitle: "Düğün & Kokteyl",
    description: "Altın saat ışığı, açık hava, house müzik ve kokteyl atmosferi.",
    tags: ["Düğün", "Açık Hava", "Müzik"],
    image: "/event-sunset.png",
    href: "/planla?konsept=sunset-escape",
    index: "01",
    dark: false,
  },
  {
    id: 2,
    title: "Cocktail Social",
    subtitle: "Kurumsal & Lansman",
    description: "Doğru müzik, doğru ışık, doğru enerji. İnsanların birbirini bulduğu geceler.",
    tags: ["Kokteyl", "Network", "Atmosfer"],
    image: "/event-cocktail.png",
    href: "/planla?konsept=cocktail-social",
    index: "02",
    dark: true,
  },
  {
    id: 3,
    title: "After Dark",
    subtitle: "After Party & Gece",
    description: "Havuz başı, DJ seti, gece yarısından sonra başlayan enerji.",
    tags: ["After Party", "Villa", "Gece"],
    image: "/event-villa.png",
    href: "/planla?konsept=after-dark",
    index: "03",
    dark: true,
  },
];

export default function FeaturedExperiences() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} id="deneyimler" className="py-24 lg:py-36 bg-background">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="flex flex-col lg:flex-row lg:items-end justify-between mb-16 gap-6"
        >
          <div>
            <span className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-medium">
              Öne Çıkan
            </span>
            <h2
              className="text-4xl lg:text-5xl mt-4 text-foreground leading-tight"
              style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
            >
              Deneyimler
            </h2>
          </div>
          <Link
            href="/planla"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors tracking-wide border-b border-muted-foreground/30 hover:border-foreground/60 pb-0.5 self-start lg:self-auto"
          >
            Deneyimini Tasarla →
          </Link>
        </motion.div>

        {/* Experience cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {experiences.map((exp, i) => (
            <motion.div
              key={exp.id}
              initial={{ opacity: 0, y: 32 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: i * 0.12 }}
            >
              <Link href={exp.href} className="block group">
                <div className="relative rounded-2xl h-80 overflow-hidden">
                  {/* Photo */}
                  <Image
                    src={exp.image}
                    alt={exp.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* Index */}
                  <div className="absolute top-5 left-5 text-xs tracking-[0.2em] text-white/50 font-medium">
                    {exp.index}
                  </div>

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {exp.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2.5 py-1 rounded-full border border-white/30 text-white/70"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h3
                      className="text-2xl text-white leading-tight"
                      style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
                    >
                      {exp.title}
                    </h3>
                    <p className="text-sm mt-1.5 text-white/60 leading-relaxed">
                      {exp.description}
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
