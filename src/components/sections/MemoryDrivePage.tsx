"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import { QrCode, Upload, Play, Archive, Camera, Film, Lock, Smartphone } from "lucide-react";

const features = [
  {
    icon: QrCode,
    title: "QR Kod ile Anında Yükleme",
    description: "Masalara ve mekan girişine QR kod kartları koyuyoruz. Misafirler uygulama indirmeden fotoğraf yükler.",
  },
  {
    icon: Camera,
    title: "Misafir Fotoğrafları",
    description: "Profesyonel fotoğrafçının yakalayamadığı o spontan anlar — misafirlerinizin gözünden.",
  },
  {
    icon: Film,
    title: "Düğün Vlogu",
    description: "Gün içindeki tüm kısa videolar bir araya gelir, unutulmaz bir vlog oluşur.",
  },
  {
    icon: Lock,
    title: "Özel Galeri",
    description: "Sadece senin ve misafirlerinin görebileceği, şifreli özel galeri.",
  },
  {
    icon: Play,
    title: "Multi-Kamera DJ Set Kaydı",
    description: "DJ setini çoklu kamera açısıyla yüksek kalitede kaydediyoruz. Tam gece bir arşivde.",
  },
  {
    icon: Archive,
    title: "Etkinlik Arşivi",
    description: "Tüm içerikler 5 yıl boyunca güvenle saklanır. İstediğin zaman indir, paylaş.",
  },
  {
    icon: Smartphone,
    title: "Mobil Uyumlu",
    description: "Galeriyi tüm cihazlardan kolayca açabilir, sevdiklerinle paylaşabilirsin.",
  },
  {
    icon: Upload,
    title: "Toplu İndirme",
    description: "Tüm anları zip olarak indir ya da Google Photos / iCloud'a otomatik senkronize et.",
  },
];

export default function MemoryDrivePage() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  return (
    <div ref={ref}>
      {/* Hero */}
      <div className="bg-foreground text-background py-24 lg:py-36">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7 }}
            >
              <span className="text-xs tracking-[0.25em] uppercase text-background/40 font-medium">
                Ürün
              </span>
              <h1
                className="text-5xl lg:text-7xl mt-4 text-background leading-tight"
                style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
              >
                Memory{" "}
                <em className="italic">Drive</em>
              </h1>
              <p className="text-background/70 mt-6 text-lg leading-relaxed">
                Etkinliğinin her anını tek bir yerde topla. Profesyonel
                içerikten misafir çekimlerine, DJ set kaydından gece vloguna.
              </p>
              <div className="flex flex-wrap gap-4 mt-10">
                <Link
                  href="/planla"
                  className="inline-flex items-center gap-2 bg-background text-foreground px-7 py-4 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Etkinliğime Ekle
                </Link>
                <Link
                  href="/iletisim"
                  className="inline-flex items-center gap-2 border border-background/30 text-background px-7 py-4 rounded-full text-sm font-medium hover:border-background/60 transition-colors"
                >
                  Daha Fazla Bilgi
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="py-24 lg:py-32 bg-[oklch(0.975_0.006_80)]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mb-16"
          >
            <h2
              className="text-4xl text-foreground"
              style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
            >
              Nasıl çalışır?
            </h2>
            <p className="text-muted-foreground mt-4 max-w-lg leading-relaxed">
              Etkinlik gününde hiçbir şeyi kaçırmıyorsun. Her an otomatik olarak toplanır ve sana sunulur.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { step: "01", text: "QR kodlar etkinlik mekanına yerleştirilir." },
              { step: "02", text: "Misafirler telefonlarıyla QR kodu okutup içerik yükler." },
              { step: "03", text: "Tüm içerikler gerçek zamanlı olarak galerine düşer." },
              { step: "04", text: "Etkinlik sonrası tam arşive erişirsin." },
            ].map((item) => (
              <div key={item.step} className="bg-card border border-border rounded-2xl p-6">
                <div className="text-3xl font-light text-muted-foreground/40 mb-4">
                  {item.step}
                </div>
                <p className="text-sm text-foreground leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="py-24 lg:py-32 bg-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <h2
            className="text-4xl text-foreground mb-12"
            style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
          >
            Özellikler
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.05 * i }}
                  className="bg-card border border-border rounded-2xl p-6 hover:border-foreground/20 transition-colors"
                >
                  <Icon size={22} className="text-muted-foreground mb-4" />
                  <h3 className="font-medium text-foreground text-sm mb-2">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-24 bg-[oklch(0.975_0.006_80)]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2
            className="text-4xl text-foreground"
            style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
          >
            Anların kalıcı olsun.
          </h2>
          <p className="text-muted-foreground mt-4">
            Memory Drive, NOQT etkinlik paketlerine dahil edilebilir veya bağımsız hizmet olarak alınabilir.
          </p>
          <Link
            href="/planla"
            className="inline-flex items-center gap-2 mt-8 bg-foreground text-background px-8 py-4 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Etkinliğime Ekle
          </Link>
        </div>
      </div>
    </div>
  );
}
