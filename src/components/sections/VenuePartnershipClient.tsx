"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const BENEFITS = [
  {
    icon: "🤝",
    title: "Müşterinizin güvenini pekiştirin",
    desc: "\"Müziği de biliriz\" diyerek NOQT'u önerdiğinizde müşteriniz her şeyin koordineli olduğunu hisseder. Salonunuzun değeri artar.",
  },
  {
    icon: "📈",
    title: "Sıcak lead kaynağı",
    desc: "NOQT üzerinden rezervasyon yapan çiftlere mekanınızı öneriyoruz. İki taraflı referans — herkese kazandırır.",
  },
  {
    icon: "🎵",
    title: "Sahne hazırlığı sorununuz biter",
    desc: "DJ kurulumu, ses sistemi, teknik rider — NOQT ile hepsi koordineli. Salonunuzda aksaklık yaşanmaz.",
  },
  {
    icon: "📋",
    title: "Tek iletişim noktası",
    desc: "Çiftinizle ayrı ayrı müzik koordinasyonu yerine NOQT'la tek temas noktası. Zamanınızı verimli kullanın.",
  },
];

const HOW_IT_WORKS = [
  {
    n: "01",
    title: "İletişime geçin",
    desc: "WhatsApp veya form aracılığıyla salonunuzu tanıtın. Ücretsiz, herhangi bir bağlayıcılık yok.",
  },
  {
    n: "02",
    title: "Ortaklık anlaşması",
    desc: "Karşılıklı referans modeli kuruyoruz. Salonunuz NOQT'u önerir, biz de müşterilere salonunuzu tanıtırız.",
  },
  {
    n: "03",
    title: "Senkronize çalışıyoruz",
    desc: "Etkinlik günü sahne kurulumu, teknik detaylar ve koordinasyon tamamen bizden. Siz misafirlerinizle ilgilenin.",
  },
];

const TESTIMONIALS = [
  {
    quote: "NOQT ile çalışmaya başladığımızdan beri müzik koordinasyonunda hiçbir sorun yaşamadık. Çiftlerimiz memnun, biz de rahatladık.",
    name: "Salon İşletmecisi",
    location: "Kayseri",
  },
];

