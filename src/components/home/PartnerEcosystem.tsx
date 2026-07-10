"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";

type CategoryCount = { label: string; count: number };
type LogoItem = { url: string; label?: string };

export default function PartnerEcosystem({
  categories,
  logos = [],
}: {
  categories: CategoryCount[];
  logos?: LogoItem[];
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const hasLogos = logos.length > 0;
  const marqueeItems = hasLogos ? [...logos, ...logos] : [];

  return (
    <section ref={ref} className="py-24 lg:py-36 bg-background overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7 }}
          >
            <span className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-medium">
              Ekosistem
            </span>
            <h2
              className="text-4xl lg:text-5xl mt-4 text-foreground leading-tight"
              style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
            >
              Ortak <em className="italic">Ağımız</em>
            </h2>
            <p className="text-muted-foreground mt-6 leading-relaxed">
              Her etkinlik için özenle seçilmiş partnerlerle çalışıyoruz.
              Mekan araştırmasından gelinlik tasarımcısına, çiçek düzenlemesinden
              balayı planlamasına kadar.
            </p>
            <Link
              href="/ortaklar"
              className="inline-flex items-center gap-2 mt-8 bg-foreground text-background px-6 py-3 rounded-full text-sm font-medium tracking-wide hover:opacity-90 transition-opacity"
            >
              Tüm Partnerleri Gör
            </Link>
          </motion.div>

          {/* Right — category grid */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="grid grid-cols-2 gap-2"
          >
            {categories.map((cat, i) => (
              <motion.div
                key={cat.label}
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ delay: 0.2 + i * 0.06 }}
              >
                <Link
                  href="/ortaklar"
                  className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-foreground/20 hover:bg-accent transition-all group"
                >
                  <span className="text-sm text-foreground font-medium">{cat.label}</span>
                  <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                    {cat.count}
                  </span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Partner logo marquee */}
      {hasLogos && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-20"
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-8 mb-8">
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs tracking-[0.3em] uppercase text-muted-foreground font-medium whitespace-nowrap">
                Partnerlerimiz
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>
          </div>

          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-16 lg:w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-16 lg:w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

            <motion.div
              className="flex items-center gap-10 w-max"
              animate={{ x: ["0%", "-50%"] }}
              transition={{ duration: 30, ease: "linear", repeat: Infinity }}
            >
              {marqueeItems.map((logo, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 relative h-12 w-32 grayscale hover:grayscale-0 opacity-50 hover:opacity-100 transition-all duration-300"
                >
                  <Image
                    src={logo.url}
                    alt={logo.label ?? `Partner ${i + 1}`}
                    fill
                    sizes="128px"
                    className="object-contain"
                  />
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      )}
    </section>
  );
}
