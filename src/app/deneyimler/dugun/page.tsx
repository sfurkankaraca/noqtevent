import type { Metadata } from "next";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Düğün DJ & Müzik Deneyimi — NOQT",
  description: "Düğününüzün her anı için doğru müzik. Nikah, kokteyl ve dansdan sonrasına kadar profesyonel DJ ve ses hizmeti.",
  alternates: { canonical: "https://www.noqt.events/deneyimler/dugun" },
};

const moments = [
  { time: "Nikah & Giriş", desc: "Yüzük töreni ve gelin girişine özel seçilmiş parçalar. Her çift için özgün." },
  { time: "Kokteyl Saatleri", desc: "Misafirleri ısıtacak ambient ve chill müzik — sohbeti bastırmadan atmosfer kurar." },
  { time: "Yemek", desc: "Enerjiyi dengeli tutan background müzik; ne çok yüksek, ne de kaybolur." },
  { time: "Dans & Parti", desc: "Gece yarısına kadar süren, kitleyi sahada tutan set. Duygu + enerji birlikte." },
];

const includes = [
  "Ücretsiz ön görüşme & konsept planlama",
  "Kişiye özel set listesi hazırlığı",
  "Profesyonel ses sistemi kurulumu",
  "Işık yönetimi (talep üzerine)",
  "Mekan teknik keşif",
  "Etkinlik günü erken kurulum",
  "Gece yarısı desteği",
];

export default function Page() {
  return (
    <>
      <Navigation />
      <main className="pt-20 bg-background text-foreground">

        {/* Hero */}
        <section className="py-24 lg:py-32 bg-[oklch(0.975_0.006_80)]">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-end">
            <div>
              <span className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-medium">Hizmet</span>
              <h1
                className="text-5xl lg:text-6xl mt-4 text-foreground leading-tight"
                style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
              >
                Düğün
              </h1>
            </div>
            <div>
              <p className="text-xl text-foreground/80 leading-relaxed">
                O gün bir kez yaşanır. Müziği şansa bırakmayın.
              </p>
              <p className="text-muted-foreground mt-4 leading-relaxed">
                Nikahtan dansa kadar her anın duygusuna uygun müzik kurgusu.
                Çiftinizin hikayesini dinleyerek set oluşturuyoruz — hazır playlist değil,
                sizin için yazılmış bir deneyim.
              </p>
              <div className="flex flex-wrap gap-4 mt-8">
                <Link href="/planla" className="inline-flex items-center gap-2 bg-foreground text-background px-7 py-4 rounded-full text-sm font-medium hover:opacity-90 transition-opacity">
                  Fiyat Teklifi Al →
                </Link>
                <Link href="/iletisim" className="inline-flex items-center gap-2 border border-border text-foreground px-7 py-4 rounded-full text-sm font-medium hover:border-foreground/40 transition-colors">
                  Soru Sor
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Moments */}
        <section className="py-20 bg-background">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <h2
              className="text-3xl text-foreground mb-12"
              style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
            >
              Gecenin her anı için ayrı bir duygu
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {moments.map((m, i) => (
                <div key={m.time} className="border-t border-border pt-6">
                  <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="font-medium text-foreground mt-3 mb-2">{m.time}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Includes */}
        <section className="py-20 bg-foreground text-background">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <h2
                className="text-3xl text-background"
                style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
              >
                Pakete dahil olanlar
              </h2>
              <p className="text-background/60 mt-4 leading-relaxed">
                Sürpriz maliyet yok. Teklif gönderdiğimizde her şey nettir.
              </p>
            </div>
            <ul className="space-y-4">
              {includes.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-background/80">
                  <span className="text-background/40 mt-0.5">→</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-[oklch(0.975_0.006_80)] text-center">
          <div className="max-w-xl mx-auto px-6">
            <h2
              className="text-3xl text-foreground"
              style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
            >
              Tarihinizi şimdiden ayırtın
            </h2>
            <p className="text-muted-foreground mt-3 text-sm">
              Popüler tarihler hızlı doluyor. Ücretsiz görüşmeyle başlayın.
            </p>
            <Link href="/planla" className="inline-flex items-center gap-2 mt-8 bg-foreground text-background px-8 py-4 rounded-full text-sm font-medium hover:opacity-90 transition-opacity">
              Ücretsiz Görüşme Başlat →
            </Link>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
