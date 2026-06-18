"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import { QrCode, Camera, Play, Archive } from "lucide-react";

const steps = [
  { icon: QrCode, label: "QR Kod", desc: "Masalara yerleştirilen kartlarla misafirler anında yükler" },
  { icon: Camera, label: "Anında Galeri", desc: "Tüm içerikler gerçek zamanlı galerine düşer" },
  { icon: Play, label: "DJ Set Kaydı", desc: "Multi-kamera, yüksek kalitede set arşivi" },
  { icon: Archive, label: "5 Yıl Arşiv", desc: "İstediğin zaman indir, paylaş, kalıcı tut" },
];

// Simulated gallery photo placeholders
const galleryItems = [
  { w: "col-span-2", h: "row-span-2", color: "oklch(0.78 0.04 65)" },
  { w: "col-span-1", h: "row-span-1", color: "oklch(0.72 0.03 280)" },
  { w: "col-span-1", h: "row-span-1", color: "oklch(0.68 0.05 140)" },
  { w: "col-span-1", h: "row-span-1", color: "oklch(0.74 0.04 320)" },
  { w: "col-span-1", h: "row-span-1", color: "oklch(0.70 0.035 200)" },
  { w: "col-span-2", h: "row-span-1", color: "oklch(0.75 0.03 60)" },
];

export default function MemoryDrive() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-24 lg:py-36 bg-foreground text-background overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="mb-16"
        >
          <span className="text-xs tracking-[0.25em] uppercase text-background/40 font-medium">
            Ürün
          </span>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mt-4">
            <h2
              className="text-4xl lg:text-6xl text-background leading-tight max-w-xl"
              style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
            >
              Her an, tek bir{" "}
              <em className="italic">yerde.</em>
            </h2>
            <div className="flex flex-col gap-3 lg:items-end">
              <p className="text-background/60 text-sm leading-relaxed max-w-xs lg:text-right">
                Misafir fotoğraflarından DJ set kaydına, tüm anlar otomatik olarak toplanır ve sana sunulur.
              </p>
              <Link
                href="/memory-drive"
                className="self-start lg:self-auto inline-flex items-center gap-2 text-background border border-background/30 hover:border-background/70 px-6 py-3 rounded-full text-sm font-medium tracking-wide transition-colors"
              >
                Memory Drive&apos;ı Keşfet →
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Main content: gallery mockup + steps */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          {/* Left: gallery mockup */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="relative"
          >
            {/* Phone-style frame */}
            <div className="bg-background/8 border border-background/15 rounded-3xl p-4 backdrop-blur-sm">
              {/* Mock top bar */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-background/30" />
                  <span className="text-[11px] text-background/40 tracking-wider font-medium">GALERI — Selin & Mert Düğünü</span>
                </div>
                <span className="text-[11px] text-background/30">247 fotoğraf</span>
              </div>

              {/* Gallery grid */}
              <div className="grid grid-cols-3 gap-1.5" style={{ gridTemplateRows: "auto" }}>
                {galleryItems.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={inView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.4, delay: 0.3 + i * 0.06 }}
                    className={`rounded-xl overflow-hidden ${item.w} ${item.h === "row-span-2" ? "aspect-[3/4]" : "aspect-square"}`}
                    style={{ backgroundColor: item.color }}
                  >
                    {/* Subtle noise overlay */}
                    <div className="w-full h-full opacity-20 bg-gradient-to-br from-white/20 to-transparent" />
                  </motion.div>
                ))}
              </div>

              {/* Upload indicator */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="mt-3 flex items-center gap-2.5 bg-background/10 border border-background/15 rounded-xl px-4 py-3"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] text-background/60">3 yeni fotoğraf yüklendi — az önce</span>
                <span className="ml-auto text-[11px] text-background/30">QR ile</span>
              </motion.div>
            </div>

            {/* Floating QR card */}
            <motion.div
              initial={{ opacity: 0, x: 24, y: -12 }}
              animate={inView ? { opacity: 1, x: 0, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="absolute -top-5 -right-4 bg-background rounded-2xl p-4 shadow-2xl border border-background/20 w-28"
            >
              <div className="grid grid-cols-5 gap-0.5 mb-2">
                {Array.from({ length: 25 }, (_, j) => (
                  <div
                    key={j}
                    className="aspect-square rounded-[1px]"
                    style={{
                      backgroundColor: [0,1,2,5,6,7,10,12,14,17,18,19,22,23,24].includes(j)
                        ? "oklch(0.15 0.01 60)"
                        : "oklch(0.94 0.005 60)",
                    }}
                  />
                ))}
              </div>
              <p className="text-[9px] text-foreground/50 text-center tracking-wider">Fotoğraf Yükle</p>
            </motion.div>
          </motion.div>

          {/* Right: steps */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col gap-6 lg:pt-4"
          >
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.35 + i * 0.1 }}
                  className="flex items-start gap-5 border-b border-background/10 pb-6 last:border-0 last:pb-0"
                >
                  <div className="w-10 h-10 rounded-xl bg-background/8 border border-background/12 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon size={18} className="text-background/55" />
                  </div>
                  <div>
                    <p className="font-medium text-background text-sm">{step.label}</p>
                    <p className="text-background/50 text-sm mt-1 leading-relaxed">{step.desc}</p>
                  </div>
                  <span className="ml-auto text-xs text-background/20 font-medium pt-1">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </motion.div>
              );
            })}

            {/* Stat callouts */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 0.9 }}
              className="grid grid-cols-2 gap-3 mt-2"
            >
              {[
                { value: "5 Yıl", label: "Güvenli Arşiv" },
                { value: "∞", label: "Misafir Yüklemesi" },
              ].map((stat) => (
                <div key={stat.label} className="bg-background/6 border border-background/10 rounded-2xl p-5">
                  <p
                    className="text-3xl text-background/90"
                    style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
                  >
                    {stat.value}
                  </p>
                  <p className="text-xs text-background/40 mt-1">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
