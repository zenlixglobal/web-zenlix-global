import type { Metadata } from "next";

import { Advantage } from "@/components/home/advantage";
import { CtaStrip } from "@/components/home/cta-strip";
import { Container } from "@/components/site/container";
import { PageBanner } from "@/components/site/page-banner";
import { SectionHeading } from "@/components/site/section-heading";
import { aboutPage } from "@/content/site";

export const metadata: Metadata = {
  title: "Our Firm",
  description:
    "Learn about Zenlix Global's approach to IT and Non-IT staffing, executive search, and how our team builds high-performance workforces.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <PageBanner
        eyebrow={aboutPage.eyebrow}
        heading={aboutPage.heading}
        intro={aboutPage.intro}
      />

      <Advantage variant="full" id="about" />

      <section className="py-16 sm:py-20 lg:py-28">
        <Container>
          <SectionHeading
            eyebrow={aboutPage.story.eyebrow}
            heading={aboutPage.story.heading}
            intro={aboutPage.story.body}
          />
        </Container>
      </section>

      <CtaStrip />
    </>
  );
}
