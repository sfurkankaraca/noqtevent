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

const ALL_CATEGORIES = [
  { id: "mekan", label: "Mekan & Salon", emoji: "🏛️", desc: "Düğün salonları, açık hava alanları, villalar, butik mekanlar." },
  { id: "otel", label: "Otel", emoji: "🏨", desc: "Konaklama ve etkinlik altyapısı sunan otel partnerleri." },
  { id: "fotograf", label: "Fotoğraf", emoji: "📷", desc: "Düğün, nişan, portre ve etkinlik fotoğrafçıları." },
  { id: "video", label: "Video & Film", emoji: "🎬", desc: "Sinematik düğün ve etkinlik video prodüksiyonu." },
  { id: "cicek", label: "Çiçek & Dekorasyon", emoji: "💐", desc: "Çiçek tasarımı, masa düzeni ve mekan dekorasyonu." },
  { id: "catering", label: "Catering & Pasta", emoji: "🍽️", desc: "Yemek hizmetleri, büfe organizasyonu, düğün pastası." },
  { id: "gelinlik", label: "Gelinlik & Damat", emoji: "👗", desc: "Gelinlik, smokin, özel tasarım kıyafet atölyeleri." },
  { id: "sac-makyaj", label: "Saç & Makyaj", emoji: "💄", desc: "Gelin saçı, makyaj, cilt bakımı ve güzellik hizmetleri." },
  { id: "ulasim", label: "Ulaşım", emoji: "🚗", desc: "Gelin arabası, VIP transfer, konvoy organizasyonu." },
  { id: "davetiye", label: "Davetiye & Tasarım", emoji: "✉️", desc: "Davetiye tasarımı, baskı, dijital davetiye çözümleri." },
  { id: "konaklatma", label: "Konaklama & Balay", emoji: "🌙", desc: "Balayı otelleri, butik konaklamalar, seyahat organizasyonu." },
  { id: "organizasyon", label: "Organizasyon & Planlama", emoji: "📋", desc: "Etkinlik koordinasyonu, timeline yönetimi, lojistik." },
];

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
      className={`${bgColor} h-40 relative overflow-hidden select-none`}
      onTouchStart={(e) => onDragStart(e.touches[0].clientX)}
      onTouchEnd={(e) => onDragEnd(e.changedTouches[0].clientX)}
      onMouseDown={(e) => onDragStart(e.clientX)}
      onMouseUp={(e) => onDragEnd(e.clientX)}
    >
      <Image src={photos[active]} alt={name} fill className="object-cover transition-opacity duration-300" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
      {photos.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
          {photos.map((_, i) => (
            <button key={i} type="button" onClick={(e) => { e.preventDefault(); setActive(i); }}
              className={`w-1.5 h-1.5 rounded-full transition-all ${i === active ? "bg-white scale-125" : "bg-white/50"}`} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PartnersClient({ partners }: { partners: Partner[] }) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Group partners by normalized category
  const byCategory: Record<string, Partner[]> = {};
  for (const p of partners) {
    for (const cat of p.category ?? []) {
      const key = cat.toLowerCase().trim();
      if (!byCategory[key]) byCategory[key] = [];
      byCategory[key].push(p);
    }
  }

  // Determine which categories to show in the filtered partner list
  const visibleCategories = activeCategory
    ? ALL_CATEGORIES.filter((c) => c.id === activeCategory)
    : ALL_CATEGORIES;

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
          Düğün ve etkinliğinizin her detayı için titizlikle seçilmiş partnerler.
          Müzikten mekana, fotoğraftan çiçeğe — tek çatı altında.
        </p>
      </div>

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-2 mb-14">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-4 py-2 rounded-full text-xs font-medium border transition-all ${
            !activeCategory ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-foreground/40"
          }`}
        >
          Tümü
        </button>
        {ALL_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
            className={`px-4 py-2 rounded-full text-xs font-medium border transition-all ${
              activeCategory === cat.id ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-foreground/40"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Category sections */}
      <div className="space-y-16">
        {visibleCategories.map((cat, catIdx) => {
          const catPartners = partners.filter((p) =>
            (p.category ?? []).some((c) => c.toLowerCase().trim() === cat.id)
          );

          return (
            <div key={cat.id}>
              {/* Category header */}
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl">{cat.emoji}</span>
                <div>
                  <h2 className="font-medium text-foreground text-lg">{cat.label}</h2>
                  <p className="text-xs text-muted-foreground">{cat.desc}</p>
                </div>
                {catPartners.length > 0 && (
                  <span className="ml-auto text-xs text-muted-foreground border border-border rounded-full px-3 py-1">
                    {catPartners.length} partner
                  </span>
                )}
              </div>

              {catPartners.length > 0 ? (
                /* Real partner cards */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {catPartners.map((partner, i) => {
                    const bgColor = BG_COLORS[(catIdx + i) % BG_COLORS.length];
                    const photos = (partner.photos ?? []).filter(Boolean);
                    const services = (partner.services ?? []).filter((s) => typeof s === "string");
                    const categories = partner.category ?? [];

                    return (
                      <motion.div
                        key={partner.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: i * 0.05 }}
                      >
                        <Link href={`/ortaklar/${partner.id}`} className="block bg-card border border-border rounded-2xl overflow-hidden hover:border-foreground/20 hover:shadow-md transition-all group">
                          {photos.length > 0 ? (
                            <PhotoGallery photos={photos} name={partner.business_name} bgColor={bgColor} />
                          ) : (
                            <div className={`${bgColor} h-40 relative flex items-center justify-center`}>
                              {partner.logo_url && (
                                <div className="w-14 h-14 relative">
                                  <Image src={partner.logo_url} alt="Logo" fill className="object-contain" sizes="56px" />
                                </div>
                              )}
                            </div>
                          )}
                          {photos.length > 0 && partner.logo_url && (
                            <div className="relative">
                              <div className="absolute -top-4 right-3 w-8 h-8 rounded-lg bg-white border border-border overflow-hidden shadow-sm">
                                <Image src={partner.logo_url} alt="Logo" fill className="object-contain p-1" sizes="32px" />
                              </div>
                            </div>
                          )}
                          <div className="p-5">
                            {categories.length > 0 && (
                              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{categories[0]}</span>
                            )}
                            <h3 className="font-medium text-foreground mt-0.5">{partner.business_name}</h3>
                            {partner.description && (
                              <p className="text-xs text-muted-foreground mt-2 leading-relaxed line-clamp-2">{partner.description}</p>
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
                              <span className="text-xs font-medium text-foreground group-hover:text-muted-foreground transition-colors">Detay →</span>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                /* Coming soon placeholder */
                <div className="rounded-2xl border border-dashed border-border bg-[oklch(0.975_0.006_80)] p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">
                      {cat.label} alanında partner ekliyoruz
                    </p>
                    <p className="text-xs text-muted-foreground max-w-md">
                      {cat.desc} Bu kategoride yer almak ister misiniz?
                    </p>
                  </div>
                  <a
                    href="https://wa.me/905417997973?text=NOQT%20partner%20olmak%20istiyorum"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 inline-flex items-center gap-2 border border-border text-foreground px-5 py-2.5 rounded-full text-xs font-medium hover:border-foreground/40 transition-colors whitespace-nowrap"
                  >
                    Başvur
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="mt-24 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-foreground rounded-2xl p-8 text-background">
          <h3
            className="text-2xl"
            style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
          >
            Bu ağa katılmak ister misiniz?
          </h3>
          <p className="text-background/70 mt-3 text-sm leading-relaxed">
            Seçilmiş partnerlerimiz arasına katılmak için başvurunuzu iletin.
          </p>
          <Link
            href="/basvuru/partner"
            className="inline-flex mt-6 items-center gap-2 bg-background text-foreground px-6 py-3 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Partner Başvurusu
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
            Etkinliğimi Planla
          </Link>
        </div>
      </div>
    </div>
  );
}
