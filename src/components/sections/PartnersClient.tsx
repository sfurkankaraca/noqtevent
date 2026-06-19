"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

type Service = { name: string; price_range: string };

type Partner = {
  id: string;
  company_name: string;
  description: string | null;
  logo_url: string | null;
  portfolio_images: string[];
  service_category: string;
  services: Service[];
  contact_email: string | null;
  contact_phone: string | null;
};

const BG_COLORS = [
  "bg-[oklch(0.88_0.05_75)]",
  "bg-[oklch(0.94_0.01_200)]",
  "bg-[oklch(0.91_0.025_160)]",
  "bg-[oklch(0.97_0.003_60)]",
  "bg-[oklch(0.92_0.02_320)]",
  "bg-[oklch(0.90_0.04_55)]",
  "bg-[oklch(0.93_0.015_130)]",
  "bg-[oklch(0.96_0.005_60)]",
];

export default function PartnersClient({ partners }: { partners: Partner[] }) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = [...new Set(partners.map((p) => p.service_category))].sort();

  const filtered = partners.filter(
    (p) => !activeCategory || p.service_category === activeCategory
  );

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-24">
      {/* Header */}
      <div className="mb-16">
        <span className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-medium">
          Ekosistem
        </span>
        <h1
          className="text-5xl lg:text-6xl mt-4 text-foreground leading-tight"
          style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
        >
          Ortak Ağımız
        </h1>
        <p className="text-muted-foreground mt-4 max-w-lg leading-relaxed">
          Her partner, kalite ve estetik anlayış konusunda titizlikle seçilmiştir.
          Etkinliğinizin her detayı için en uygun isimleri bir araya getiriyoruz.
        </p>
      </div>

      {/* Category filter */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-12">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-4 py-2 rounded-full text-xs font-medium border transition-all ${
              !activeCategory
                ? "bg-foreground text-background border-foreground"
                : "border-border text-muted-foreground hover:border-foreground/40"
            }`}
          >
            Tümü
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              className={`px-4 py-2 rounded-full text-xs font-medium border transition-all ${
                activeCategory === cat
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-muted-foreground hover:border-foreground/40"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground">
          <p>Bu kategoride henüz ortak yok.</p>
          <button onClick={() => setActiveCategory(null)} className="mt-4 text-sm text-foreground underline">
            Tümünü göster
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((partner, i) => {
            const bgColor = BG_COLORS[i % BG_COLORS.length];
            const coverImage = partner.portfolio_images?.[0];

            return (
              <motion.div
                key={partner.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <div className="bg-card border border-border rounded-2xl overflow-hidden hover:border-foreground/20 hover:shadow-md transition-all group">
                  {/* Visual */}
                  <div className={`${bgColor} h-40 relative`}>
                    {coverImage ? (
                      <Image src={coverImage} alt={partner.company_name} fill className="object-cover" unoptimized />
                    ) : null}
                    {/* Category badge */}
                    <div className="absolute bottom-3 left-3">
                      <span className="text-xs font-medium px-2.5 py-1 bg-background/80 backdrop-blur-sm rounded-full text-foreground">
                        {partner.service_category}
                      </span>
                    </div>
                    {/* Logo */}
                    {partner.logo_url && (
                      <div className="absolute top-3 right-3 w-9 h-9 rounded-lg bg-white border border-white/20 overflow-hidden">
                        <Image src={partner.logo_url} alt="Logo" fill className="object-contain p-1" unoptimized />
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <h3 className="font-medium text-foreground">{partner.company_name}</h3>

                    {partner.description && (
                      <p className="text-xs text-muted-foreground mt-2 leading-relaxed line-clamp-2">
                        {partner.description}
                      </p>
                    )}

                    {partner.services?.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {partner.services.slice(0, 2).map((s, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <span className="text-foreground">{s.name}</span>
                            {s.price_range && (
                              <span className="text-muted-foreground">{s.price_range}</span>
                            )}
                          </div>
                        ))}
                        {partner.services.length > 2 && (
                          <p className="text-xs text-muted-foreground">+{partner.services.length - 2} daha</p>
                        )}
                      </div>
                    )}

                    <div className="mt-4 pt-3 border-t border-border">
                      <Link
                        href={`/ortaklar/${partner.id}`}
                        className="text-xs font-medium text-foreground hover:text-muted-foreground transition-colors"
                      >
                        Detay →
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* CTA */}
      <div className="mt-20 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-foreground rounded-2xl p-8 text-background">
          <h3
            className="text-2xl"
            style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
          >
            Bu ağa katılmak ister misin?
          </h3>
          <p className="text-background/70 mt-3 text-sm leading-relaxed">
            Seçilmiş partnerlerimiz arasına katılmak için başvurunu ilet.
            Her yıl sınırlı sayıda yeni partner kabul ediyoruz.
          </p>
          <Link
            href="/basvuru/partner"
            className="inline-flex mt-6 items-center gap-2 bg-background text-foreground px-6 py-3 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Partner Başvurusu Yap
          </Link>
        </div>
        <div className="bg-[oklch(0.975_0.006_80)] rounded-2xl p-8">
          <h3
            className="text-2xl text-foreground"
            style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
          >
            Etkinliğin için en uygun partnerleri bulalım.
          </h3>
          <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
            Deneyim planlayıcısını kullan, ihtiyacına göre öneriler sunalım.
          </p>
          <Link
            href="/planla"
            className="inline-flex mt-6 items-center gap-2 bg-foreground text-background px-6 py-3 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Deneyimini Tasarla
          </Link>
        </div>
      </div>
    </div>
  );
}
