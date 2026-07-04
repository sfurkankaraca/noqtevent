"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import Link from "next/link";

export type PackageItem = {
  slug: string;
  tag: string | null;
  name: string;
  emoji: string | null;
  desc: string | null;
  includes: string[];
  suitable: string[];
  priceFrom: number | null;
  priceNote: string | null;
  cta: string;
  href: string;
  color: string;
  dark: boolean;
};

const fmt = (n: number) => n.toLocaleString("tr-TR");

export default function PackagesClient({ packages }: { packages: PackageItem[] }) {
  const [active, setActive] = useState<string | null>(null);
  const headerRef = useRef(null);
  const headerInView = useInView(headerRef, { once: true, margin: "-60px" });

  return (
    <>
      {/* Hero */}
      <section className="bg-foreground text-background pt-32 pb-20 lg:pt-40 lg:pb-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="text-xs tracking-[0.25em] uppercase text-background/40 font-medium">
              Hazır Deneyim Paketleri
            </span>
            <h1
              className="text-5xl lg:text-7xl mt-6 text-background leading-[1.05] tracking-tight"
              style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
            >
              Tek paket,{" "}
              <em className="italic opacity-70">eksiksiz deneyim.</em>
            </h1>
            <p className="mt-8 text-lg text-background/60 leading-relaxed max-w-xl">
              DJ, fotoğrafçı, dekorasyon, ses sistemi — her şeyi ayrı ayrı aramak yerine tek bir teklif alın, tek bir ekiple çalışın.
            </p>
          </div>
        </div>
      </section>

      {/* Why package */}
      <section className="py-16 lg:py-20 bg-[oklch(0.975_0.006_80)] border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid sm:grid-cols-3 gap-8 lg:gap-14">
            {[
              { icon: "🤝", title: "Tek sözleşme", desc: "Ayrı ayrı koordine yerine tek noktadan yönetim. Zamandan ve stresten tasarruf." },
              { icon: "💰", title: "Paket fiyatı avantajı", desc: "Tek tek kiralamaya kıyasla paket fiyatı her zaman daha avantajlı." },
              { icon: "✅", title: "Test edilmiş kombinasyon", desc: "Birlikte çalıştığını bildiğimiz ekipler — sürpriz yok, aksaklık yok." },
            ].map((item) => (
              <div key={item.title} className="flex gap-4">
                <span className="text-2xl shrink-0">{item.icon}</span>
                <div>
                  <h3 className="font-medium text-foreground mb-1.5">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Package cards */}
      <section ref={headerRef} className="py-20 lg:py-28 bg-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <span className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-medium">
              Paketlerimiz
            </span>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-5">
            {packages.map((pkg, i) => {
              const isOpen = active === pkg.slug;
              const text = pkg.dark ? "text-white" : "text-foreground";
              const muted = pkg.dark ? "text-white/50" : "text-foreground/50";
              const border = pkg.dark ? "border-white/10" : "border-black/8";
              const tagCls = pkg.dark ? "text-white/40 border-white/15" : "text-foreground/45 border-black/12";
              const divider = pkg.dark ? "border-white/10" : "border-black/8";
              const checkCls = pkg.dark ? "text-white/40" : "text-foreground/40";
              const ctaCls = pkg.dark
                ? "bg-white text-foreground hover:bg-white/90"
                : "bg-foreground text-background hover:opacity-90";

              return (
                <motion.div
                  key={pkg.slug}
                  initial={{ opacity: 0, y: 28 }}
                  animate={headerInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.55, delay: i * 0.08 }}
                  className={`rounded-2xl ${pkg.color} border ${border} overflow-hidden`}
                >
                  <div className="p-7 lg:p-9">
                    <div className="flex items-start justify-between gap-4 mb-6">
                      <span className="text-3xl">{pkg.emoji}</span>
                      {pkg.tag && (
                        <span className={`text-[10px] font-semibold tracking-[0.16em] uppercase border rounded-full px-3 py-1 ${tagCls}`}>
                          {pkg.tag}
                        </span>
                      )}
                    </div>
                    <h2
                      className={`text-2xl lg:text-3xl leading-snug ${text} mb-3`}
                      style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
                    >
                      {pkg.name}
                    </h2>
                    <p className={`text-sm leading-relaxed ${muted} mb-6`}>{pkg.desc}</p>

                    {/* Suitable for tags */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {pkg.suitable.map((s) => (
                        <span key={s} className={`text-[11px] px-2.5 py-1 rounded-full border ${border} ${muted}`}>
                          {s}
                        </span>
                      ))}
                    </div>

                    {/* Expandable includes */}
                    <button
                      onClick={() => setActive(isOpen ? null : pkg.slug)}
                      className={`flex items-center gap-2 text-sm font-medium mb-6 ${text} hover:opacity-70 transition-opacity`}
                    >
                      <span>{isOpen ? "Gizle" : "Ne dahil?"}</span>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 16 16"
                        fill="none"
                        className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                      >
                        <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>

                    {isOpen && (
                      <motion.ul
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        className={`space-y-2.5 mb-6 pt-4 border-t ${divider}`}
                      >
                        {pkg.includes.map((item) => (
                          <li key={item} className={`flex items-start gap-3 text-sm ${text}`}>
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className={`mt-0.5 shrink-0 ${checkCls}`}>
                              <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            {item}
                          </li>
                        ))}
                      </motion.ul>
                    )}

                    <div className={`flex items-center justify-between pt-5 border-t ${divider}`}>
                      <div>
                        {pkg.priceFrom ? (
                          <span className={`text-sm font-medium ${text}`}>
                            {fmt(pkg.priceFrom)} ₺&apos;den başlayan fiyatlarla
                          </span>
                        ) : (
                          <span className={`text-xs ${muted}`}>{pkg.priceNote}</span>
                        )}
                      </div>
                      <Link
                        href={pkg.href}
                        className={`inline-flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-full transition-opacity ${ctaCls}`}
                      >
                        {pkg.cta}
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                          <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-28 bg-[oklch(0.975_0.006_80)] text-center">
        <div className="max-w-2xl mx-auto px-6 lg:px-8">
          <span className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-medium">
            Kendi Paketinizi Oluşturun
          </span>
          <h2
            className="text-3xl lg:text-5xl mt-5 text-foreground leading-[1.1]"
            style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
          >
            Tam olarak istediğinizi{" "}
            <em className="italic">birlikte tasarlayalım.</em>
          </h2>
          <p className="mt-5 text-muted-foreground leading-relaxed max-w-lg mx-auto">
            Hazır paketlerden birini beğenmediniz mi? Bütçenize ve vizyonunuza özel bir teklif hazırlayalım.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <Link
              href="/planla"
              className="inline-flex items-center gap-2 bg-foreground text-background px-7 py-4 rounded-full text-sm font-medium hover:opacity-90 transition-opacity group"
            >
              Özel Teklif Al
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="group-hover:translate-x-1 transition-transform">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <a
              href="https://wa.me/905417997973"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-border text-foreground px-6 py-4 rounded-full text-sm font-medium hover:border-foreground/40 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
