import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import FeaturedExperiences from "@/components/home/FeaturedExperiences";
import HowItWorks from "@/components/home/HowItWorks";
import ConceptLibrary from "@/components/home/ConceptLibrary";
import Artists from "@/components/home/Artists";
import RealEvents from "@/components/home/RealEvents";
import BrandFeed from "@/components/home/BrandFeed";
import MemoryDrive from "@/components/home/MemoryDrive";
import PartnerEcosystem from "@/components/home/PartnerEcosystem";
import HomeCTA from "@/components/home/HomeCTA";
import { createServiceClient } from "@/lib/supabase";

export default async function Home() {
  const supabase = createServiceClient();

  const [{ data: djs }, { data: partners }] = await Promise.all([
    supabase
      .from("dj_profiles")
      .select("id, name, bio, photo_url, concept_tags")
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .limit(4),
    supabase
      .from("partner_profiles")
      .select("service_category")
      .eq("is_active", true),
  ]);

  // Group partner counts by category
  const categoryCounts: Record<string, number> = {};
  for (const p of partners ?? []) {
    const cat = p.service_category ?? "Diğer";
    categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1;
  }
  const categories = Object.entries(categoryCounts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <>
      <Navigation />
      <main>
        <Hero />
        <FeaturedExperiences />
        <HowItWorks />
        <ConceptLibrary />
        <RealEvents />
        <BrandFeed />
        <Artists djs={djs ?? []} />
        <MemoryDrive />
        <PartnerEcosystem categories={categories} />
        <HomeCTA />
      </main>
      <Footer />
    </>
  );
}
