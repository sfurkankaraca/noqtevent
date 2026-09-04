"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";

const SLIDE_INTERVAL = 6000;

// Alt marquee şeridi — hizmet dili, iki kez render edilip CSS ile döndürülür
const MARQUEE_ITEMS = [
  "Düğün & Nişan",
  "Kurumsal Etkinlik",
  "Marka Lansmanı",
  "DJ & Canlı Performans",
  "Teknik Prodüksiyon",
  "Konsept Tasarımı",
  "Mekan Kürasyonu",
  "Özel Davet",
];

export default function Hero({ heroImages = [] }: { heroImages?: string[] }) {
  const images = heroImages.length > 0 ? heroImages : ["/hero-bg.webp"];
  const [current, setCurrent] = useState(0);
  // İlk boyamada yalnızca LCP görseli (ilk slayt) yüklensin; diğer slaytlar
  // mount sonrası eklensin ki LCP ile bant genişliği için yarışmasınlar.
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (images.length <= 1) return;
    const id = setInterval(() => setCurrent((c) => (c + 1) % images.length), SLIDE_INTERVAL);
    return () => clearInterval(id);
  }, [images.length]);

  // İlk render'da sadece ilk görsel; mount sonrası tüm slaytlar
  const rendered = mounted ? images : images.slice(0, 1);

  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Background: mobile = full bleed photo, desktop = split.
          Crossfade + Ken Burns saf CSS ile — ilk görsel SSR'da hemen opacity:100
          render edilip priority ile preload edilir; böylece LCP JS/animasyona
          takılmaz. */}
      <div className="absolute inset-0">
        {/* Mobile: full photo background */}
        <div className="absolute inset-0 lg:hidden overflow-hidden">
          {rendered.map((src, i) => (
            <div
              key={i}
              className={`absolute inset-0 transition-opacity duration-[1200ms] ease-in-out ${i === current ? "opacity-100" : "opacity-0"}`}
            >
              <Image
                src={src}
                alt="NOQT — Kayseri ve Nevşehir&apos;de premium etkinlik organizasyonu, misafir deneyimi"
                fill
                className={`object-cover ${i === current ? "anim-kenburns" : ""}`}
                priority={i === 0}
                sizes="100vw"
              />
            </div>
          ))}
          {/* Sinematik gradient — alttan yoğunlaşan geçiş */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/25" />
        </div>

        {/* Desktop: split layout */}
        <div className="hidden lg:grid absolute inset-0 grid-cols-2">
          <div className="bg-[oklch(0.975_0.006_80)]" />
          <div className="relative overflow-hidden">
            {rendered.map((src, i) => (
              <div
                key={i}
                className={`absolute inset-0 transition-opacity duration-[1200ms] ease-in-out ${i === current ? "opacity-100" : "opacity-0"}`}
              >
                <Image
                  src={src}
                  alt="NOQT — Kayseri ve Nevşehir&apos;de premium etkinlik organizasyonu, misafir deneyimi"
                  fill
                  className={`object-cover ${i === current ? "anim-kenburns" : ""}`}
                  priority={i === 0}
                  sizes="50vw"
                />
              </div>
            ))}
            {/* Left-edge fade */}
            <div className="absolute inset-0 bg-gradient-to-r from-[oklch(0.975_0.006_80)] via-transparent to-transparent w-1/3 z-10" />
          </div>
        </div>
      </div>

      {/* Slide dots */}
      {images.length > 1 && (
        <div className="absolute bottom-20 right-6 lg:right-10 z-20 flex gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`${i + 1}. görsele geç`}
              aria-current={i === current}
              className="p-2.5 -m-2.5 flex items-center"
            >
              <span
                className={`h-1 rounded-full transition-all duration-300 block ${
                  i === current ? "w-6 bg-white" : "w-1.5 bg-white/40"
                }`}
              />
            </button>
          ))}
        </div>
      )}

      {/* Content — lg+ ekranlarda metin kolonu tam 50vw ile sınırlanır ki arka plandaki
          split görselle (grid-cols-2, her kolon 50vw) her zaman hizalı kalsın. */}
      <div className="relative flex-1 flex flex-col justify-center pt-32 pb-32 w-full">
        <div className="px-6 lg:w-1/2 lg:pl-12 xl:pl-20 lg:pr-10">
          <div className="max-w-xl">
            {/* Eyebrow */}
            <div className="anim-rise flex items-center gap-3 mb-8" style={{ "--rise-delay": "0.05s" } as React.CSSProperties}>
              <div className="h-px w-12 bg-white/40 lg:bg-foreground/30" />
              <span className="text-xs tracking-[0.25em] uppercase text-white/60 lg:text-muted-foreground font-medium">
                Uçtan Uca Etkinlik Tasarımı ve Yönetimi
              </span>
            </div>

            {/* Headline — satır satır kademeli CSS reveal; coğrafi SEO metni sr-only katmanda */}
            <h1
              className="text-5xl sm:text-6xl lg:text-7xl xl:text-[5.5rem] leading-[1.02] tracking-tight text-white lg:text-foreground"
              style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
            >
              <span className="block overflow-hidden">
                <span className="anim-rise block" style={{ "--rise-delay": "0.12s" } as React.CSSProperties}>
                  Uçtan uca
                </span>
              </span>
              <span className="block overflow-hidden">
                <span className="anim-rise block" style={{ "--rise-delay": "0.22s" } as React.CSSProperties}>
                  etkinlik tasarımı
                </span>
              </span>
              <span className="block overflow-hidden">
                <span className="anim-rise block italic" style={{ "--rise-delay": "0.32s" } as React.CSSProperties}>
                  ve yönetimi.
                </span>
              </span>
              <span className="sr-only">
                {" "}— Kayseri ve Nevşehir&apos;de uçtan uca etkinlik tasarımı ve yönetimi: konsept geliştirme, mekan
                ve sanatçı kürasyonu, teknik prodüksiyon, koordinasyon; düğün, kurumsal etkinlik, marka lansmanı ve
                özel davet organizasyonu
              </span>
            </h1>

            {/* Subheadline */}
            <p
              className="anim-rise mt-8 text-lg text-white/80 lg:text-muted-foreground leading-relaxed max-w-lg"
              style={{ "--rise-delay": "0.45s" } as React.CSSProperties}
            >
              Mekan, sanatçı, teknik ekip ve koordinasyon. Etkinliğiniz için gereken her şey tek noktada.
            </p>

            {/* CTAs — minimal: tek birincil buton + iki sade metin linki */}
            <div
              className="anim-rise flex flex-col sm:flex-row items-start sm:items-center gap-7 mt-12"
              style={{ "--rise-delay": "0.58s" } as React.CSSProperties}
            >
              <Link
                href="/planla"
                onClick={() => trackEvent("cta_click", { location: "hero", target: "planla" })}
                className="inline-flex items-center gap-3 bg-white lg:bg-foreground text-foreground lg:text-background px-8 py-4 rounded-full text-sm font-medium tracking-wide transition-all duration-300 group hover:shadow-[0_12px_32px_-12px_rgba(0,0,0,0.45)] hover:-translate-y-0.5"
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
                onClick={() => trackEvent("cta_click", { location: "hero", target: "planla-ai" })}
                className="link-underline text-sm tracking-wide text-white/80 lg:text-foreground/70 hover:text-white lg:hover:text-foreground transition-colors"
              >
                AI ile Planla
              </Link>

              <a
                href="#nasil-calisir"
                onClick={() => trackEvent("cta_click", { location: "hero", target: "nasil-calisir" })}
                className="link-underline hidden sm:inline text-sm tracking-wide text-white/80 lg:text-foreground/70 hover:text-white lg:hover:text-foreground transition-colors"
              >
                Nasıl Çalışıyoruz
              </a>
            </div>

            {/* Tek satır güven sinyali — sade */}
            <p
              className="anim-rise mt-10 text-sm text-white/60 lg:text-muted-foreground"
              style={{ "--rise-delay": "0.7s" } as React.CSSProperties}
            >
              Ücretsiz keşif görüşmesi · Aynı gün teklif
            </p>
          </div>
        </div>
      </div>

      {/* Alt marquee şeridi — ince çizgi üstünde sakin, sade akış */}
      <div
        className="anim-rise absolute bottom-0 left-0 right-0 z-20 border-t border-white/15 lg:border-border overflow-hidden"
        style={{ "--rise-delay": "0.85s" } as React.CSSProperties}
        aria-hidden="true"
      >
        <div className="anim-marquee flex w-max items-center gap-12 py-4 pr-12" style={{ "--marquee-duration": "44s" } as React.CSSProperties}>
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className="flex items-center gap-12 text-[11px] tracking-[0.28em] uppercase text-white/45 lg:text-muted-foreground/70 whitespace-nowrap">
              {item}
              <span className="inline-block h-1 w-1 rounded-full bg-white/25 lg:bg-foreground/20" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
