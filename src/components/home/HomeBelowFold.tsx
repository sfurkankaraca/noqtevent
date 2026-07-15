"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type ArtistsComponent from "./Artists";
import type TestimonialsComponent from "./Testimonials";
import type PartnerEcosystemComponent from "./PartnerEcosystem";
import type FeaturedExperiencesComponent from "./FeaturedExperiences";

// Below-fold sections — code-split via dynamic(), SSR stays on by default.
const SegmentGate = dynamic(() => import("./SegmentGate"));
const HowItWorks = dynamic(() => import("./HowItWorks"));
const Artists = dynamic(() => import("./Artists"));
const FeaturedExperiences = dynamic(() => import("./FeaturedExperiences"));
const Testimonials = dynamic(() => import("./Testimonials"));
const PartnerEcosystem = dynamic(() => import("./PartnerEcosystem"));
const HomeCTA = dynamic(() => import("./HomeCTA"));

type Props = {
  testimonials: ComponentProps<typeof TestimonialsComponent>["testimonials"];
  djs: ComponentProps<typeof ArtistsComponent>["djs"];
  categories: ComponentProps<typeof PartnerEcosystemComponent>["categories"];
  logos: ComponentProps<typeof PartnerEcosystemComponent>["logos"];
  concepts: ComponentProps<typeof FeaturedExperiencesComponent>["concepts"];
};

export default function HomeBelowFold({ testimonials, djs, categories, logos, concepts }: Props) {
  return (
    <>
      <SegmentGate />
      <HowItWorks />
      <FeaturedExperiences concepts={concepts} />
      <PartnerEcosystem categories={categories} logos={logos} />
      <Artists djs={djs} />
      <Testimonials testimonials={testimonials} />
      <HomeCTA />
    </>
  );
}
