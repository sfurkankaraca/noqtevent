"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

const cards = [
  { src: "/brand-1.png", alt: "Kimse dans etmek zorunda değil. Ama herkes iyi hissetmeli." },
  { src: "/brand-2.png", alt: "Kurumsal olmak sıkıcı olmak zorunda değil." },
  { src: "/brand-3.png", alt: "Kulübe gitmedik. Kulübü getirdik." },
  { src: "/brand-4.png", alt: "Her düğünün müziği olur. Bazılarının soundtrack'i." },
  { src: "/brand-5.png", alt: "After party değil. Asıl parti." },
  { src: "/brand-6.png", alt: "Tek geceye sığmadık." },
  { src: "/brand-7.png", alt: "Kapılar açıldı. Atmosfer kuruldu." },
  { src: "/brand-8.png", alt: "Küçük detaylar, büyük anılar." },
  { src: "/brand-9.png", alt: "Sizin hayaliniz, bizim uzmanlığımız." },
  { src: "/brand-10.png", alt: "Her anı özenle planlar, kusursuz yaşatırız." },
];

// Duplicate for seamless loop
const allCards = [...cards, ...cards];

export default function BrandFeed() {
  return (
    <section className="py-20 bg-background overflow-hidden">
      {/* Section label */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 mb-10">
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs tracking-[0.3em] uppercase text-muted-foreground font-medium whitespace-nowrap">
            Deneyimler Anlatıyor
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>
      </div>

      {/* Marquee track */}
      <div className="relative">
        {/* Left fade */}
        <div className="absolute left-0 top-0 bottom-0 w-16 lg:w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        {/* Right fade */}
        <div className="absolute right-0 top-0 bottom-0 w-16 lg:w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        <motion.div
          className="flex gap-4 w-max"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            duration: 40,
            ease: "linear",
            repeat: Infinity,
          }}
        >
          {allCards.map((card, i) => (
            <div
              key={i}
              className="relative flex-shrink-0 w-56 h-56 lg:w-72 lg:h-72 rounded-2xl overflow-hidden"
            >
              <Image
                src={card.src}
                alt={card.alt}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 224px, 288px"
              />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
