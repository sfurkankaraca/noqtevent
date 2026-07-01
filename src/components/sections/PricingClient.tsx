"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";

const BUDGET_TIERS = [
  {
    range: "₺3.000 – ₺8.000",
    label: "Başlangıç",
    emoji: "🎵",
    desc: "Kişisel DJ seti, taşınabilir ses sistemi. Küçük mekanlara ve özel partilere uygun.",
    includes: ["DJ (3-4 saat)", "Taşınabilir ses sistemi", "Şarkı listesi planlaması"],
    best: ["Doğum günü", "Küçük özel parti", "Küçük nişan"],
    color: "bg-[oklch(0.94_0.012_200)]",
  },
  {
    range: "₺8.000 – ₺18.000",
    label: "Standart",
    emoji: "🎧",
    desc: "Profesyonel DJ, tam kapsamlı ses sistemi, ışık donanımı. Orta ölçekli düğün ve etkinlikler.",
    includes: ["Profesyonel DJ (4-5 saat)", "Tam ses sistemi & subwoofer", "Işık donanımı", "Teknik operatör"],
    best: ["Nişan", "Düğün (orta salon)", "Kına gecesi", "Yıldönümü"],
    color: "bg-[oklch(0.975_0.006_80)]",
    featured: true,
  },
  {
    range: "₺18.000 – ₺40.000+",
    label: "Premium",
    emoji: "✨",
    desc: "Deneyimli DJ + canlı müzisyen, premium ses & ışık, etkinlik koordinatörü dahil.",
    includes: [
      "Headliner DJ (5+ saat)",
      "Canlı müzisyen (klarnet, keman vb.)",
      "Premium ses & ışık sistemi",
      "Etkinlik koordinatörü",
      "Fotoğrafçı opsiyonu",
    ],
    best: ["Büyük düğün", "Festival & kulüp gecesi", "Kurumsal etkinlik", "VIP parti"],
    color: "bg-[oklch(0.13_0.01_260)]",
    dark: true,
  },
];

const FACTORS = [
  { factor: "Mekan büyüklüğü", impact: "Büyük salon → daha güçlü ses sistemi gereksinimi" },
  { factor: "Etkinlik süresi", impact: "Her ekstra saat ücrete eklenir" },
  { factor: "Sanatçı deneyimi", impact: "Resident vs. headliner DJ arasında fark var" },
  { factor: "Tarih", impact: "Yaz ve yılbaşı dönemi yoğun talep → erken rezervasyon şart" },
  { factor: "Canlı müzisyen", impact: "DJ + klarnet/keman kombinasyonu premium ekler" },
  { factor: "Teknik rider", impact: "Kendi ekipmanını getiren DJ mi, kiralık mı?" },
];

const FAQ = [
  {
    q: "Fiyata KDV dahil mi?",
    a: "Bireysel etkinliklerde genellikle KDV'siz fiyat verilir. Kurumsal etkinliklerde fatura ve KDV ayrıca belirtilir.",
  },
  {
    q: "Depozito alıyor musunuz?",
    a: "Evet, rezervasyon onayı için toplam ücretin %30–50'si kapora olarak alınır. Kalan tutar etkinlik günü veya öncesinde ödenir.",
  },
  {
    q: "İptal veya tarih değişikliği mümkün mü?",
    a: "30 gün öncesine kadar iade veya tarih değişikliği yapılabilir. Sözleşmede detaylı koşullar belirtilir.",
  },
  {
    q: "Ses sistemi fiyata dahil mi?",
    a: "Standart ve premium paketlerde ses sistemi dahildir. Başlangıç paketinde mekan ses sistemini kullanabilirsiniz ya da ekleme ücretli yapılır.",
  },
  {
    q: "Kayseri dışına hizmet veriyor musunuz?",
    a: "Evet. Nevşehir, Kapadokya ve çevre illere hizmet veriyoruz. Ulaşım mesafesine göre yol ücreti eklenir.",
  },
];

