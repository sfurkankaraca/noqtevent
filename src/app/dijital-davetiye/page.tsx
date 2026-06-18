import type { Metadata } from "next";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dijital Davetiye",
  description: "noqt.co/isim-isim formatında kişisel mikrositeler. RSVP, playlist, konum ve daha fazlası.",
};

export default function Page() {
  return (
    <>
      <Navigation />
      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-24">
          {/* Header */}
          <div className="mb-16 max-w-2xl">
            <span className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-medium">
              Ürün
            </span>
            <h1
              className="text-5xl lg:text-6xl mt-4 text-foreground leading-tight"
              style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
            >
              Dijital{" "}
              <em className="italic">Davetiye</em>
            </h1>
            <p className="text-muted-foreground mt-6 leading-relaxed">
              Kağıt davetiye yerine; kişisel hikayeni, müziğini ve tüm bilgilerini
              bir arada sunan zarif bir mikrosite.
            </p>
          </div>

          {/* Example URL */}
          <div className="bg-foreground text-background rounded-2xl p-8 lg:p-12 mb-16">
            <p className="text-background/50 text-sm mb-3">Örnek adres</p>
            <p className="text-3xl lg:text-4xl font-light tracking-wide">
              noqt.co/
              <em
                className="italic text-background/60"
                style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)" }}
              >
                ayse-ali
              </em>
            </p>
            <p className="text-background/60 text-sm mt-4">
              Her çift için tamamen özelleştirilmiş, paylaşılabilir link.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
            {[
              {
                title: "Hikayeniz",
                description: "Nasıl tanıştınız? Ne zaman evleniyorsunuz? Fotoğraflar ve metin.",
              },
              {
                title: "RSVP",
                description: "Misafirler davetiyeden doğrudan katılım onayı verebilir.",
              },
              {
                title: "Konum & Harita",
                description: "Mekan bilgisi, Google Maps entegrasyonu ve yol tarifi.",
              },
              {
                title: "Dress Code",
                description: "Kıyafet rehberi ve renk paletinizi paylaşın.",
              },
              {
                title: "Playlist",
                description: "Spotify entegrasyonu ile etkinlik öncesi atmosfer yaratın.",
              },
              {
                title: "Program",
                description: "Gün akışını saat saat paylaşın. Misafirler hazırlıklı gelir.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-card border border-border rounded-2xl p-6 hover:border-foreground/20 transition-colors"
              >
                <h3 className="font-medium text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="bg-[oklch(0.975_0.006_80)] rounded-2xl p-10 text-center">
            <h2
              className="text-3xl text-foreground"
              style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
            >
              Dijital davetiyeni oluşturalım.
            </h2>
            <p className="text-muted-foreground mt-3 text-sm">
              NOQT etkinlik paketine dahil ya da bağımsız hizmet olarak alınabilir.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <Link
                href="/planla"
                className="inline-flex items-center gap-2 bg-foreground text-background px-7 py-4 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Etkinliğime Ekle
              </Link>
              <Link
                href="/iletisim"
                className="inline-flex items-center gap-2 border border-border text-foreground px-7 py-4 rounded-full text-sm font-medium hover:border-foreground/40 transition-colors"
              >
                Bilgi Al
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
