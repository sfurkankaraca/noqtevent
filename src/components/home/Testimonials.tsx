"use client";

import { motion } from "framer-motion";
import { useRef } from "react";

type Testimonial = {
  id: number;
  quote: string;
  name: string;
  event: string;
  initials: string;
  color: string;
  dark?: boolean;
};

const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    quote: "Düğünümüzde her anı müzikle taçlandırdılar. Karşılamadan halaylara, after party'ye kadar pist hiç boşalmadı. Misafirlerimiz hâlâ o geceyi konuşuyor.",
    name: "Elif & Burak Çelik",
    event: "Düğün — Kayseri",
    initials: "EB",
    color: "bg-[oklch(0.88_0.055_65)]",
  },
  {
    id: 2,
    quote: "Kınamız için geleneksel ve modern karışımı istedik. DJ hem halayı hem de yeni nesil şarkıları o kadar güzel geçirdi ki herkes şaşırdı.",
    name: "Selin Arslan",
    event: "Kına Gecesi — Kayseri",
    initials: "SA",
    color: "bg-[oklch(0.84_0.07_40)]",
  },
  {
    id: 3,
    quote: "Kafemizin açılış partisinde tam istediğimiz atmosferi yarattılar. Müşterilerimiz geceyi çok beğendi, sosyal medyada büyük ilgi gördü.",
    name: "Mavi Kahve",
    event: "Cafe Açılışı — Kayseri Kocasinan",
    initials: "MK",
    color: "bg-[oklch(0.93_0.006_240)]",
  },
  {
    id: 4,
    quote: "Nikah törenimizde ilk dansımız için özel bir set hazırladılar. O an için seçtikleri şarkı tam hayalimizdekileri yansıttı.",
    name: "Merve & Oğuz Şahin",
    event: "Nikah & Düğün — Kayseri",
    initials: "MO",
    color: "bg-[oklch(0.90_0.025_320)]",
  },
  {
    id: 5,
    quote: "Yıl sonu çalışan gala yemeğimiz için NOQT ile çalıştık. Hem profesyonellik hem eğlence dengesini mükemmel kurdular. Ekibimiz çok mutlu ayrıldı.",
    name: "Erciyes Teknoloji A.Ş.",
    event: "Kurumsal Gala — Kayseri",
    initials: "ET",
    color: "bg-[oklch(0.88_0.035_120)]",
  },
  {
    id: 6,
    quote: "After party'mizi sabah 4'e kadar sürdürdük. DJ'in seti inanılmazdı, enerji hiç düşmedi. Kayseri'de bu kalitede bir after party ilk kez gördük.",
    name: "Caner & Zehra Doğan",
    event: "After Party — Kayseri",
    initials: "CZ",
    color: "bg-[oklch(0.20_0.025_260)]",
    dark: true,
  },
  {
    id: 7,
    quote: "Restoranımızın özel gecesi için muhteşem bir lounge seti hazırladılar. Misafirlerimiz akşam boyunca ne kadar güzel bir atmosfer olduğunu söyledi.",
    name: "Lezzet Nokta Restaurant",
    event: "Özel Gece — Kayseri Melikgazi",
    initials: "LN",
    color: "bg-[oklch(0.91_0.025_160)]",
  },
  {
    id: 8,
    quote: "Nişanımızdaki müzik seçimi harikaydı. Önceden tercihlerimizi dinlediler ve tam beklediğimiz konsepti hazırladılar. Herkese tavsiye ederim.",
    name: "Duygu & Emre Yıldız",
    event: "Nişan Töreni — Kayseri",
    initials: "DE",
    color: "bg-[oklch(0.94_0.01_200)]",
  },
  {
    id: 9,
    quote: "Butik otelimizde düzenlenen özel bir buluşma için sesli ortam istedik. Gelen misafirlerimiz ambiyansı çok beğendi, tekrar çalışacağız.",
    name: "Erciyes Boutique Hotel",
    event: "Özel Etkinlik — Kayseri",
    initials: "EH",
    color: "bg-[oklch(0.88_0.05_75)]",
  },
  {
    id: 10,
    quote: "Mezuniyet partimizde bütün arkadaşlarımız sabaha kadar dans etti. DJ tam bizim kuşağın müziğini çaldı, unutulmaz bir gece oldu.",
    name: "Erciyes Üniversitesi Mezunları",
    event: "Mezuniyet Partisi — Kayseri",
    initials: "EU",
    color: "bg-[oklch(0.90_0.04_55)]",
  },
  {
    id: 11,
    quote: "Kız isteme törenimizde hafif bir müzik eşliği istedik. Ortamı gergin olmaktan çıkarıp çok sıcak ve samimi bir hale getirdi.",
    name: "Fatma & Ali Koçak",
    event: "Kız İsteme — Kayseri",
    initials: "FA",
    color: "bg-[oklch(0.93_0.015_130)]",
  },
  {
    id: 12,
    quote: "Mağazamızın 10. yıl kutlamasında NOQT ile çalıştık. Müşterilerimiz ve çalışanlarımız için harika bir gece oldu, herkes çok eğlendi.",
    name: "Anadolu Home Mağazacılık",
    event: "10. Yıl Kutlaması — Kayseri",
    initials: "AH",
    color: "bg-[oklch(0.92_0.02_320)]",
  },
];

