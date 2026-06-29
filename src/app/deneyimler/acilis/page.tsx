import type { Metadata } from "next";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Açılış & Lansman DJ Hizmeti — NOQT",
  description: "Mağaza açılışı, ürün lansmanı ve tanıtım etkinlikleri için ilk izlenimi kalıcı kılacak müzik deneyimi.",
  alternates: { canonical: "https://www.noqt.events/deneyimler/acilis" },
};

const formats = [
  { title: "Mağaza & Mekan Açılışı", desc: "İlk müşteriyle kurulan bağ müzikle başlar. Markanın enerjisini yansıtan açılış seti." },
  { title: "Ürün Lansmanı", desc: "Ürünün sahneye çıkış anı unutulmaz olmalı. Reveal, sunum ve kutlama — hepsine uygun kurgu." },
  { title: "Showroom & Pop-Up", desc: "Ziyaretçilerin daha uzun kalmasını sağlayan, markayla örtüşen ambient müzik." },
  { title: "VIP Davet & Basın Gecesi", desc: "Sektör temsilcileri ve medya için etkileyici ilk izlenim. Sessiz güç, yüksek etki." },
];

const includes = [
  "Marka kimliğine ve hedef kitleye özel set",
  "Ribbon cutting / reveal anı için özel müzik",
  "Profesyonel ses sistemi kurulumu",
  "Açılış öncesi teknik hazırlık",
  "İstanbul, Kayseri, Nevşehir lokasyon desteği",
  "Sosyal medya içeriğine uygun atmosfer",
  "Fatura & resmi belgelendirme",
];

export default function Page() {
  return (
    <>
      <Navigation />
      <main className="pt-20 bg-background text-foreground">

        <section className="py-24 lg:py-32 bg-[oklch(0.975_0.006_80)]">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-end">
            <div>
              <span className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-medium">Hizmet</span>
              <h1
                className="text-5xl lg:text-6xl mt-4 text-foreground leading-tight"
                style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
              >
                Açılış & Lansman
              </h1>
            </div>
            <div>
              <p className="text-xl text-foreground/80 leading-relaxed">
                İlk izlenim kalıcıdır. Müziğiniz de öyle olsun.
              </p>
              <p className="text-muted-foreground mt-4 leading-relaxed">
                Açılış günü markanızın sesini buluyoruz. Davetlilerinize o ilk
                "vay be" hissini yaşatmak için mekana, konsepte ve kitleye özel
                müzik kurgusu yapıyoruz.
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

        <section className="py-20 bg-background">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <h2
              className="text-3xl text-foreground mb-12"
              style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
            >
              Her açılış tipi için
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {formats.map((f, i) => (
                <div key={f.title} className="border-t border-border pt-6">
                  <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="font-medium text-foreground mt-3 mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

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
                Reveal anından sonraki partiye kadar tüm müzik yönetimi bizde.
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

        <section className="py-20 bg-[oklch(0.975_0.006_80)] text-center">
          <div className="max-w-xl mx-auto px-6">
            <h2
              className="text-3xl text-foreground"
              style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
            >
              Açılış tarihinizi paylaşın
            </h2>
            <p className="text-muted-foreground mt-3 text-sm">
              Tarihinizi aldıktan sonra 48 saat içinde size özel teklif iletiyoruz.
            </p>
            <Link href="/planla" className="inline-flex items-center gap-2 mt-8 bg-foreground text-background px-8 py-4 rounded-full text-sm font-medium hover:opacity-90 transition-opacity">
              Teklif İste →
            </Link>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
