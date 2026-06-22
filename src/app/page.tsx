import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import FeaturedExperiences from "@/components/home/FeaturedExperiences";
import HowItWorks from "@/components/home/HowItWorks";
import Artists from "@/components/home/Artists";
import Testimonials from "@/components/home/Testimonials";
import BrandFeed from "@/components/home/BrandFeed";
import MemoryDrive from "@/components/home/MemoryDrive";
import PartnerEcosystem from "@/components/home/PartnerEcosystem";
import HomeCTA from "@/components/home/HomeCTA";
import { createServiceClient } from "@/lib/supabase";

export default async function Home() {
  const supabase = createServiceClient();

  const [djRes, partnerRes, conceptRes, testimonialRes, heroRes, brandFeedRes, memoryDriveRes, partnerLogosRes] = await Promise.all([
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
      .eq("category", "brand-feed")
      .eq("is_active", true)
      .order("created_at", { ascending: true }),
    supabase
      .from("site_assets")
      .select("public_url")
      .eq("category", "memory-drive")
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .limit(6),
    supabase
      .from("site_assets")
      .select("public_url, label")
      .eq("category", "brands")
      .eq("is_active", true)
      .order("created_at", { ascending: true }),
  ]);

  // photos/focal_points columns may not exist yet — fall back gracefully
  const testimonials = testimonialRes.error ? [] : (testimonialRes.data ?? []);
  const heroImages = heroRes.data?.map((a) => a.public_url) ?? [];
  const brandFeedPhotos = brandFeedRes.data?.map((a) => ({ url: a.public_url, label: a.label ?? undefined })) ?? [];
  const memoryDrivePhotos = memoryDriveRes.data?.map((a) => a.public_url) ?? [];
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

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Kayseri'de düğün DJ'i nasıl bulabilirim?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "NOQT deneyim planlayıcısını kullanarak etkinlik türünüzü, konseptinizi ve tarihini belirleyin. Size uygun DJ ve sanatçı önerilerini anında alın, teklif isteyin.",
        },
      },
      {
        "@type": "Question",
        name: "Nevşehir ve Kapadokya'da açık hava düğünü için DJ hizmeti veriyor musunuz?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Evet. Nevşehir, Kapadokya bağ evleri, cave oteller ve açık alanlarda ses sistemi, DJ ve canlı müzisyen hizmeti sunuyoruz. Ekibimiz açık hava akustiği ve teknik gereksinimler konusunda deneyimlidir.",
        },
      },
      {
        "@type": "Question",
        name: "Sadece DJ mi, yoksa canlı müzisyen de ayarlıyor musunuz?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Her ikisini de sunuyoruz. DJ, canlı klarnet, keman, akustik gitar, solist ve bando seçeneklerimiz mevcuttur. İstediğinizde karma paketler de oluşturabiliyoruz.",
        },
      },
      {
        "@type": "Question",
        name: "Kayseri'de kına gecesi organizasyonu için destek veriyor musunuz?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Evet. Kayseri'deki kına geceleri için geleneksel oyun havaları ile modern müziği harmanlayan özel setler hazırlıyoruz. DJ ve canlı müzisyen kombinasyonu da tercih edilebilir.",
        },
      },
      {
        "@type": "Question",
        name: "Fiyatlandırma nasıl çalışıyor?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Fiyatlar etkinlik süresine, mekana, sanatçı sayısına ve seçilen konsepte göre değişir. Deneyim planlayıcımız aracılığıyla etkinliğinizin detaylarını girin, size özel teklif oluşturalım.",
        },
      },
    ],
  };

  const firstHeroImage = heroImages[0];

  return (
    <>
      {firstHeroImage && (
        <link
          rel="preload"
          as="image"
          href={`/_next/image?url=${encodeURIComponent(firstHeroImage)}&w=828&q=75`}
          // @ts-expect-error - fetchpriority is valid but not in React types yet
          fetchpriority="high"
        />
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Navigation />
      <main>
        <Hero heroImages={heroImages} />
        <FeaturedExperiences concepts={concepts ?? []} />
        <HowItWorks />
        <Testimonials testimonials={testimonials} />
        <BrandFeed photos={brandFeedPhotos.length > 0 ? brandFeedPhotos : undefined} />
        <Artists djs={djs ?? []} />
        <MemoryDrive photos={memoryDrivePhotos.length > 0 ? memoryDrivePhotos : undefined} />
        <PartnerEcosystem categories={categories} logos={partnerLogos} />
        <HomeCTA />
      </main>
      <Footer />
    </>
  );
}
