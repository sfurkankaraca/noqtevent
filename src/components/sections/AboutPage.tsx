"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";

const values = [
  {
    title: "İnsan önce",
    description:
      "Teknoloji araçtır, insan amaçtır. Her kararımızda misafirlerin deneyimini merkeze alırız.",
  },
  {
    title: "Müzik duygu yaratır",
    description:
      "Doğru şarkı, doğru anda çalandığında bir anı hayata bağlar. Bunu biliriz ve buna göre planlarız.",
  },
  {
    title: "Detayda güzellik",
    description:
      "Büyük etkinlikler küçük dokunuşlarla şekillenir. Hiçbir detayı şansa bırakmayız.",
  },
  {
    title: "Seninle birlikte",
    description:
      "Müşteri değil ortak gibi çalışırız. Gece yarısı WhatsApp mesajlarını okuruz.",
  },
];

export default function AboutPage() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  return (
    <div ref={ref}>
      {/* Hero */}
      <section className="py-24 lg:py-36 bg-[oklch(0.975_0.006_80)]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-end">
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
            >
              <span className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-medium">
                Hakkımızda
              </span>
              <h1
                className="text-5xl lg:text-6xl mt-4 text-foreground leading-tight"
                style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
              >
                NOQT nedir?
              </h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              <p className="text-xl text-foreground/80 leading-relaxed">
                NOQT bir DJ ajansı değil.
              </p>
              <p className="text-muted-foreground mt-4 leading-relaxed">
                NOQT bir yaratıcı etkinlik ve deneyim stüdyosudur. İnsanları
                aynı anda, aynı hislerde buluşturan deneyimler yaratıyoruz.
                Müzik, atmosfer ve insan enerjisini bir araya getiriyoruz.
              </p>
              <p className="text-muted-foreground mt-4 leading-relaxed">
                2025 yılında kurulan NOQT, ilk yılında 35 etkinliği başarıyla
                tamamladı. Her etkinlikte biriktirdiğimiz deneyimle büyüyor,
                her müşteriyle daha iyi hale geliyoruz.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* What we do */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div>
              <h2
                className="text-3xl text-foreground"
                style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
              >
                Ne yapıyoruz?
              </h2>
            </div>
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-8">
              {[
                { title: "Planlama", text: "Etkinliğini baştan sona tasarlar, doğru hizmetleri bir araya getiririz." },
                { title: "Müzik", text: "Kadromuzdan sanatçılarla veya özel isteklerinizle doğru seti kurgularız." },
                { title: "Teknik", text: "Ses sistemi, ışık tasarımı ve sahne kurulumunu titizlikle hallederiz." },
                { title: "Ekosistem", text: "50'yi aşkın partnerimizle mekan, çiçek, catering ve daha fazlasını organize ederiz." },
              ].map((item) => (
                <div key={item.title}>
                  <h3 className="font-medium text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-foreground text-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <h2
            className="text-4xl text-background mb-16"
            style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
          >
            Değerlerimiz
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, i) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 24 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.1 }}
              >
                <h3 className="font-medium text-background text-lg mb-3">{value.title}</h3>
                <p className="text-sm text-background/60 leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Numbers */}
      <section className="py-24 bg-[oklch(0.975_0.006_80)]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { value: "35", label: "Gerçekleştirilen Etkinlik" },
              { value: "2025", label: "Kuruluş Yılı" },
              { value: "50+", label: "Seçilmiş Partner" },
              { value: "98%", label: "Müşteri Memnuniyeti" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div
                  className="text-5xl text-foreground font-light"
                  style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)" }}
                >
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground mt-2 tracking-wide">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-background">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2
            className="text-4xl text-foreground"
            style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
          >
            Seninle çalışmak isteriz.
          </h2>
          <p className="text-muted-foreground mt-4">
            Etkinliğin büyük ya da küçük olsun. Her deneyim bize göre eşit değerde.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <Link
              href="/planla"
              className="inline-flex items-center gap-2 bg-foreground text-background px-7 py-4 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Deneyimini Tasarla
            </Link>
            <Link
              href="/iletisim"
              className="inline-flex items-center gap-2 border border-border text-foreground px-7 py-4 rounded-full text-sm font-medium hover:border-foreground/40 transition-colors"
            >
              Bize Ulaş
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-accent/30">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Topluluğumuz</p>
          <h2
            className="text-2xl md:text-3xl text-foreground"
            style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
          >
            DJ olmak veya topluluğa katılmak ister misin?
          </h2>
          <p className="text-muted-foreground mt-3 text-sm max-w-md mx-auto">
            noqta.club; DJ ve prodüksiyon eğitimi, elektronik müzik topluluğu ve etkinlik deneyimi sunan platformumuz.
          </p>
          <a
            href="https://www.noqta.club"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-6 border border-border text-foreground px-7 py-3.5 rounded-full text-sm font-medium hover:bg-accent transition-colors"
          >
            noqta.club'u keşfet ↗
          </a>
        </div>
      </section>
    </div>
  );
}
