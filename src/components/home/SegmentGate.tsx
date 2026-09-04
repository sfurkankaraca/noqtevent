"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";

// Minimal editoryal dizin — renkli kartlar yerine numaralı satırlar,
// ince ayraçlar ve hover'da beliren ok. Monokrom; vurgu tipografide.
const SEGMENTS = [
  {
    index: "01",
    tag: "Düğün & Nişan",
    headline: "Hayatınızın en özel gecesi",
    desc: "Doğru müzik, doğru sanatçı, doğru atmosfer — her detayı birlikte planlıyoruz.",
    href: "/planla",
  },
  {
    index: "02",
    tag: "Kulüp & Festival",
    headline: "Sahneye koyacağın sanatçıyı bul",
    desc: "DJ, live act, B2B — rezervasyon formunu doldur, 48 saat içinde dönüyoruz.",
    href: "/sanatcilar",
  },
  {
    index: "03",
    tag: "Kurumsal & Açılış",
    headline: "Aksaksız, profesyonel organizasyon",
    desc: "Lansman, kurumsal gece, açılış — fatura, sözleşme ve teknik koordinasyon dahil.",
    href: "/planla",
  },
  {
    index: "04",
    tag: "Özel Parti",
    headline: "Doğum günü, bride, sürpriz",
    desc: "Küçük ya da büyük — her partide o enerjiyi yaratan detayları biz hallederiz.",
    href: "/planla",
  },
];

export default function SegmentGate() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section ref={ref} className="py-20 lg:py-32 bg-background">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-6"
        >
          <span className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-medium">
            Ne arıyorsunuz?
          </span>
        </motion.div>

        <div className="border-t border-border">
          {SEGMENTS.map((seg, i) => (
            <motion.div
              key={seg.tag}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: i * 0.09, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link
                href={seg.href}
                className="group grid grid-cols-[auto_1fr_auto] lg:grid-cols-[80px_240px_1fr_auto] items-baseline lg:items-center gap-x-6 lg:gap-x-10 gap-y-2 py-8 lg:py-10 border-b border-border transition-colors duration-300 hover:bg-secondary/40"
              >
                {/* Sıra numarası */}
                <span
                  className="text-sm text-muted-foreground/50 tabular-nums"
                  style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)" }}
                >
                  {seg.index}
                </span>

                {/* Kategori */}
                <span className="text-[11px] font-medium tracking-[0.2em] uppercase text-muted-foreground">
                  {seg.tag}
                </span>

                {/* Başlık + açıklama */}
                <div className="col-span-3 lg:col-span-1 pl-0">
                  <h2
                    className="text-2xl lg:text-4xl leading-snug text-foreground transition-transform duration-500 lg:group-hover:translate-x-2"
                    style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
                  >
                    {seg.headline}
                  </h2>
                  <p className="text-sm leading-relaxed text-muted-foreground mt-2 max-w-md">
                    {seg.desc}
                  </p>
                </div>

                {/* Hover'da beliren ok */}
                <span className="hidden lg:flex items-center justify-center w-11 h-11 rounded-full border border-border text-foreground opacity-0 -translate-x-2 transition-all duration-400 group-hover:opacity-100 group-hover:translate-x-0">
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
