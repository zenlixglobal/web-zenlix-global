import Link from "next/link";

import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { ctaStrip } from "@/content/site";

export function CtaStrip() {
  return (
    <section className="bg-[linear-gradient(120deg,var(--color-gold-500),var(--color-gold-300))] py-12 text-center sm:py-[70px]">
      <Stagger as="div" className="container-wrap">
        <StaggerItem>
          <h2 className="mb-6 text-[clamp(1.5rem,4vw,2.125rem)] text-navy-900">
            {ctaStrip.heading}
          </h2>
        </StaggerItem>
        <StaggerItem>
          <Button asChild variant="navy" size="xl">
            <Link href={ctaStrip.cta.href}>
              {ctaStrip.cta.label} <span aria-hidden>&rarr;</span>
            </Link>
          </Button>
        </StaggerItem>
      </Stagger>
    </section>
  );
}
