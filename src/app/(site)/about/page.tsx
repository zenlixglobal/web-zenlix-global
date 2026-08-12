import type { Metadata } from "next";

import { Process } from "@/components/about/process";
import { Story } from "@/components/about/story";
import { Advantage } from "@/components/home/advantage";
import { CtaStrip } from "@/components/home/cta-strip";
import { PageBanner } from "@/components/site/page-banner";
import { aboutPage, site } from "@/content/site";

export const metadata: Metadata = {
  title: "Our Firm",
  description:
    "How Zenlix Global runs a search: one recruiter from the first call to the start date, pre-screened candidates you approve before anyone is contacted, and a replacement guarantee on every placement.",
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
      "The way we run a search at Zenlix Global: pre-screened candidates you approve before anyone is contacted, and one recruiter with you from the first call to the start date.",
  },
};

/**
 * The page alternates surfaces deliberately — navy banner, cream story, white
 * process rail, navy advantage, gold CTA — so no two adjacent sections share a
 * background and the page reads as chapters rather than one long scroll.
 *
 * The order is also the buyer's order: who we are, what happens, why us, and
 * then the ask.
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
      <Process />

      <Advantage variant="full" id="about" />

      <CtaStrip />
    </>
  );
}
