import type { Metadata } from "next";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import ArtistsClient from "@/components/sections/ArtistsClient";
import { createServiceClient } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Organizatörler İçin — Kulüp, Festival & Kurumsal | NOQT",
  description: "Kulüp geceleri, festivaller ve kurumsal etkinlikler için DJ ve sanatçı rezervasyonu. Kadromuzu inceleyin, formu doldurun, 48 saatte geri dönüyoruz.",
  alternates: { canonical: "https://www.noqt.events/organizatorler" },
};

const STEPS = [
  {
    n: "01",
    title: "Sanatçıyı seçin",
    desc: "Kadromuzu inceleyin, dinleyin ve etkinliğinize uygun sanatçıyı belirleyin.",
  },
  {
    n: "02",
    title: "Rezervasyon formu",
    desc: "\"Bu sanatçıyla planla\" butonuyla teknik, lojistik ve bütçe bilgilerini iletin.",
  },
  {
    n: "03",
    title: "48 saat içinde teklif",
    desc: "Ekibimiz sizi arar, detayları netleştirir; sözleşme ve ödeme planı sunarız.",
  },
];

const TRUST = [
  { value: "50+", label: "Tamamlanan etkinlik" },
  { value: "48s", label: "Ortalama geri dönüş" },
  { value: "Sözleşmeli", label: "Her rezervasyon" },
];

export default async function OrganizatorlerPage() {
  const supabase = createServiceClient();

  const { data: rawDjs, error } = await supabase
    .from("dj_profiles")
    .select(
      "id, name, bio, photo_url, photos, focal_points, concept_tags, soundcloud_url, mixcloud_url, youtube_url, instagram_url, spotify_url, website_url, performer_type, city, speciality, preview_video_url, videos, youtube_links"
    )
    .eq("is_active", true)
    .eq("application_status", "approved")
    .order("created_at", { ascending: true });

  const djs = error || !rawDjs ? [] : rawDjs;

  return (
    <>
      <Navigation />
      <main>
        {/* B2B Hero */}
        <section className="bg-foreground text-background pt-32 pb-20 lg:pt-40 lg:pb-28">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="max-w-3xl">
              <span className="text-xs tracking-[0.25em] uppercase text-background/40 font-medium">
                Kulüp · Festival · Kurumsal
              </span>
              <h1
                className="text-5xl lg:text-7xl mt-6 text-background leading-[1.05] tracking-tight"
                style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
              >
                Profesyonel etkinlikler için{" "}
                <em className="italic opacity-70">doğru kadro.</em>
              </h1>
              <p className="mt-8 text-lg text-background/60 leading-relaxed max-w-xl">
                DJ, live act, B2B performans — kadromuzu inceleyin, rezervasyon formunu doldurun. Sözleşme, teknik rider ve ödeme planı dahil.
              </p>

              <div className="flex flex-wrap gap-4 mt-12">
                <a
                  href="#kadro"
                  className="inline-flex items-center gap-2 bg-background text-foreground px-7 py-4 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Kadroyu İncele
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M8 3v10M4 9l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
                <a
                  href="https://wa.me/905417997973?text=Organizat%C3%B6r%20olarak%20bilgi%20almak%20istiyorum"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 border border-background/20 text-background px-6 py-4 rounded-full text-sm font-medium hover:bg-background/10 transition-colors"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  WhatsApp
                </a>
              </div>
            </div>

            {/* Trust stats */}
            <div className="flex flex-wrap items-center gap-x-10 gap-y-5 mt-16 pt-12 border-t border-background/10">
              {TRUST.map((t, i) => (
                <div key={i} className="flex items-center gap-10">
                  {i > 0 && <div className="h-8 w-px bg-background/15 hidden sm:block" />}
                  <div>
                    <div
                      className="text-3xl text-background leading-none"
                      style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
                    >
                      {t.value}
                    </div>
                    <div className="mt-1.5 text-xs tracking-[0.15em] uppercase text-background/40">{t.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20 lg:py-28 bg-[oklch(0.975_0.006_80)]">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <span className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-medium">
              Nasıl Çalışır
            </span>
            <div className="grid lg:grid-cols-3 gap-8 mt-10">
              {STEPS.map((s) => (
                <div key={s.n} className="flex gap-5">
                  <span
                    className="text-5xl text-foreground/10 leading-none shrink-0 mt-1"
                    style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)" }}
                  >
                    {s.n}
                  </span>
                  <div>
                    <h3 className="font-medium text-foreground mb-2">{s.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Artist roster */}
        <section id="kadro" className="py-4 bg-background">
          <ArtistsClient djs={djs} activeType="dj" />
        </section>

        {/* CTA */}
        <section className="py-24 lg:py-32 bg-foreground text-background text-center">
          <div className="max-w-2xl mx-auto px-6 lg:px-8">
            <span className="text-xs tracking-[0.25em] uppercase text-background/40 font-medium">
              Başlayalım
            </span>
            <h2
              className="text-4xl lg:text-5xl mt-5 text-background leading-[1.1]"
              style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
            >
              Etkinlik tarihiniz belli mi?{" "}
              <em className="italic opacity-70">Hemen ayırtın.</em>
            </h2>
            <p className="mt-6 text-background/55 text-lg leading-relaxed">
              Popüler hafta sonları için müsaitlik kısıtlıdır. Kadromuzu inceleyip rezervasyon formunu doldurun, 48 saat içinde geri dönüyoruz.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
              <a
                href="#kadro"
                className="inline-flex items-center gap-2 bg-background text-foreground px-7 py-4 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Kadroyu İncele
              </a>
              <a
                href="https://wa.me/905417997973?text=Organizat%C3%B6r%20olarak%20bilgi%20almak%20istiyorum"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-background/20 text-background px-6 py-4 rounded-full text-sm font-medium hover:bg-background/10 transition-colors"
              >
                WhatsApp&apos;tan Ulaşın
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
