"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const steps = [
  {
    number: "01",
    title: "Anlat",
    description:
      "Etkinliğin ne olduğunu, ne hissetmek istediğini ve misafirlerini anlat. Seni dinliyoruz.",
  },
  {
    number: "02",
    title: "Keşfet",
    description:
      "Sana özel konsept önerileri, sanatçı tavsiyeleri ve ilham veren deneyim paketleri sunuyoruz.",
  },
  {
    number: "03",
    title: "Tasarla",
    description:
      "Birlikte kusursuz atmosferi, müziği, teknik altyapıyı ve tüm detayları tasarlıyoruz.",
  },
  {
    number: "04",
    title: "Yaşa",
    description:
      "Sahne sana ait. Biz her şeyin mükemmel işlediğinden emin olurken sen anını yaşa.",
  },
];

export default function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-24 lg:py-36 bg-[oklch(0.975_0.006_80)]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="max-w-xl mb-20"
        >
          <span className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-medium">
            Süreç
          </span>
          <h2
            className="text-4xl lg:text-5xl mt-4 text-foreground leading-tight"
            style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
          >
            Nasıl{" "}
            <em className="italic">çalışır?</em>
          </h2>
          <p className="text-muted-foreground mt-4 leading-relaxed">
            Müşteri değil, ortak gibi çalışıyoruz. Başından sonuna kadar
            yanınızdayız.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 32 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: i * 0.1 }}
              className="relative"
            >
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-6 left-full w-full h-px bg-border z-0 -translate-x-2" />
              )}

              <div className="relative z-10">
                <div className="text-xs tracking-[0.25em] text-muted-foreground font-medium mb-6">
                  {step.number}
                </div>
                <h3 className="text-xl font-medium text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