export default function VenuePartnershipClient() {
  const benefitsRef = useRef(null);
  const benefitsInView = useInView(benefitsRef, { once: true, margin: "-60px" });
  const howRef = useRef(null);
  const howInView = useInView(howRef, { once: true, margin: "-60px" });

  return (
    <>
      {/* Hero */}
      <section className="bg-foreground text-background pt-32 pb-20 lg:pt-40 lg:pb-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="text-xs tracking-[0.25em] uppercase text-background/40 font-medium">
              Düğün Salonu Ortaklığı
            </span>
            <h1
              className="text-5xl lg:text-7xl mt-6 text-background leading-[1.05] tracking-tight"
              style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
            >
              Misafirlerinize en iyi{" "}
              <em className="italic opacity-70">müzik deneyimini</em>{" "}
              önerin.
            </h1>
            <p className="mt-8 text-lg text-background/60 leading-relaxed max-w-xl">
              Salonunuzdaki her düğünde müzik koordinasyonu eksiksiz olsun. Hem müşteriniz hem siz kazanın.
            </p>
            <div className="flex flex-wrap gap-4 mt-12">
              <a
                href="https://wa.me/905417997973?text=D%C3%BC%C4%9F%C3%BCn%20salonu%20olarak%20NOQT%20ortakl%C4%B1%C4%9F%C4%B1%20hakk%C4%B1nda%20bilgi%20almak%20istiyorum"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-background text-foreground px-7 py-4 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
              >
                WhatsApp&apos;tan İletişime Geçin
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
              <a
                href="mailto:booking@noqt.events?subject=Salon%20Ortakl%C4%B1%C4%9F%C4%B1"
                className="inline-flex items-center gap-2 border border-background/20 text-background px-6 py-4 rounded-full text-sm font-medium hover:bg-background/10 transition-colors"
              >
                E-posta Gönderin
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section ref={benefitsRef} className="py-20 lg:py-28 bg-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={benefitsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="max-w-xl mb-14"
          >
            <span className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-medium">
              Neden NOQT Ortaklığı?
            </span>
            <h2
              className="text-3xl lg:text-5xl mt-5 text-foreground leading-[1.1]"
              style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
            >
              İki taraf kazanır,{" "}
              <em className="italic">müşteri memnun olur.</em>
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-5">
            {BENEFITS.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 24 }}
                animate={benefitsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="rounded-2xl bg-[oklch(0.975_0.006_80)] border border-border p-7"
              >
                <span className="text-3xl mb-4 block">{b.icon}</span>
                <h3 className="font-medium text-foreground mb-2">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section ref={howRef} className="py-20 lg:py-24 bg-[oklch(0.975_0.006_80)]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={howInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <span className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-medium">
              Nasıl Çalışır
            </span>
          </motion.div>
          <div className="grid lg:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, y: 24 }}
                animate={howInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex gap-5"
              >
                <span
                  className="text-5xl text-foreground/10 leading-none shrink-0 mt-1"
                  style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)" }}
                >
                  {step.n}
                </span>
                <div>
                  <h3 className="font-medium text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      {TESTIMONIALS.map((t) => (
        <section key={t.name} className="py-20 bg-background border-t border-border">
          <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
            <svg width="32" height="22" viewBox="0 0 32 22" fill="none" className="mx-auto mb-6 text-muted-foreground/30">
              <path d="M0 22V13.2C0 9.73 .88 6.78 2.64 4.35 4.4 1.92 7.07 .4 10.67 0L12 2.2C9.87 2.73 8.27 3.73 7.2 5.2 6.13 6.67 5.6 8.27 5.6 10H12V22H0ZM20 22V13.2C20 9.73 20.88 6.78 22.64 4.35 24.4 1.92 27.07 .4 30.67 0L32 2.2C29.87 2.73 28.27 3.73 27.2 5.2 26.13 6.67 25.6 8.27 25.6 10H32V22H20Z" fill="currentColor"/>
            </svg>
            <p
              className="text-xl lg:text-2xl text-foreground leading-relaxed"
              style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
            >
              {t.quote}
            </p>
            <p className="text-sm text-muted-foreground mt-6">
              {t.name} · {t.location}
            </p>
          </div>
        </section>
      ))}

      {/* CTA */}
      <section className="py-20 lg:py-28 bg-foreground text-center">
        <div className="max-w-2xl mx-auto px-6 lg:px-8">
          <span className="text-xs tracking-[0.25em] uppercase text-background/40 font-medium">
            Ortaklık Başvurusu
          </span>
          <h2
            className="text-3xl lg:text-5xl mt-5 text-background leading-[1.1]"
            style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
          >
            Salonunuzu{" "}
            <em className="italic opacity-70">NOQT ağına ekleyin.</em>
          </h2>
          <p className="mt-5 text-background/55 leading-relaxed">
            Bağlayıcı bir yükümlülük yok. İlk görüşmede ne kazanacağınızı birlikte değerlendirelim.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <a
              href="https://wa.me/905417997973?text=D%C3%BC%C4%9F%C3%BCn%20salonu%20olarak%20NOQT%20ortakl%C4%B1%C4%9F%C4%B1%20hakk%C4%B1nda%20bilgi%20almak%20istiyorum"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-background text-foreground px-7 py-4 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp&apos;tan Başvurun
            </a>
            <a
              href="mailto:booking@noqt.events?subject=Salon%20Ortakl%C4%B1%C4%9F%C4%B1"
              className="text-sm text-background/50 hover:text-background transition-colors"
            >
              veya booking@noqt.events
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
