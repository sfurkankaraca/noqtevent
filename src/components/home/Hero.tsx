"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

const SLIDE_INTERVAL = 5000;

export default function Hero({ heroImages = [] }: { heroImages?: string[] }) {
  const images = heroImages.length > 0 ? heroImages : ["/hero-bg.png"];
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const id = setInterval(() => setCurrent((c) => (c + 1) % images.length), SLIDE_INTERVAL);
    return () => clearInterval(id);
  }, [images.length]);

  return (
    <section className="relative min-h-screen flex flex-col">
      {/* Split layout: left text, right photo */}
      <div className="absolute inset-0 grid grid-cols-1 lg:grid-cols-2">
        {/* Left — warm cream */}
        <div className="bg-[oklch(0.975_0.006_80)]" />
        {/* Right — slideshow */}
        <div className="relative hidden lg:block overflow-hidden">
          <AnimatePresence initial={false}>
            <motion.div
              key={current}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <Image
                src={images[current]}
                alt="NOQT etkinlik atmosferi"
                fill
                className="object-cover"
                priority={current === 0}
                unoptimized
              />
            </motion.div>
          </AnimatePresence>
          {/* Subtle left-edge fade so left panel bleeds into photo */}
          <div className="absolute inset-0 bg-gradient-to-r from-[oklch(0.975_0.006_80)] via-transparent to-transparent w-1/3 z-10" />

          {/* Slide dots — only shown when multiple images */}
          {images.length > 1 && (
            <div className="absolute bottom-6 right-6 z-20 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === current ? "w-6 bg-white" : "w-1.5 bg-white/40"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Subtle texture on left side */}
      <div
        className="absolute inset-0 lg:w-1/2 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Content */}
      <div className="relative flex-1 flex flex-col justify-center max-w-7xl mx-auto px-6 lg:px-8 pt-32 pb-24 w-full">
        <div className="max-w-xl lg:max-w-2xl">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3 mb-10"
          >
            <div className="h-px w-12 bg-foreground/30" />
            <span className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-medium">
              Deneyim Stüdyosu
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-6xl xl:text-7xl leading-[1.05] tracking-tight text-foreground"
            style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
          >
            Etkinliğinizi{" "}
            <em className="italic">birlikte</em>{" "}
            tasarlayalım.
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mt-8 text-lg text-muted-foreground leading-relaxed max-w-lg"
          >
            Mekandan müziğe, atmosferden anılara kadar ihtiyacınız olan her şeyi tek bir yerden planlayın.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-12"
          >
            <Link
              href="/planla"
              className="inline-flex items-center gap-2 bg-foreground text-background px-7 py-4 rounded-full text-sm font-medium tracking-wide hover:opacity-90 transition-all duration-200 group"
            >
              Deneyimini Tasarla
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="group-hover:translate-x-1 transition-transform"
              >
                <path
                  d="M3 8h10M9 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <Link
              href="#deneyimler"
              className="inline-flex items-center gap-2 text-foreground text-sm font-medium tracking-wide hover:text-muted-foreground transition-colors px-4 py-4 group"
            >
              <span className="border-b border-foreground/30 group-hover:border-foreground/60 transition-colors">
                İlham Al
              </span>
            </Link>
          </motion.div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="flex flex-wrap items-center gap-10 mt-24 pt-10 border-t border-border lg:w-1/2"
        >
          {[
            { value: "500+", label: "Deneyim" },
            { value: "12", label: "Yıl" },
            { value: "98%", label: "Memnuniyet" },
            { value: "50+", label: "Partner" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-3xl font-light tracking-tight text-foreground">
                {stat.value}
              </div>
              <div className="text-xs text-muted-foreground tracking-wide mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="absolute bottom-10 right-8 lg:right-12 flex flex-col items-center gap-2"
      >
        <span className="text-xs text-muted-foreground tracking-[0.2em] rotate-90 origin-center">
          SCROLL
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="h-px w-10 bg-muted-foreground/40"
        />
      </motion.div>
    </section>
  );
}
