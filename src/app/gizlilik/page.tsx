import type { Metadata } from "next";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Gizlilik Politikası — NOQT",
  description: "NOQT platformunda kişisel verilerin işlenmesi ve korunmasına ilişkin esaslar.",
  alternates: { canonical: "https://www.noqt.events/gizlilik" },
};

export default function Page() {
  return (
    <>
      <Navigation />
      <main className="pt-20 min-h-screen bg-background text-foreground">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Gizlilik Politikası</h1>
          <p className="text-muted-foreground mb-10 text-sm">Son güncelleme: Haziran 2025</p>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed text-foreground/80">
            <section>
              <h2 className="text-base font-semibold text-foreground mb-2">1. İşlenen Kişisel Veriler</h2>
              <p>
                NOQT, hizmet teklifi, rezervasyon ve iletişim süreçleri kapsamında ad, soyad, telefon numarası,
                e-posta adresi ve etkinlik tercihleri gibi kişisel verileri toplar. Bu veriler yalnızca hizmet
                sunumu amacıyla kullanılır.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-2">2. Verilerin Kullanım Amacı</h2>
              <p>
                Toplanan veriler; teklif hazırlama, etkinlik koordinasyonu, müşteri iletişimi ve yasal
                yükümlülüklerin yerine getirilmesi amacıyla işlenir. Açık izniniz olmaksızın üçüncü taraflarla
                pazarlama amaçlı paylaşılmaz.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-2">3. Veri Güvenliği</h2>
              <p>
                Kişisel verileriniz güvenli sunucularda saklanır ve yetkisiz erişime karşı teknik önlemlerle
                korunur. Ödeme işlemleri üçüncü taraf güvenli ödeme altyapıları aracılığıyla gerçekleştirilir;
                kart bilgileri NOQT sistemlerinde tutulmaz.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-2">4. Çerezler</h2>
              <p>
                Web sitemiz, kullanıcı deneyimini iyileştirmek amacıyla teknik çerezler kullanabilir. Analitik
                amaçlı çerezler için tarayıcı ayarlarınızdan tercihlerinizi yönetebilirsiniz.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-2">5. Haklarınız</h2>
              <p>
                6698 sayılı KVKK kapsamında; verilerinize erişme, düzeltme, silme ve işlemeye itiraz etme
                haklarına sahipsiniz. Bu haklarınızı kullanmak için aşağıdaki iletişim kanallarından bize
                ulaşabilirsiniz.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-2">6. İletişim</h2>
              <p>
                Gizlilik ile ilgili sorularınız için{" "}
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
