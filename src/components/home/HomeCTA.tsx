"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";

// Minimal kapanış — tam genişlik koyu blok, dev serif ifade, tek buton.
// Süsleme yok; etki tipografi ve boşluktan gelir.
export default function HomeCTA() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="bg-foreground text-background">
      <div className="max-w-5xl mx-auto px-6 lg:px-8 py-28 lg:py-44 text-center">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="text-xs tracking-[0.25em] uppercase text-background/50 font-medium">
            Hazır mısınız?
          </span>
          <h2
            className="text-5xl lg:text-8xl mt-8 leading-[1.04]"
            style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
          >
            Tarihiniz dolmadan{" "}
            <em className="italic">ayırtın.</em>
          </h2>
          <p className="text-background/60 mt-8 text-lg leading-relaxed max-w-xl mx-auto">
            Popüler tarihler için erken rezervasyon şart. Birkaç sorumuz var — cevapların seni doğru deneyime götürür.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mt-14">
            <Link
              href="/planla"
              className="inline-flex items-center gap-3 bg-background text-foreground px-9 py-4 rounded-full text-sm font-medium tracking-wide transition-all duration-300 group hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-16px_rgba(255,255,255,0.4)]"
            >
              Etkinliğimi Planla
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
              href="/planla/ai"
              className="link-underline text-sm tracking-wide text-background/70 hover:text-background transition-colors"
            >
              AI ile Planla
            </Link>
            <a
              href="https://wa.me/905417997973"
              target="_blank"
              rel="noopener noreferrer"
              className="link-underline text-sm tracking-wide text-background/70 hover:text-background transition-colors"
            >
              WhatsApp&apos;tan Ulaşın
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
