"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

type Testimonial = {
  id: string | number;
  quote: string;
  name: string;
  event?: string | null;
  initials?: string | null;
  color?: string | null;
  dark?: boolean | null;
  rating?: number | null;
};

const STATIC_TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    quote: "Düğünümüzde müzik seçimini tamamen NOQT'a bıraktık. Karşılamadan halaylara, after party'ye kadar her geçiş mükemmeldi. Misafirlerimiz sabaha kadar dans pistinden ayrılmadı.",
    name: "Selin & Mert",
    event: "Düğün — Bodrum Villa",
    initials: "SM",
    color: "bg-[oklch(0.88_0.055_65)]",
    dark: false,
    rating: 5,
  },
  {
    id: 2,
    quote: "Marka lansmanımız için Gün Batımı konseptini seçtik. Mekanın enerjisi, müzik ve atmosfer tam istediğimiz gibiydi. Konuklarımız etkinliği hâlâ konuşuyor.",
    name: "Zeynep Akar",
    event: "Marka Lansmanı — İstanbul",
    initials: "ZA",
    color: "bg-[oklch(0.93_0.006_240)]",
    dark: false,
    rating: 5,
  },
  {
    id: 3,
    quote: "Kına gecemiz için geleneksel konsept istedik, hem halaylar hem modern müzik mükemmel geçti. Annem 'bu müzisyeni nereden buldunuz' diye sordu durdu.",
    name: "Ayşe Demirkol",
    event: "Kına Gecesi — Ankara",
    initials: "AD",
    color: "bg-[oklch(0.84_0.07_40)]",
    dark: false,
    rating: 5,
  },
  {
    id: 4,
    quote: "Sunset Session organizasyonumuzda NOQT'un seçtiği set list tam isabet. Gün batımıyla başlayan müzik, geceye uzayan enerjisiyle misafirlerimizi büyüledi.",
    name: "Can Öztürk",
    event: "Sunset Session — Çeşme",
    initials: "CÖ",
    color: "bg-[oklch(0.90_0.025_320)]",
    dark: false,
    rating: 5,
  },
  {
    id: 5,
    quote: "Kurumsal yıl sonu etkinliğimizde hem profesyonel hem eğlenceli bir denge istedik. Konsept önerisi ve uygulama harikaydı — ekibimiz çok mutlu ayrıldı.",
    name: "Deniz Kaya",
    event: "Kurumsal Etkinlik — İstanbul",
    initials: "DK",
    color: "bg-[oklch(0.88_0.035_120)]",
    dark: false,
    rating: 5,
  },
  {
    id: 6,
    quote: "After party için Kulüp Modu konseptini seçtik, sabah 4'e kadar dans ettik. DJ'in set akışı inanılmazdı, enerji hiç düşmedi.",
    name: "Berk & Sena",
    event: "After Party — İzmir",
    initials: "BS",
    color: "bg-[oklch(0.20_0.025_260)]",
    dark: true,
    rating: 5,
  },
];

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }, (_, i) => (
        <svg key={i} width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className="text-[oklch(0.75_0.12_70)]">
          <path d="M6 1l1.39 2.82L10.5 4.24l-2.25 2.19.53 3.1L6 8l-2.78 1.53.53-3.1L1.5 4.24l3.11-.42L6 1z" />
        </svg>
      ))}
    </div>
  );
}

export default function Testimonials({ testimonials }: { testimonials?: Testimonial[] }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const items = testimonials && testimonials.length > 0 ? testimonials : STATIC_TESTIMONIALS;

  return (
    <section ref={ref} className="py-24 lg:py-36 bg-[oklch(0.97_0.005_80)]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="mb-16"
        >
          <span className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-medium">
            Gerçek Deneyimler
          </span>
          <h2
            className="text-4xl lg:text-5xl mt-4 text-foreground leading-tight"
            style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
          >
            Deneyimler <em className="italic">anlatıyor</em>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 28 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: i * 0.07 }}
              className="bg-white rounded-2xl border border-border p-6 flex flex-col gap-5 hover:border-foreground/20 transition-colors"
            >
              <StarRating count={t.rating ?? 5} />

              <blockquote className="text-sm text-foreground/80 leading-relaxed flex-1">
                &ldquo;{t.quote}&rdquo;
              </blockquote>

              <div className="flex items-center gap-3 pt-1 border-t border-border">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold ${t.color ?? "bg-secondary"} ${t.dark ? "text-white" : "text-foreground"}`}
                >
                  {t.initials ?? t.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground leading-tight">{t.name}</p>
                  {t.event && <p className="text-xs text-muted-foreground mt-0.5">{t.event}</p>}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
