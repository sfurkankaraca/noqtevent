"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";

const photos = [
  { src: "/wedding-dj-4.png", alt: "Düğün DJ seti — damat ve gelin birlikte çalıyor", span: "col-span-1 row-span-2" },
  { src: "/wedding-dj-1.png", alt: "Açık hava DJ booth — beyaz çiçekler", span: "col-span-1 row-span-1" },
  { src: "/wedding-dj-5.png", alt: "Gün batımı DJ seti — deniz manzarası", span: "col-span-1 row-span-1" },
  { src: "/wedding-dj-7.png", alt: "Gece düğün DJ seti — iç mekan", span: "col-span-1 row-span-1" },
  { src: "/wedding-dj-8.png", alt: "Gece Pioneer DJ — iç mekan karanlık enerji", span: "col-span-1 row-span-1" },
];

export default function RealEvents() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-24 lg:py-36 bg-background">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 gap-6"
        >
          <div>
            <span className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-medium">
              Gerçek Anlar
            </span>
            <h2
              className="text-4xl lg:text-5xl mt-4 text-foreground leading-tight"
              style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
            >
              Sahne <em className="italic">sizin</em>
            </h2>
          </div>
          <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
            Her etkinlik farklı. Her an özgün. Bunlar gerçek anlar — sahneleme değil.
          </p>
        </motion.div>

        {/* Photo grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 h-[600px] lg:h-[700px]">
          {/* Left large card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="relative rounded-2xl overflow-hidden row-span-2"
          >
            <Image
              src="/wedding-dj-4.png"
              alt="Düğün DJ seti"
              fill
              className="object-cover hover:scale-105 transition-transform duration-700"
            />
          </motion.div>

          {/* Top right */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative rounded-2xl overflow-hidden"
          >
            <Image
              src="/wedding-dj-1.png"
              alt="Açık hava DJ booth"
              fill
              className="object-cover hover:scale-105 transition-transform duration-700"
            />
          </motion.div>

          {/* Top far right */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="relative rounded-2xl overflow-hidden hidden lg:block"
          >
            <Image
              src="/wedding-dj-5.png"
              alt="Gün batımı DJ seti"
              fill
              className="object-cover hover:scale-105 transition-transform duration-700"
            />
          </motion.div>

          {/* Bottom right */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative rounded-2xl overflow-hidden"
          >
            <Image
              src="/wedding-dj-7.png"
              alt="Gece düğün DJ"
              fill
              className="object-cover hover:scale-105 transition-transform duration-700"
            />
          </motion.div>

          {/* Bottom far right */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="relative rounded-2xl overflow-hidden hidden lg:block"
          >
            <Image
              src="/wedding-dj-8.png"
              alt="Pioneer DJ gece enerjisi"
              fill
              className="object-cover hover:scale-105 transition-transform duration-700"
            />
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <Link
            href="/planla"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="border-b border-muted-foreground/30 hover:border-foreground/60 transition-colors pb-0.5">
              Senin etkinliğini de bu galeriye ekleyelim →
            </span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
