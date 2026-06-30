"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type ArtistsComponent from "./Artists";
import type TestimonialsComponent from "./Testimonials";
import type PartnerEcosystemComponent from "./PartnerEcosystem";

// Ekran altı bölümler — client wrapper içinde dynamic() ile kod-bölme.
// ssr varsayılan olarak true: içerik HTML'de kalır (SEO korunur), JS ayrı
// chunk'lara bölünür ve ilk yük (First Load JS) küçülür.
const HowItWorks = dynamic(() => import("./HowItWorks"));
const Testimonials = dynamic(() => import("./Testimonials"));
const Artists = dynamic(() => import("./Artists"));
const PartnerEcosystem = dynamic(() => import("./PartnerEcosystem"));
const HomeCTA = dynamic(() => import("./HomeCTA"));

type Props = {
  testimonials: ComponentProps<typeof TestimonialsComponent>["testimonials"];
  djs: ComponentProps<typeof ArtistsComponent>["djs"];
  categories: ComponentProps<typeof PartnerEcosystemComponent>["categories"];
  logos: ComponentProps<typeof PartnerEcosystemComponent>["logos"];
};

export default function HomeBelowFold({ testimonials, djs, categories, logos }: Props) {
  return (
    <>
      <HowItWorks />
      <Testimonials testimonials={testimonials} />
      <Artists djs={djs} />
      <PartnerEcosystem categories={categories} logos={logos} />
      <HomeCTA />
    </>
  );
}
