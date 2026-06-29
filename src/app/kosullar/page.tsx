import type { Metadata } from "next";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Kullanım Koşulları — NOQT",
  description: "NOQT hizmetlerini kullanırken geçerli olan şartlar ve koşullar.",
  alternates: { canonical: "https://www.noqt.events/kosullar" },
};

export default function Page() {
  return (
    <>
      <Navigation />
      <main className="pt-20 min-h-screen bg-background text-foreground">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Kullanım Koşulları</h1>
          <p className="text-muted-foreground mb-10 text-sm">Son güncelleme: Haziran 2025</p>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed text-foreground/80">
            <section>
              <h2 className="text-base font-semibold text-foreground mb-2">1. Hizmet Kapsamı</h2>
              <p>
                NOQT; düğün, kına, kurumsal etkinlik, açılış ve özel parti gibi organizasyonlar için DJ ve
                etkinlik deneyimi hizmetleri sunar. Platform üzerinden iletilen talepler bir teklif süreci
                başlatır; hizmet sözleşmesi karşılıklı onay ile kesinleşir.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-2">2. Rezervasyon ve İptal</h2>
              <p>
                Rezervasyonlar, sözleşme imzalanması ve belirlenen ön ödemenin yapılmasıyla tamamlanır.
                İptal taleplerinde uygulanan koşullar sözleşmede açıkça belirtilir. Etkinlik tarihine yakın
                iptallerde ön ödeme iade edilmeyebilir.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-2">3. Kullanıcı Sorumlulukları</h2>
              <p>
                Platform üzerinden iletilen bilgilerin doğru ve güncel olması müşterinin sorumluluğundadır.
                Yanıltıcı bilgi paylaşımı veya platformun kötüye kullanımı halinde NOQT hizmet vermekten
                çekinme hakkını saklı tutar.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-2">4. Fikri Mülkiyet</h2>
              <p>
                Web sitesindeki tüm içerikler (logo, görseller, metin, tasarım ve ses materyalleri) NOQT&apos;a
                aittir. İzinsiz kopyalanması, dağıtılması veya ticari amaçla kullanılması yasaktır.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-2">5. Sorumluluk Sınırı</h2>
              <p>
                NOQT, mücbir sebepler (doğal afet, sokağa çıkma yasağı, salgın vb.) nedeniyle etkinliklerin
                gerçekleştirilememesi durumunda sorumlu tutulamaz. Bu gibi hallerde alternatif tarih veya
                kısmi iade seçenekleri değerlendirilir.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-2">6. Uygulanacak Hukuk</h2>
              <p>
                Bu koşullar Türkiye Cumhuriyeti yasalarına tabidir. Uyuşmazlıklarda Kayseri mahkemeleri
                ve icra daireleri yetkilidir.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-2">7. İletişim</h2>
              <p>
                Sorularınız için{" "}
                <a href="mailto:info@noqt.events" className="underline hover:opacity-70 transition">
                  info@noqt.events
                </a>{" "}
                adresine yazabilirsiniz.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
