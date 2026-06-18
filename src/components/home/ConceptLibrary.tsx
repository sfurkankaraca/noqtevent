"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import Link from "next/link";

const concepts = [
  {
    id: "sunset-escape",
    title: "Sunset Escape",
    mood: "Altın saat · Kokteyl · Açık hava",
    description:
      "Gün batımının yumuşak ışığında, açık havada deep house melodileri eşliğinde bir kaçış deneyimi.",
    why: "Misafirlerinizi anın içine çeken atmosfer, formal olmayan ama sofistike bir tonu yakalar.",
    bg: "bg-[oklch(0.88_0.05_75)]",
    textDark: true,
    href: "/planla?konsept=sunset-escape",
  },
  {
    id: "modern-wedding",
    title: "Modern Wedding",
    mood: "Minimal · Zarif · Çağdaş",
    description:
      "Temiz çizgiler, nefes alan boşluklar ve özenle seçilmiş müzikle çerçevelenmiş bir düğün.",
    why: "Fazlalıkları atar, özü yaşatır. Yıllar sonra hala çağdaş görünür.",
    bg: "bg-[oklch(0.97_0.003_60)]",
    textDark: true,
    href: "/planla?konsept=modern-wedding",
  },
  {
    id: "disco-romance",
    title: "Disco Romance",
    mood: "Eğlenceli · Romantik · Dans odaklı",
    description:
      "Glitter top, funky basslines ve dans pistini hiç boşaltmayan bir düğün gecesi.",
    why: "Misafirler sabaha kadar dans eder. Yıllar sonra hala konuşulur.",
    bg: "bg-[oklch(0.92_0.02_320)]",
    textDark: true,
    href: "/planla?konsept=disco-romance",
  },
  {
    id: "cocktail-social",
    title: "Cocktail Social",
    mood: "Network · Sohbet · Atmosfer",
    description:
      "Doğru müzik, doğru ışık, doğru akış. İnsanların birbirini bulduğu etkinlikler.",
    why: "Kurumsal etkinlikleri kişisel hissettirmenin formülü.",
    bg: "bg-[oklch(0.94_0.01_200)]",
    textDark: true,
    href: "/planla?konsept=cocktail-social",
  },
  {
    id: "villa-weekend",
    title: "Villa Weekend",
    mood: "Lüks ve rahat · Arkadaşlar · Açık hava",
    description:
      "Havuz başı, açık bar, akustik setlerden electronic grooves'a geçiş. Tatil enerjisi.",
    why: "Özel parti konseptleri için en çok tercih ettiğimiz format.",
    bg: "bg-[oklch(0.91_0.025_160)]",
    textDark: true,
    href: "/planla?konsept=villa-weekend",
  },
  {
    id: "after-dark",
    title: "After Dark",
    motto: "Gece yarısından sonra başlar.",
    mood: "Geç gece · House müzik · After party",
    description:
      "Düğün bitti, gerçek parti şimdi başlıyor. Karanlık, enerjetik, özgür.",
    why: "After party olmayan bir düğün, yarıda bırakılmış bir hikaye.",
    bg: "bg-foreground",
    textDark: false,
    href: "/planla?konsept=after-dark",
  },
];

export default function ConceptLibrary() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <section ref={ref} className="py-24 lg:py-36 bg-background">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="flex flex-col lg:flex-row lg:items-end justify-between mb-16 gap-6"
        >
          <div>
            <span className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-medium">
              İlham Al
            </span>
            <h2
              className="text-4xl lg:text-5xl mt-4 text-foreground leading-tight"
              style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
            >
              Konsept{" "}
              <em className="italic">Kütüphanesi</em>
            </h2>
          </div>
          <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
            Her etkinlik farklıdır. Sana en yakın hissettiren konsepti seç,
            birlikte özelleştirelim.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {concepts.map((concept, i) => (
            <motion.div
              key={concept.id}
              initial={{ opacity: 0, y: 32 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              onMouseEnter={() => setHovered(concept.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <Link href={concept.href} className="block group">
                <div
                  className={`${concept.bg} rounded-2xl p-8 h-64 flex flex-col justify-between transition-all duration-300 ${
                    hovered === concept.id ? "scale-[1.02]" : ""
                  }`}
                >
                  <div>
                    <h3
                      className={`text-2xl ${concept.textDark ? "text-foreground" : "text-background"} leading-tight`}
                      style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
                    >
                      {concept.title}
                    </h3>
                    <p
                      className={`text-xs mt-2 ${concept.textDark ? "text-muted-foreground" : "text-background/60"} tracking-wide`}
                    >
                      {concept.mood}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-sm leading-relaxed ${concept.textDark ? "text-foreground/70" : "text-background/70"} line-clamp-2`}
                    >
                      {concept.description}
                    </p>
                    <div
                      className={`flex items-center gap-1 mt-4 text-xs font-medium ${concept.textDark ? "text-foreground" : "text-background"} opacity-0 group-hover:opacity-100 transition-opacity`}
                    >
                      <span>Bu konsepti seç</span>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
