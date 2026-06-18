"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { MapPin } from "lucide-react";

const partnerCategories = [
  "Mekan",
  "Otel",
  "Catering",
  "Fotoğraf",
  "Video",
  "Çiçek Tasarım",
  "Dekorasyon",
  "Gelinlik",
  "Saç & Makyaj",
  "Ulaşım",
  "Konaklama",
  "Balayı",
];

const partners = [
  {
    id: "villa-bosphorus",
    name: "Villa Bosphorus",
    category: "Mekan",
    location: "Bebek, İstanbul",
    description: "Boğaz manzaralı özel villa. 150 kişiye kadar etkinlik kapasitesi.",
    tags: ["Villa", "Açık Hava", "Boğaz Manzarası"],
    color: "bg-[oklch(0.88_0.05_75)]",
  },
  {
    id: "soho-house-istanbul",
    name: "Çırağan Palace",
    category: "Otel",
    location: "Beşiktaş, İstanbul",
    description: "Osmanlı mirasıyla çağdaş lüksü buluşturan ikonik saray oteli.",
    tags: ["Otel", "Lüks", "Tarihi"],
    color: "bg-[oklch(0.94_0.01_200)]",
  },
  {
    id: "kavaklidere",
    name: "Kavaklıdere Bağ Evi",
    category: "Mekan",
    location: "Urla, İzmir",
    description: "Ege'nin kalbinde bağ ve zeytin bahçeleriyle çevrili muhteşem açık hava mekanı.",
    tags: ["Bağ", "Açık Hava", "Doğa"],
    color: "bg-[oklch(0.91_0.025_160)]",
  },
  {
    id: "beymen-catering",
    name: "Loft Catering",
    category: "Catering",
    location: "İstanbul",
    description: "Modern Türk mutfağı ve dünya lezzetlerini buluşturan premium catering hizmeti.",
    tags: ["Catering", "Modern", "Premium"],
    color: "bg-[oklch(0.97_0.003_60)]",
  },
  {
    id: "aylin-photo",
    name: "Aylin Çelik Photography",
    category: "Fotoğraf",
    location: "İstanbul & Yurt İçi",
    description: "Editorial yaklaşımı ve doğal anları yakalama konusundaki ustalığıyla tanınan.",
    tags: ["Editorial", "Düğün", "Portre"],
    color: "bg-[oklch(0.92_0.02_320)]",
  },
  {
    id: "frame-films",
    name: "Frame Films",
    category: "Video",
    location: "İstanbul",
    description: "Sinematik düğün ve etkinlik videoları. Multi-kamera üretim.",
    tags: ["Sinematik", "Düğün", "Etkinlik"],
    color: "bg-[oklch(0.90_0.04_55)]",
  },
  {
    id: "botanica-floral",
    name: "Botanica Floral",
    category: "Çiçek Tasarım",
    location: "İstanbul",
    description: "Mevsimsel ve sürdürülebilir çiçek tasarımları. Minimalist ve lüks estetik.",
    tags: ["Minimal", "Sürdürülebilir", "Lüks"],
    color: "bg-[oklch(0.93_0.015_130)]",
  },
  {
    id: "atelier-form",
    name: "Atelier Form",
    category: "Gelinlik",
    location: "Nişantaşı, İstanbul",
    description: "El işçiliğiyle üretilen özel tasarım gelinlikler. Her beden, her bütçe.",
    tags: ["Özel Tasarım", "El İşçiliği", "Atölyemiz"],
    color: "bg-[oklch(0.96_0.005_60)]",
  },
];

export default function PartnersPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = partners.filter(
    (p) => !activeCategory || p.category === activeCategory
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
        {partnerCategories.map((cat) => (
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

      {/* Partner grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((partner, i) => (
          <motion.div
            key={partner.id}
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
          >
            <div className="bg-card border border-border rounded-2xl overflow-hidden hover:border-foreground/20 hover:shadow-md transition-all group">
              {/* Visual */}
              <div className={`${partner.color} h-40 flex items-end p-4`}>
                <span className="text-xs font-medium px-2.5 py-1 bg-background/80 backdrop-blur-sm rounded-full text-foreground">
                  {partner.category}
                </span>
              </div>

              <div className="p-5">
                <h3 className="font-medium text-foreground">{partner.name}</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <MapPin size={11} className="text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">{partner.location}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-3 leading-relaxed line-clamp-2">
                  {partner.description}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {partner.tags.map((tag) => (
                    <span key={tag} className="text-xs px-2 py-0.5 bg-secondary rounded-full text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Partner apply CTA */}
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
            href="/iletisim?konu=partner"
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
