"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import { QrCode, Upload, Play, Archive, Camera, Film } from "lucide-react";

const features = [
  { icon: QrCode, label: "QR Kod ile Yükleme" },
  { icon: Camera, label: "Misafir Fotoğrafları" },
  { icon: Film, label: "Düğün Vlogu" },
  { icon: Upload, label: "Özel Galeri" },
  { icon: Play, label: "DJ Set Kaydı" },
  { icon: Archive, label: "Etkinlik Arşivi" },
];

export default function MemoryDrive() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-24 lg:py-36 bg-foreground text-background overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <span className="text-xs tracking-[0.25em] uppercase text-background/40 font-medium">
              Ürün
            </span>
            <h2
              className="text-4xl lg:text-5xl mt-4 text-background leading-tight"
              style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
            >
              Memory{" "}
              <em className="italic">Drive</em>
            </h2>
            <p className="text-background/70 mt-6 leading-relaxed text-base">
              Etkinliğin her anını tek bir yerde topla. Misafirler QR kod ile
              anında fotoğraf ve video yükler. Sen özel galerine kavuşursun.
            </p>
            <p className="text-background/50 mt-4 leading-relaxed text-sm">
              Multi-kamera DJ set kaydından düğün vloguna, dijital arşivden
              özel galerilere kadar tüm anlar kalıcı hale gelir.
            </p>
            <Link
              href="/memory-drive"
              className="inline-flex items-center gap-2 mt-8 text-background border border-background/30 hover:border-background/60 px-6 py-3 rounded-full text-sm font-medium tracking-wide transition-colors"
            >
              Memory Drive&apos;ı Keşfet
            </Link>
          </motion.div>

          {/* Right - feature grid */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-3 gap-3"
          >
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.2 + i * 0.07 }}
                  className="bg-background/5 border border-background/10 rounded-xl p-5 flex flex-col gap-3 hover:bg-background/10 transition-colors"
                >
                  <Icon size={20} className="text-background/60" />
                  <span className="text-sm text-background/80 leading-snug">
                    {feature.label}
                  </span>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
