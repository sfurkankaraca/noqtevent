"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";

const SEGMENTS = [
  {
    emoji: "💍",
    tag: "Düğün & Nişan",
    headline: "Hayatınızın en özel gecesi",
    desc: "Doğru müzik, doğru sanatçı, doğru atmosfer — her detayı birlikte planlıyoruz.",
    href: "/planla",
    cta: "Deneyimini Tasarla",
    bg: "bg-[oklch(0.94_0.035_65)]",
    dark: false,
  },
  {
    emoji: "🎧",
    tag: "Kulüp & Festival",
    headline: "Sahneye koyacağın sanatçıyı bul",
    desc: "DJ, live act, B2B — rezervasyon formunu doldur, 48 saat içinde dönüyoruz.",
    href: "/sanatcilar",
    cta: "Kadroyu Keşfet",
    bg: "bg-[oklch(0.13_0.01_260)]",
    dark: true,
  },
  {
    emoji: "🏢",
    tag: "Kurumsal & Açılış",
    headline: "Aksaksız, profesyonel organizasyon",
    desc: "Lansman, kurumsal gece, açılış — fatura, sözleşme ve teknik koordinasyon dahil.",
    href: "/planla",
    cta: "Teklif Al",
    bg: "bg-[oklch(0.93_0.012_200)]",
    dark: false,
  },
  {
    emoji: "🎉",
    tag: "Özel Parti",
    headline: "Doğum günü, bride, sürpriz",
    desc: "Küçük ya da büyük — her partide o enerjiyi yaratan detayları biz hallederiz.",
    href: "/planla",
    cta: "Planlamaya Başla",
    bg: "bg-[oklch(0.92_0.022_320)]",
    dark: false,
  },
];

export default function SegmentGate() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section ref={ref} className="py-16 lg:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <span className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-medium">
            Ne arıyorsunuz?
          </span>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SEGMENTS.map((seg, i) => {
            const text = seg.dark ? "text-white" : "text-foreground";
            const muted = seg.dark ? "text-white/55" : "text-foreground/55";
            const border = seg.dark ? "border-white/10" : "border-black/8";
            const ctaCls = seg.dark
              ? "bg-white text-foreground hover:bg-white/90"
              : "bg-foreground text-background hover:opacity-90";

            return (
              <motion.div
                key={seg.tag}
                initial={{ opacity: 0, y: 28 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.55, delay: i * 0.08 }}
              >
                <Link
                  href={seg.href}
                  className={`group block rounded-2xl p-7 lg:p-9 ${seg.bg} border ${border} hover:scale-[1.015] transition-transform duration-300`}
                >
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <span className="text-3xl">{seg.emoji}</span>
                    <span className={`text-[10px] font-semibold tracking-[0.16em] uppercase ${muted} border ${border} rounded-full px-3 py-1`}>
                      {seg.tag}
                    </span>
                  </div>
                  <h2
                    className={`text-2xl lg:text-3xl leading-snug ${text} mb-3`}
                    style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
                  >
                    {seg.headline}
                  </h2>
                  <p className={`text-sm leading-relaxed ${muted} mb-8 max-w-xs`}>
                    {seg.desc}
                  </p>
                  <span className={`inline-flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-full transition-opacity ${ctaCls}`}>
                    {seg.cta}
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
