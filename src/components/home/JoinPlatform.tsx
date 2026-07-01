"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";

const ARTIST_BENEFITS = [
  "Sizi aktif olarak pazarlıyoruz — siz sahneye odaklanın",
  "Sözleşme, ödeme ve lojistik koordinasyon bizden",
  "Düğünden festivale, geniş müşteri kitlesine erişim",
  "Profiliniz, mix'leriniz, setleriniz — tek yerden vitrin",
];

const PARTNER_BENEFITS = [
  "Düğün, nişan, kurumsal etkinlik müşterileriyle buluşun",
  "Paket organizasyonlarında sanatçıyla yan yana anılın",
  "NOQT üzerinden gelen müşteri sadık ve bütçe sahibi",
  "Mekan, fotoğraf, çiçek, kıyafet — hepsine yer var",
];

export default function JoinPlatform() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section ref={ref} className="py-20 lg:py-32 bg-foreground text-background">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-14"
        >
          <span className="text-xs tracking-[0.25em] uppercase text-background/40 font-medium">
            Platforma Katıl
          </span>
          <h2
            className="text-4xl lg:text-5xl mt-5 leading-[1.1] text-background max-w-xl"
            style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
          >
            Sanatçı mısınız?{" "}
            <em className="italic opacity-70">Mekan veya partner?</em>
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Artist card */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="rounded-2xl border border-background/10 p-8 lg:p-10 bg-background/5"
          >
            <div className="flex items-start justify-between mb-8">
              <span className="text-4xl">🎧</span>
              <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-background/35 border border-background/15 rounded-full px-3 py-1">
                Sanatçılar
              </span>
            </div>
            <h3
              className="text-2xl lg:text-3xl text-background leading-snug mb-3"
              style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
            >
              Pazarlama ekibiniz biz olalım
            </h3>
            <p className="text-background/55 text-sm leading-relaxed mb-8">
              NOQT&apos;a katılan sanatçılar daha fazla talep alıyor. Sizi müşterilere biz tanıtıyoruz; siz sadece sahneye konsantre olun.
            </p>
            <ul className="space-y-3 mb-10">
              {ARTIST_BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-3 text-sm text-background/70">
                  <span className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-background/10 flex items-center justify-center">
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1.5 4l1.8 1.8L6.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  {b}
                </li>
              ))}
            </ul>
            <Link
              href="/basvuru/sanatci"
              className="inline-flex items-center gap-2 bg-background text-foreground px-6 py-3 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Sanatçı Başvurusu
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </motion.div>

          {/* Partner card */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.18 }}
            className="rounded-2xl border border-background/10 p-8 lg:p-10 bg-background/5"
          >
            <div className="flex items-start justify-between mb-8">
              <span className="text-4xl">🏛️</span>
              <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-background/35 border border-background/15 rounded-full px-3 py-1">
                Mekan & Partner
              </span>
            </div>
            <h3
              className="text-2xl lg:text-3xl text-background leading-snug mb-3"
              style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
            >
              Her hafta yeni müşterilerle tanışın
            </h3>
            <p className="text-background/55 text-sm leading-relaxed mb-8">
              Mekan, fotoğrafçı, çiçekçi, kıyafet — etkinlik organizasyonunda yer alan herkese açık. NOQT müşterileri planlı, bütçe sahibi ve hazır.
            </p>
            <ul className="space-y-3 mb-10">
              {PARTNER_BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-3 text-sm text-background/70">
                  <span className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-background/10 flex items-center justify-center">
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1.5 4l1.8 1.8L6.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  {b}
                </li>
              ))}
            </ul>
            <a
              href="https://wa.me/905417997973?text=NOQT%20partner%20olmak%20istiyorum"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-background/20 text-background px-6 py-3 rounded-full text-sm font-medium hover:bg-background/10 transition-colors"
            >
              Partner Başvurusu
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
