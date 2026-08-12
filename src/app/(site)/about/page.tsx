import type { Metadata } from "next";

import { Approach } from "@/components/about/approach";
import { Principles } from "@/components/about/principles";
import { Story } from "@/components/about/story";
import { Advantage } from "@/components/home/advantage";
import { CtaStrip } from "@/components/home/cta-strip";
import { PageBanner } from "@/components/site/page-banner";
import { aboutPage, site } from "@/content/site";

export const metadata: Metadata = {
  title: "Our Firm",
  description:
    "Who we are, how we run a search from brief to offer, and the four promises we hold ourselves to on IT and Non-IT staffing, executive search, and RPO.",
  alternates: { canonical: "/about" },
  // A page-level `openGraph` replaces the root layout's outright — the merge is
  // shallow — so siteName, locale and type have to be restated here rather than
  // inherited. The file-convention opengraph-image still applies.
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: site.locale,
    url: "/about",
    title: `Our Firm | ${site.name}`,
    description:
      "The way we run a search at Zenlix Global: one team from brief to offer, three candidates instead of thirty, and a call at ninety days.",
  },
};

/**
 * The page alternates surfaces deliberately — navy banner, cream story, white
 * process rail, navy advantage, cream principles, gold CTA — so no two adjacent
 * sections share a background and the page reads as chapters rather than one
 * long scroll.
 */
export default function AboutPage() {
  return (
    <>
      <PageBanner
        eyebrow={aboutPage.eyebrow}
        heading={aboutPage.heading}
        intro={aboutPage.intro}
      />

      <Story />
      <Approach />

      <Advantage variant="full" id="about" />

      <Principles />

      <CtaStrip />
    </>
  );
}
