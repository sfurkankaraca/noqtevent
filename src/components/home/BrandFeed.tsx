"use client";

import { motion } from "framer-motion";

const cards = [
  { quote: "Kimse dans etmek zorunda değil. Ama herkes iyi hissetmeli.", tag: "Düğün" },
  { quote: "Kurumsal olmak sıkıcı olmak zorunda değil.", tag: "Kurumsal" },
  { quote: "Kulübe gitmedik. Kulübü getirdik.", tag: "Özel Parti" },
  { quote: "Her düğünün müziği olur. Bazılarının soundtrack'i.", tag: "Düğün" },
  { quote: "After party değil. Asıl parti.", tag: "After Parti" },
  { quote: "Tek geceye sığmadık.", tag: "Etkinlik" },
  { quote: "Kapılar açıldı. Atmosfer kuruldu.", tag: "Kokteyl" },
  { quote: "Küçük detaylar, büyük anılar.", tag: "Deneyim" },
  { quote: "Sizin hayaliniz, bizim uzmanlığımız.", tag: "NOQT" },
  { quote: "Her anı özenle planlar, kusursuz yaşatırız.", tag: "Deneyim" },
];

const COLORS = [
  "bg-[oklch(0.12_0.01_260)] text-white",
  "bg-[oklch(0.96_0.02_80)] text-foreground",
  "bg-[oklch(0.18_0.015_270)] text-white",
  "bg-[oklch(0.94_0.015_60)] text-foreground",
  "bg-foreground text-background",
  "bg-[oklch(0.97_0.01_100)] text-foreground",
  "bg-[oklch(0.15_0.02_240)] text-white",
  "bg-[oklch(0.93_0.02_40)] text-foreground",
  "bg-foreground text-background",
  "bg-[oklch(0.16_0.01_280)] text-white",
];

const allCards = [...cards, ...cards];

export default function BrandFeed() {
  return (
    <section className="py-20 bg-background overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 mb-10">
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs tracking-[0.3em] uppercase text-muted-foreground font-medium whitespace-nowrap">
            Deneyimler Anlatıyor
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-16 lg:w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 lg:w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        <motion.div
          className="flex gap-4 w-max"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 40, ease: "linear", repeat: Infinity }}
        >
          {allCards.map((card, i) => {
            const colorClass = COLORS[i % COLORS.length];
            return (
              <div
                key={i}
                className={`flex-shrink-0 w-56 h-56 lg:w-64 lg:h-64 rounded-2xl p-6 flex flex-col justify-between ${colorClass}`}
              >
                <p
                  className="text-sm lg:text-base leading-snug opacity-90"
                  style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400, fontStyle: "italic" }}
                >
                  "{card.quote}"
                </p>
                <span className="text-[10px] tracking-[0.2em] uppercase opacity-40 font-medium">
                  {card.tag}
                </span>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
