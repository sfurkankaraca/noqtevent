"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";

export default function HomeCTA() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-24 lg:py-36 bg-[oklch(0.975_0.006_80)]">
      <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <span className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-medium">
            Başla
          </span>
          <h2
            className="text-4xl lg:text-6xl mt-6 text-foreground leading-[1.1]"
            style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
          >
            Etkinliğin nasıl{" "}
            <em className="italic">hissettirmeli?</em>
          </h2>
          <p className="text-muted-foreground mt-6 text-lg leading-relaxed max-w-xl mx-auto">
            Birkaç sorumuz var. Cevapların, seni doğru deneyime götürür.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12">
            <Link
              href="/planla"
              className="inline-flex items-center gap-2 bg-foreground text-background px-8 py-4 rounded-full text-sm font-medium tracking-wide hover:opacity-90 transition-all group"
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
              href="/iletisim"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Veya doğrudan bize ulaşın
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
