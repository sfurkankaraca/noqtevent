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

export default function Home() {
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
        <Artists />
        <MemoryDrive />
        <PartnerEcosystem />
        <HomeCTA />
      </main>
      <Footer />
    </>
  );
}
