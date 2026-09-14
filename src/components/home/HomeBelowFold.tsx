"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type ArtistsComponent from "./Artists";
import type TestimonialsComponent from "./Testimonials";
import type PartnerEcosystemComponent from "./PartnerEcosystem";
import type FeaturedExperiencesComponent from "./FeaturedExperiences";

// Below-fold sections — code-split via dynamic(), SSR stays on by default.
const MusicPillars = dynamic(() => import("./MusicPillars"));
const HowItWorks = dynamic(() => import("./HowItWorks"));
const Artists = dynamic(() => import("./Artists"));
const FeaturedExperiences = dynamic(() => import("./FeaturedExperiences"));
// Testimonials şimdilik gizli — geri almak için import'u aç
// const Testimonials = dynamic(() => import("./Testimonials"));
// PartnerEcosystem müzik odaklı ana sayfada gizli (/ortaklar sayfası duruyor) — geri almak için import'u aç
// const PartnerEcosystem = dynamic(() => import("./PartnerEcosystem"));
const HomeCTA = dynamic(() => import("./HomeCTA"));

type Props = {
  testimonials: ComponentProps<typeof TestimonialsComponent>["testimonials"];
  djs: ComponentProps<typeof ArtistsComponent>["djs"];
  categories: ComponentProps<typeof PartnerEcosystemComponent>["categories"];
  logos: ComponentProps<typeof PartnerEcosystemComponent>["logos"];
  concepts: ComponentProps<typeof FeaturedExperiencesComponent>["concepts"];
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- testimonials / partner bölümleri geri açılınca kullanılacak
export default function HomeBelowFold({ testimonials, djs, categories, logos, concepts }: Props) {
  return (
    <>
      {/* Müzik odaklı akış: ne yapıyoruz → kim çalıyor → nasıl bir ses → süreç */}
      <MusicPillars />
      <Artists djs={djs} />
      <FeaturedExperiences concepts={concepts} />
      <HowItWorks />
      {/* Partner ağı şimdilik gizli — geri almak için bu satırı aç */}
      {/* <PartnerEcosystem categories={categories} logos={logos} /> */}
      {/* Testimonials şimdilik gizli — geri almak için bu satırı aç */}
      {/* <Testimonials testimonials={testimonials} /> */}
      <HomeCTA />
    </>
  );
}
