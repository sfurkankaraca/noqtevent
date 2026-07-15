"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";

const steps = [
  {
    number: "01",
    tag: "İlk Temas",
    title: "Bize anlat",
    description:
      "Etkinliğini, tarihini ve hayalindeki atmosferi anlat. Düğün mü, kurumsal mı, özel parti mi — ne olursa olsun seni dinlemek için buradayız.",
    detail: "Ücretsiz keşif görüşmesi · Taahhüt yok",
    cta: null,
  },
  {
    number: "02",
    tag: "Teklif",
    title: "48 saat içinde teklifin hazır",
    description:
      "Etkinliğine özel müzik konsepti, sanatçı önerisi ve net fiyat teklifini 48 saat içinde iletiyoruz. Sürpriz maliyet yok.",
    detail: "Konsept dökümanı · Sanatçı profilleri · Fiyat teklifi",
    cta: null,
  },
  {
    number: "03",
    tag: "Koordinasyon",
    title: "Her detay bizde",
    description:
      "Ekipman, set listesi, mekan teknik kontrolü ve gün planlaması — etkinliğe kadar tüm koordinasyonu biz üstleniyoruz. Gece yarısı mesajlarına dönüyoruz.",
    detail: "Haftalık durum güncellemesi · Anlık iletişim",
    cta: null,
  },
  {
    number: "04",
    tag: "Etkinlik Günü",
    title: "Sen misafirlerinle ilgilen",
    description:
      "Kurulum, ses kontrolü ve sahnede her şey planlandığı gibi. Biz sahneyi hazırlarız, sen anını yaşarsın.",
    detail: "Erken kurulum · Canlı destek · Etkinlik sonrası özet",
    cta: null,
  },
];

export default function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section id="nasil-calisir" ref={ref} className="py-24 lg:py-36 bg-background overflow-hidden scroll-mt-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="max-w-2xl mb-20"
        >
          <span className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-medium">
            Süreç
          </span>
          <h2
            className="text-4xl lg:text-5xl mt-4 text-foreground leading-tight"
            style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
          >
            Nasıl <em className="italic">çalışır?</em>
          </h2>
          <p className="text-muted-foreground mt-4 leading-relaxed max-w-lg">
            Etkinlik planlamak yorucu olabilir. Biz bunu en başından kolaylaştırıyoruz —
            sen bize anlat, gerisini biz halledelim.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Vertical timeline line — desktop */}
          <div className="hidden lg:block absolute left-[52px] top-0 bottom-0 w-px bg-border" />

          <div className="space-y-0">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: -24 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.12 }}
                className="relative grid grid-cols-1 lg:grid-cols-[120px_1fr] gap-6 lg:gap-16 py-10 border-b border-border last:border-0"
              >
                {/* Step number + dot */}
                <div className="flex lg:flex-col items-center lg:items-start gap-4 lg:gap-0">
                  {/* Timeline dot */}
                  <div className="hidden lg:flex items-center justify-center w-[104px]">
                    <div
                      className="w-3 h-3 rounded-full border-2 border-foreground bg-background relative z-10"
                      style={{ marginLeft: 46 }}
                    />
                  </div>
                  {/* Number */}
                  <span
                    className="text-[3.5rem] lg:text-[4rem] leading-none font-light text-foreground/10 select-none"
                    style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)" }}
                  >
                    {step.number}
                  </span>
                  {/* Mobile dot */}
                  <div className="lg:hidden w-2 h-2 rounded-full bg-foreground mt-1 flex-shrink-0" />
                </div>

                {/* Content */}
                <div className="pb-2">
                  <span className="inline-block text-[10px] font-semibold tracking-[0.18em] uppercase text-muted-foreground border border-border rounded-full px-3 py-1 mb-4">
                    {step.tag}
                  </span>
                  <h3
                    className="text-2xl lg:text-3xl text-foreground mb-3 leading-snug"
                    style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
                  >
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed max-w-xl mb-4">
                    {step.description}
                  </p>
                  {/* Deliverables */}
                  <div className="flex flex-wrap gap-2">
                    {step.detail.split(" · ").map((d) => (
                      <span
                        key={d}
                        className="text-xs text-foreground/60 bg-accent/60 px-3 py-1 rounded-full"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 flex flex-col sm:flex-row items-start sm:items-center gap-6"
        >
          <Link
            href="/planla"
            className="inline-flex items-center gap-2 bg-foreground text-background px-8 py-4 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Ücretsiz Keşif Görüşmesi Başlat →
          </Link>
          <p className="text-sm text-muted-foreground">
            Ortalama yanıt süresi: <strong className="text-foreground">2 saat</strong>
          </p>
        </motion.div>

      </div>
    </section>
  );
}
