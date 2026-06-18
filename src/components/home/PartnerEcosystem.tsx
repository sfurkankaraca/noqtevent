"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";

type CategoryCount = { label: string; count: number };

export default function PartnerEcosystem({ categories }: { categories: CategoryCount[] }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-24 lg:py-36 bg-background">
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
    </section>
  );
}
