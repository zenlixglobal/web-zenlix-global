import type { Metadata } from "next";

import { Advantage } from "@/components/home/advantage";
import { CtaStrip } from "@/components/home/cta-strip";
import { Hero } from "@/components/home/hero";
import { Insights } from "@/components/home/insights";
import { Services } from "@/components/home/services";
import { OrganizationJsonLd } from "@/components/site/json-ld";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <OrganizationJsonLd />
      <Hero />
      <Services />
      <Advantage />
      <CtaStrip />
      <Insights />
    </>
  );
}
