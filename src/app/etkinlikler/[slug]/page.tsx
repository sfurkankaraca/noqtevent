import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import { EVENT_PAGES, getEventPage } from "@/lib/eventPages";
import { safeJsonLd } from "@/lib/jsonLd"; // Bulgu 9: </script> kaçışı

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return EVENT_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getEventPage(slug);
  if (!page) return { title: "Sayfa Bulunamadı" };
  const BASE = process.env.NEXT_PUBLIC_URL || "https://www.noqt.events";
  return {
    title: page.metaTitle,
    description: page.metaDescription,
    keywords: page.keywords,
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      url: `${BASE}/etkinlikler/${page.slug}`,
      type: "website",
      locale: "tr_TR",
      siteName: "NOQT",
    },
    alternates: {
      canonical: `${BASE}/etkinlikler/${page.slug}`,
    },
  };
}

export default async function EventLandingPage({ params }: Props) {
  const { slug } = await params;
  const page = getEventPage(slug);
  if (!page) notFound();

  const BASE = process.env.NEXT_PUBLIC_URL || "https://www.noqt.events";

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${page.title} Organizasyonu — NOQT`,
    description: page.metaDescription,
    provider: {
      "@type": "LocalBusiness",
      name: "NOQT Deneyim Stüdyosu",
      url: BASE,
      areaServed: ["Kayseri", "Nevşehir", "Kapadokya", "Türkiye"],
      address: { "@type": "PostalAddress", addressCountry: "TR" },
    },
    serviceType: page.title,
    areaServed: "TR",
    url: `${BASE}/etkinlikler/${page.slug}`,
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Ana Sayfa", item: BASE },
      { "@type": "ListItem", position: 2, name: "Etkinlikler", item: `${BASE}/etkinlikler` },
      { "@type": "ListItem", position: 3, name: page.title, item: `${BASE}/etkinlikler/${page.slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbSchema) }} />
      <Navigation />
      <main className="pt-20">
        {/* Hero */}
        <section className="py-24 lg:py-36 bg-[oklch(0.975_0.006_80)]">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="h-px w-10 bg-foreground/30" />
                <span className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-medium">
                  {page.hero.eyebrow}
                </span>
              </div>
              <div className="text-6xl mb-6">{page.emoji}</div>
              <h1
                className="text-4xl lg:text-6xl text-foreground leading-tight"
                style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
              >
                {page.hero.headline}
              </h1>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl">
                {page.hero.sub}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-10">
                <Link
                  href="/planla"
                  className="inline-flex items-center gap-2 bg-foreground text-background px-7 py-4 rounded-full text-sm font-medium tracking-wide hover:opacity-90 transition-opacity"
                >
                  Ücretsiz Teklif Al →
                </Link>
                <Link
                  href="/iletisim"
                  className="inline-flex items-center gap-2 border border-border text-foreground px-7 py-4 rounded-full text-sm font-medium tracking-wide hover:bg-accent transition-colors"
                >
                  Bize Ulaşın
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* About */}
        <section className="py-20 bg-background">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              <div>
                <h2
                  className="text-3xl lg:text-4xl text-foreground leading-tight"
                  style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
                >
                  {page.about.heading}
                </h2>
              </div>
              <div>
                <p className="text-muted-foreground leading-relaxed text-lg">
                  {page.about.body}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 bg-[oklch(0.975_0.006_80)]">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <h2
              className="text-2xl text-foreground mb-12"
              style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
            >
              Ne sunuyoruz?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {page.features.map((f) => (
                <div
                  key={f.title}
                  className="bg-background rounded-2xl border border-border p-6 space-y-3"
                >
                  <span className="text-2xl">{f.icon}</span>
                  <h3 className="font-medium text-foreground">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 bg-background">
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <h2
              className="text-2xl text-foreground mb-10"
              style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
            >
              Sık sorulan sorular
            </h2>
            <div className="space-y-6">
              {page.faq.map((item) => (
                <div key={item.q} className="border-b border-border pb-6">
                  <h3 className="font-medium text-foreground mb-2">{item.q}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 bg-foreground text-background">
          <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
            <h2
              className="text-3xl lg:text-4xl text-background leading-tight mb-6"
              style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
            >
              {page.title} için teklif alın.
            </h2>
            <p className="text-background/70 mb-10 leading-relaxed">
              Planla aracımızla 3 dakikada taslak oluşturun — size özel fiyat ve program teklifimizi hızlıca iletiyoruz.
            </p>
            <Link
              href="/planla"
              className="inline-flex items-center gap-2 bg-background text-foreground px-8 py-4 rounded-full text-sm font-medium tracking-wide hover:opacity-90 transition-opacity"
            >
              Deneyimini Planla →
            </Link>
          </div>
        </section>

        {/* Other event types */}
        <section className="py-20 bg-background">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <h2 className="text-sm font-medium text-muted-foreground tracking-widest uppercase mb-8">
              Diğer etkinlik türleri
            </h2>
            <div className="flex flex-wrap gap-3">
              {EVENT_PAGES.filter((p) => p.slug !== page.slug).map((p) => (
                <Link
                  key={p.slug}
                  href={`/etkinlikler/${p.slug}`}
                  className="flex items-center gap-2 border border-border rounded-full px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                >
                  <span>{p.emoji}</span>
                  {p.title}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
