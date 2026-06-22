"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

type Partner = {
  id: string;
  business_name: string;
  description: string | null;
  logo_url: string | null;
  photos: string[] | null;
  category: string[] | null;
  services: string[] | null;
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

function PhotoGallery({ photos, name, bgColor }: { photos: string[]; name: string; bgColor: string }) {
  const [active, setActive] = useState(0);
  const [dragStart, setDragStart] = useState<number | null>(null);

  const prev = () => setActive((a) => Math.max(a - 1, 0));
  const next = () => setActive((a) => Math.min(a + 1, photos.length - 1));

  const onDragStart = (x: number) => setDragStart(x);
  const onDragEnd = (x: number) => {
    if (dragStart === null) return;
    const delta = dragStart - x;
    if (delta > 40) next();
    else if (delta < -40) prev();
    setDragStart(null);
  };

  return (
    <div
      className={`${bgColor} h-44 relative overflow-hidden select-none`}
      onTouchStart={(e) => onDragStart(e.touches[0].clientX)}
      onTouchEnd={(e) => onDragEnd(e.changedTouches[0].clientX)}
      onMouseDown={(e) => onDragStart(e.clientX)}
      onMouseUp={(e) => onDragEnd(e.clientX)}
    >
      <Image src={photos[active]} alt={name} fill className="object-cover transition-opacity duration-300" unoptimized />
      {photos.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
          {photos.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={(e) => { e.preventDefault(); setActive(i); }}
              className={`w-1.5 h-1.5 rounded-full transition-all ${i === active ? "bg-white scale-125" : "bg-white/50"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PartnersClient({ partners }: { partners: Partner[] }) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const allCategories = [...new Set(partners.flatMap((p) => p.category ?? []))].sort();

  const filtered = partners.filter(
    (p) => !activeCategory || (p.category ?? []).includes(activeCategory)
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
          Partner Ağımız
        </h1>
        <p className="text-muted-foreground mt-4 max-w-lg leading-relaxed">
          Her partner, kalite ve estetik anlayış konusunda titizlikle seçilmiştir.
          Etkinliğinizin her detayı için en uygun isimleri bir araya getiriyoruz.
        </p>
      </div>

      {/* Category filter */}
      {allCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-12">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-4 py-2 rounded-full text-xs font-medium border transition-all ${
              !activeCategory ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-foreground/40"
            }`}
          >
            Tümü
          </button>
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              className={`px-4 py-2 rounded-full text-xs font-medium border transition-all ${
                activeCategory === cat ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-foreground/40"
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
          <p>Bu kategoride henüz partner yok.</p>
          <button onClick={() => setActiveCategory(null)} className="mt-4 text-sm text-foreground underline">
            Tümünü göster
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((partner, i) => {
            const bgColor = BG_COLORS[i % BG_COLORS.length];
            const photos = (partner.photos ?? []).filter(Boolean);
            const services = (partner.services ?? []).filter((s) => typeof s === "string");
            const categories = partner.category ?? [];

            return (
              <motion.div
                key={partner.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <Link href={`/ortaklar/${partner.id}`} className="block bg-card border border-border rounded-2xl overflow-hidden hover:border-foreground/20 hover:shadow-md transition-all group">
                  {/* Visual */}
                  {photos.length > 0 ? (
                    <PhotoGallery photos={photos} name={partner.business_name} bgColor={bgColor} />
                  ) : (
                    <div className={`${bgColor} h-44 relative flex items-center justify-center`}>
                      {partner.logo_url && (
                        <div className="w-16 h-16 relative">
                          <Image src={partner.logo_url} alt="Logo" fill className="object-contain" unoptimized />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Logo overlay (when photos exist) */}
                  {photos.length > 0 && partner.logo_url && (
                    <div className="relative">
                      <div className="absolute -top-4 right-3 w-8 h-8 rounded-lg bg-white border border-border overflow-hidden shadow-sm">
                        <Image src={partner.logo_url} alt="Logo" fill className="object-contain p-1" unoptimized />
                      </div>
                    </div>
                  )}

                  <div className="p-5">
                    {categories.length > 0 && (
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{categories[0]}</span>
                    )}
                    <h3 className="font-medium text-foreground mt-0.5">{partner.business_name}</h3>

                    {partner.description && (
                      <p className="text-xs text-muted-foreground mt-2 leading-relaxed line-clamp-2">
                        {partner.description}
                      </p>
                    )}

                    {services.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {services.slice(0, 3).map((s, idx) => (
                          <span key={idx} className="text-[10px] px-2 py-0.5 bg-secondary rounded-full text-foreground">{s}</span>
                        ))}
                        {services.length > 3 && (
                          <span className="text-[10px] px-2 py-0.5 text-muted-foreground">+{services.length - 3}</span>
                        )}
                      </div>
                    )}

                    <div className="mt-4 pt-3 border-t border-border">
                      <span className="text-xs font-medium text-foreground group-hover:text-muted-foreground transition-colors">
                        Detay →
                      </span>
                    </div>
                  </div>
                </Link>
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