export default function PricingClient() {
  const tierRef = useRef(null);
  const tierInView = useInView(tierRef, { once: true, margin: "-60px" });
  const faqRef = useRef(null);
  const faqInView = useInView(faqRef, { once: true, margin: "-60px" });

  return (
    <>
      {/* Hero */}
      <section className="bg-foreground text-background pt-32 pb-20 lg:pt-40 lg:pb-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="text-xs tracking-[0.25em] uppercase text-background/40 font-medium">
              Fiyat & Bütçe Rehberi
            </span>
            <h1
              className="text-5xl lg:text-7xl mt-6 text-background leading-[1.05] tracking-tight"
              style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
            >
              Bütçenizi{" "}
              <em className="italic opacity-70">doğru planlayın.</em>
            </h1>
            <p className="mt-8 text-lg text-background/60 leading-relaxed max-w-xl">
              Kesin fiyat etkinlik detaylarına göre şekillenir. Bu rehber, bütçenizi planlarken gerçekçi bir çerçeve çizmenize yardımcı olur.
            </p>
            <p className="mt-4 text-sm text-background/35">
              Aşağıdaki aralıklar Kayseri & Nevşehir bölgesi için 2025 yılı referans değerleridir.
            </p>
          </div>
        </div>
      </section>

      {/* Budget tiers */}
      <section ref={tierRef} className="py-20 lg:py-28 bg-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={tierInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <span className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-medium">
              Bütçe Seviyeleri
            </span>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-5">
            {BUDGET_TIERS.map((tier, i) => {
              const text = tier.dark ? "text-white" : "text-foreground";
              const muted = tier.dark ? "text-white/50" : "text-foreground/50";
              const border = tier.dark ? "border-white/10" : "border-black/8";
              const tagCls = tier.dark
                ? "text-white/40 border-white/15"
                : tier.featured
                ? "bg-foreground text-background border-foreground"
                : "text-foreground/45 border-black/12";
              const divider = tier.dark ? "border-white/10" : "border-black/8";

              return (
                <motion.div
                  key={tier.label}
                  initial={{ opacity: 0, y: 28 }}
                  animate={tierInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.55, delay: i * 0.1 }}
                  className={`rounded-2xl ${tier.color} border ${border} p-7 lg:p-8 flex flex-col`}
                >
                  <div className="flex items-start justify-between gap-3 mb-6">
                    <span className="text-3xl">{tier.emoji}</span>
                    <span className={`text-[10px] font-semibold tracking-[0.16em] uppercase border rounded-full px-3 py-1 ${tagCls}`}>
                      {tier.label}
                    </span>
                  </div>
                  <div
                    className={`text-3xl lg:text-4xl ${text} mb-1`}
                    style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
                  >
                    {tier.range}
                  </div>
                  <p className={`text-sm leading-relaxed ${muted} mt-3 mb-6`}>{tier.desc}</p>

                  <div className={`border-t ${divider} pt-5 mb-5`}>
                    <p className={`text-[11px] font-semibold tracking-[0.15em] uppercase ${muted} mb-3`}>Genellikle dahil</p>
                    <ul className="space-y-2">
                      {tier.includes.map((item) => (
                        <li key={item} className={`flex items-start gap-2.5 text-sm ${text}`}>
                          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className={`mt-0.5 shrink-0 ${muted}`}>
                            <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className={`border-t ${divider} pt-5 mt-auto`}>
                    <p className={`text-[11px] font-semibold tracking-[0.15em] uppercase ${muted} mb-2.5`}>Uygun etkinlikler</p>
                    <div className="flex flex-wrap gap-1.5">
                      {tier.best.map((b) => (
                        <span key={b} className={`text-[11px] px-2.5 py-1 rounded-full border ${border} ${muted}`}>
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Gerçek fiyat için{" "}
            <Link href="/planla" className="underline underline-offset-2 hover:text-foreground transition-colors">
              etkinlik detaylarınızı paylaşın
            </Link>
            , size özel teklif hazırlayalım.
          </p>
        </div>
      </section>

      {/* What affects price */}
      <section className="py-20 lg:py-24 bg-[oklch(0.975_0.006_80)]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-xl mb-10">
            <span className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-medium">
              Fiyatı Etkileyen Faktörler
            </span>
            <h2
              className="text-3xl lg:text-4xl mt-5 text-foreground leading-snug"
              style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
            >
              Fiyat neden değişir?
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FACTORS.map((f) => (
              <div key={f.factor} className="bg-background rounded-xl p-5 border border-border">
                <p className="font-medium text-foreground text-sm mb-1.5">{f.factor}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.impact}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section ref={faqRef} className="py-20 lg:py-28 bg-background">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={faqInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <span className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-medium">
              Sık Sorulan Sorular
            </span>
          </motion.div>
          <div className="divide-y divide-border">
            {FAQ.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={faqInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.45, delay: i * 0.07 }}
                className="py-6"
              >
                <p className="font-medium text-foreground mb-2">{item.q}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-28 bg-foreground text-center">
        <div className="max-w-2xl mx-auto px-6 lg:px-8">
          <h2
            className="text-3xl lg:text-5xl text-background leading-[1.1]"
            style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
          >
            Bütçenizi netleştirin,{" "}
            <em className="italic opacity-70">tarihi ayırtın.</em>
          </h2>
          <p className="mt-5 text-background/55 leading-relaxed">
            Etkinlik detaylarınızı paylaşın, size özel teklif 24 saat içinde hazır olsun.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <Link
              href="/planla"
              className="inline-flex items-center gap-2 bg-background text-foreground px-7 py-4 rounded-full text-sm font-medium hover:opacity-90 transition-opacity group"
            >
              Teklif Al
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="group-hover:translate-x-1 transition-transform">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <a
              href="https://wa.me/905417997973"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-background/55 hover:text-background transition-colors"
            >
              Veya WhatsApp&apos;tan sorun
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
