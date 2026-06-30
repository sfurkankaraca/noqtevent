"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";

const SLIDE_INTERVAL = 5000;

export default function Hero({ heroImages = [] }: { heroImages?: string[] }) {
  const images = heroImages.length > 0 ? heroImages : ["/hero-bg.webp"];
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const id = setInterval(() => setCurrent((c) => (c + 1) % images.length), SLIDE_INTERVAL);
    return () => clearInterval(id);
  }, [images.length]);

  return (
    <section className="relative min-h-screen flex flex-col">
      {/* Background: mobile = full bleed photo, desktop = split */}
      <div className="absolute inset-0">
        {/* Mobile: full photo background */}
        <div className="absolute inset-0 lg:hidden overflow-hidden">
          <AnimatePresence initial={false}>
            <motion.div
              key={current}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <Image
                src={images[current]}
                alt="NOQT etkinlik atmosferi"
                fill
                className="object-cover"
                priority={current === 0}
                sizes="100vw"
              />
            </motion.div>
          </AnimatePresence>
          {/* Dark overlay so text stays readable */}
          <div className="absolute inset-0 bg-black/50" />
        </div>

        {/* Desktop: split layout */}
        <div className="hidden lg:grid absolute inset-0 grid-cols-2">
          <div className="bg-[oklch(0.975_0.006_80)]" />
          <div className="relative overflow-hidden">
            <AnimatePresence initial={false}>
              <motion.div
                key={current}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
                className="absolute inset-0"
              >
                <Image
                  src={images[current]}
                  alt="NOQT etkinlik atmosferi"
                  fill
                  className="object-cover"
                  priority={current === 0}
                  sizes="50vw"
                />
              </motion.div>
            </AnimatePresence>
            {/* Left-edge fade */}
            <div className="absolute inset-0 bg-gradient-to-r from-[oklch(0.975_0.006_80)] via-transparent to-transparent w-1/3 z-10" />
          </div>
        </div>
      </div>

      {/* Slide dots */}
      {images.length > 1 && (
        <div className="absolute bottom-6 right-6 z-20 flex gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === current ? "w-6 bg-white" : "w-1.5 bg-white/40"
              }`}
            />
          ))}
        </div>
      )}

      {/* Subtle texture on left side */}
      <div
        className="absolute inset-0 lg:w-1/2 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Content */}
      <div className="relative flex-1 flex flex-col justify-center max-w-7xl mx-auto px-6 lg:px-8 pt-32 pb-24 w-full">
        <div className="max-w-xl lg:max-w-2xl">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3 mb-10"
          >
            <div className="h-px w-12 bg-foreground/30" />
            <span className="text-xs tracking-[0.25em] uppercase text-white/60 lg:text-muted-foreground font-medium">
              Deneyim Stüdyosu
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-6xl xl:text-7xl leading-[1.05] tracking-tight text-white lg:text-foreground"
            style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
          >
            Etkinliğinizi{" "}
            <em className="italic">birlikte</em>{" "}
            tasarlayalım.
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mt-8 text-lg text-white/80 lg:text-muted-foreground leading-relaxed max-w-lg"
          >
            Mekandan müziğe, atmosferden anılara kadar ihtiyacınız olan her şeyi tek bir yerden planlayın.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-12"
          >
            <Link
              href="/planla"
              onClick={() => trackEvent("cta_click", { location: "hero", target: "planla" })}
              className="inline-flex items-center gap-2 bg-white lg:bg-foreground text-foreground lg:text-background px-7 py-4 rounded-full text-sm font-medium tracking-wide hover:opacity-90 transition-all duration-200 group"
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
            <a
              href="https://wa.me/905417997973"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent("whatsapp_click", { location: "hero" })}
              className="inline-flex items-center gap-2 border border-white/30 lg:border-border text-white lg:text-foreground px-6 py-4 rounded-full text-sm font-medium tracking-wide hover:border-white/60 lg:hover:border-foreground/40 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </a>

            <Link
              href="#deneyimler"
              className="inline-flex items-center gap-2 text-white lg:text-foreground text-sm font-medium tracking-wide hover:opacity-70 transition-opacity px-4 py-4 group"
            >
              <span className="border-b border-white/40 lg:border-foreground/30 group-hover:border-white/70 lg:group-hover:border-foreground/60 transition-colors">
                İlham Al
              </span>
            </Link>
          </motion.div>
        </div>

        {/* Stats — sosyal kanıt şeridi. 3. kutu: gerçek sanatçı sayısı/kuruluş yılı/Google puanı gelince güncelle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.55 }}
          className="mt-14 flex flex-wrap items-center gap-x-8 gap-y-4 text-white/80 lg:text-muted-foreground"
        >
          {[
            { value: "50+", label: "Etkinlik" },
            { value: "Kayseri & Nevşehir", label: "Hizmet bölgesi" },
            { value: "Tek çatı altında", label: "Müzik · Mekan · Anı" }, // TODO: istenirse gerçek rakamla değiştir
          ].map((stat, i) => (
            <div key={i} className="flex items-center gap-8">
              {i > 0 && <div className="hidden sm:block h-8 w-px bg-white/20 lg:bg-foreground/15" />}
              <div>
                <div
                  className="text-2xl lg:text-3xl text-white lg:text-foreground leading-none"
                  style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
                >
                  {stat.value}
                </div>
                <div className="mt-1.5 text-xs tracking-[0.15em] uppercase">{stat.label}</div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="absolute bottom-10 right-8 lg:right-12 flex flex-col items-center gap-2"
      >
        <span className="text-xs text-white/50 lg:text-muted-foreground tracking-[0.2em] rotate-90 origin-center">
          SCROLL
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="h-px w-10 bg-white/30 lg:bg-muted-foreground/40"
        />
      </motion.div>
    </section>
  );
}
