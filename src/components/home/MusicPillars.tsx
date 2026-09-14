"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";

// Ne yapıyoruz — müzik deneyiminin dört ayağı. Minimal editoryal dizin:
// numaralı satırlar, ince ayraçlar, hover'da beliren ok. Vurgu tipografide.
const PILLARS = [
  {
    index: "01",
    tag: "Sanatçı Kürasyonu",
    headline: "Etkinliğe doğru sesi seçiyoruz",
    desc: "DJ, canlı müzisyen, solist ya da karma kadro — konseptinize ve misafirlerinize göre eşleştiriyoruz.",
    href: "/sanatcilar",
  },
  {
    index: "02",
    tag: "Müzik Akışı",
    headline: "Gecenin her anı önceden kurgulanır",
    desc: "Karşılama, giriş, ilk dans, yemek, dans bloğu, kapanış — setlist, geçişler, istek ve yasak listeleri dahil.",
    href: "/konseptler",
  },
  {
    index: "03",
    tag: "Ses & Işık",
    headline: "Müzik nasıl planlandıysa öyle duyulur",
    desc: "Mekana uygun ses sistemi, kalibrasyon ve sahne ışığı. Teknik keşif etkinlikten önce yapılır.",
    href: "/planla",
  },
  {
    index: "04",
    tag: "Sahne Yönetimi",
    headline: "Gece boyunca sahnedeyiz",
    desc: "Erken kurulum, ses kontrolü, MC ve anons koordinasyonu. Akış değişirse müzik anında uyum sağlar.",
    href: "/planla",
  },
];

export default function MusicPillars() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section ref={ref} id="ne-yapiyoruz" className="py-20 lg:py-32 bg-background scroll-mt-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mb-14 lg:mb-20"
        >
          <span className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-medium">
            Ne yapıyoruz?
          </span>
          <h2
            className="text-4xl lg:text-6xl mt-4 text-foreground leading-[1.05]"
            style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
          >
            Etkinliğin müziğinden <em className="italic">biz sorumluyuz.</em>
          </h2>
          <p className="text-muted-foreground mt-6 leading-relaxed max-w-xl">
            Mekanı, dekoru, menüyü siz seçin. Gecenin nasıl akacağı, hangi anda hangi şarkının
            çalacağı ve pistin ne zaman dolacağı bizim işimiz.
          </p>
        </motion.div>

        <div className="border-t border-border">
          {PILLARS.map((item, i) => (
            <motion.div
              key={item.tag}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: i * 0.09, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link
                href={item.href}
                className="group grid grid-cols-[auto_1fr_auto] lg:grid-cols-[80px_240px_1fr_auto] items-baseline lg:items-center gap-x-6 lg:gap-x-10 gap-y-2 py-8 lg:py-10 border-b border-border transition-colors duration-300 hover:bg-secondary/40"
              >
                {/* Sıra numarası */}
                <span
                  className="text-sm text-muted-foreground/50 tabular-nums"
                  style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)" }}
                >
                  {item.index}
                </span>

                {/* Alan */}
                <span className="text-[11px] font-medium tracking-[0.2em] uppercase text-muted-foreground">
                  {item.tag}
                </span>

                {/* Başlık + açıklama */}
                <div className="col-span-3 lg:col-span-1 pl-0">
                  <h3
                    className="text-2xl lg:text-4xl leading-snug text-foreground transition-transform duration-500 lg:group-hover:translate-x-2"
                    style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
                  >
                    {item.headline}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground mt-2 max-w-md">
                    {item.desc}
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