const ROW1 = TESTIMONIALS.slice(0, 6);
const ROW2 = TESTIMONIALS.slice(6, 12);

function StarRating() {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className="text-[oklch(0.75_0.12_70)]">
          <path d="M6 1l1.39 2.82L10.5 4.24l-2.25 2.19.53 3.1L6 8l-2.78 1.53.53-3.1L1.5 4.24l3.11-.42L6 1z" />
        </svg>
      ))}
    </div>
  );
}

function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <div
      className="flex-shrink-0 w-72 bg-white rounded-2xl border border-border p-5 flex flex-col gap-4 mx-3"
      style={{ minHeight: 200 }}
    >
      <StarRating />
      <blockquote className="text-sm text-foreground/80 leading-relaxed flex-1">
        &ldquo;{t.quote}&rdquo;
      </blockquote>
      <div className="flex items-center gap-3 pt-1 border-t border-border">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold ${t.color} ${t.dark ? "text-white" : "text-foreground"}`}
        >
          {t.initials}
        </div>
        <div>
          <p className="text-sm font-medium text-foreground leading-tight">{t.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t.event}</p>
        </div>
      </div>
    </div>
  );
}

function MarqueeRow({ items, reverse = false }: { items: Testimonial[]; reverse?: boolean }) {
  const doubled = [...items, ...items];
  return (
    <div className="overflow-hidden">
      <motion.div
        className="flex"
        animate={{ x: reverse ? ["0%", "50%"] : ["0%", "-50%"] }}
        transition={{ duration: 35, ease: "linear", repeat: Infinity }}
      >
        {doubled.map((t, i) => (
          <TestimonialCard key={`${t.id}-${i}`} t={t} />
        ))}
      </motion.div>
    </div>
  );
}

export default function Testimonials({ testimonials: _ }: { testimonials?: unknown[] }) {
  const ref = useRef(null);

  return (
    <section ref={ref} className="py-24 lg:py-36 bg-[oklch(0.97_0.005_80)] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 mb-16">
        <span className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-medium">
          Gerçek Deneyimler
        </span>
        <h2
          className="text-4xl lg:text-5xl mt-4 text-foreground leading-tight"
          style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
        >
          Deneyimler <em className="italic">anlatıyor</em>
        </h2>
      </div>

      <div className="space-y-4">
        <MarqueeRow items={ROW1} />
        <MarqueeRow items={ROW2} reverse />
      </div>
    </section>
  );
}
