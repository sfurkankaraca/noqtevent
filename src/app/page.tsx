import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import HomeBelowFold from "@/components/home/HomeBelowFold";
import { EventLinks, HomeFaq, JournalTeaser } from "@/components/home/HomeSeoSections";
import { HOME_FAQ } from "@/lib/homeFaq";
import { createServiceClient } from "@/lib/supabase";
import { safeJsonLd } from "@/lib/jsonLd"; // Bulgu 9: </script> kaçışı

const BASE_URL = process.env.NEXT_PUBLIC_URL ?? "https://www.noqt.events";

export default async function Home() {
  const supabase = createServiceClient();

  const [djRes, partnerRes, conceptRes, testimonialRes, heroRes, partnerLogosRes, journalRes] = await Promise.all([
    supabase
      .from("dj_profiles")
      .select("id, name, bio, photo_url, photos, focal_points, concept_tags")
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .limit(4),
    supabase
      .from("partner_profiles")
      .select("service_category")
      .eq("is_active", true),
    supabase
      .from("concepts")
      .select("id, slug, name, emoji, description, cover_image_url, color, is_dark, atmosphere, is_signature, energy_level")
      .eq("is_active", true)
      .order("is_signature", { ascending: false })
      .order("sort_order", { ascending: true })
      .limit(6),
    supabase
      .from("testimonials")
      .select("id, quote, name, event, initials, color, dark, rating")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .limit(9),
    supabase
      .from("site_assets")
      .select("public_url")
      .eq("category", "hero")
      .eq("is_active", true)
      .order("created_at", { ascending: true }),
    supabase
      .from("site_assets")
      .select("public_url, label")
      .eq("category", "brands")
      .eq("is_active", true)
      .order("created_at", { ascending: true }),
    supabase
      .from("journal_posts")
      .select("slug, title, category, excerpt, read_time")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(3),
  ]);

  // photos/focal_points columns may not exist yet — fall back gracefully
  const testimonials = testimonialRes.error ? [] : (testimonialRes.data ?? []);
  const heroImages = heroRes.data?.map((a) => a.public_url) ?? [];
  const partnerLogos = partnerLogosRes.data?.map((a) => ({ url: a.public_url, label: a.label ?? undefined })) ?? [];

  const djs = djRes.error
    ? (await supabase
        .from("dj_profiles")
        .select("id, name, bio, photo_url, concept_tags")
        .eq("is_active", true)
        .order("created_at", { ascending: true })
        .limit(4)
      ).data
    : djRes.data;

  const partners = partnerRes.data;
  const concepts = conceptRes.data;

  // Group partner counts by category
  const categoryCounts: Record<string, number> = {};
  for (const p of partners ?? []) {
    const cat = p.service_category ?? "Diğer";
    categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1;
  }
  const categories = Object.entries(categoryCounts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  // FAQ schema — görünür SSS bölümüyle (HomeFaq) aynı kaynaktan üretilir
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: HOME_FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  // aggregateRating — layout'taki LocalBusiness'a @id ile bağlanır, aramada yıldız gösterimi sağlar
  const ratedTestimonials = testimonials.filter((t) => typeof t.rating === "number" && t.rating > 0);
  const ratingSchema = ratedTestimonials.length >= 3
    ? {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "@id": `${BASE_URL}#localbusiness`,
        name: "NOQT Deneyim Stüdyosu",
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: (
            ratedTestimonials.reduce((sum, t) => sum + (t.rating ?? 0), 0) / ratedTestimonials.length
          ).toFixed(1),
          reviewCount: ratedTestimonials.length,
          bestRating: 5,
        },
      }
    : null;

  return (
    <>
      {/* LCP görseli için elle preload eklemiyoruz — Hero'daki <Image priority>
          zaten aynı `sizes` mantığıyla doğru eşleşen bir preload üretir. Elle
          sabit genişlikli (w=828) bir preload eklemek gerçek srcset'le
          eşleşmediği için tarayıcının LCP isteğini erken keşfetmesini engelliyordu. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(faqSchema) }} />
      {ratingSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(ratingSchema) }} />
      )}
      <Navigation />
      <main>
        <Hero heroImages={heroImages} />
        {/* HeroProof (tek yorumluk şerit) şimdilik gizli — geri almak için satırı aç */}
        {/* <HeroProof testimonial={testimonials[0] ?? null} /> */}
        <HomeBelowFold
          testimonials={testimonials}
          djs={djs ?? []}
          categories={categories}
          logos={partnerLogos}
          concepts={concepts ?? []}
        />
        <EventLinks />
        <JournalTeaser posts={journalRes.error ? [] : (journalRes.data ?? [])} />
        <HomeFaq />
      </main>
      <Footer />
    </>
  );
}
