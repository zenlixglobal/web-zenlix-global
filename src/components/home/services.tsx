import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { Container } from "@/components/site/container";
import { SectionHeading } from "@/components/site/section-heading";
import { servicesSection } from "@/content/site";

export function Services() {
  return (
    <section id="services" className="py-16 sm:py-20 lg:py-28">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow={servicesSection.eyebrow}
            heading={servicesSection.heading}
            intro={servicesSection.intro}
            className="mb-10 sm:mb-16"
          />
        </Reveal>
      </Container>

      <Container className="px-0 sm:px-0">
        {/* 1px gap over a `line`-coloured background draws the hairline grid,
            exactly as the original `gap:1px; background:var(--line)` did. */}
        {/* `delayChildren` holds the grid back until the heading above has
            landed, so the section reads top-down instead of all at once. */}
        <Stagger
          delayChildren={0.1}
          stagger={0.05}
          className="grid gap-px border-y border-line bg-line sm:grid-cols-2 sm:border-x lg:grid-cols-4"
        >
          {servicesSection.services.map((service) => (
            /* Fade only, no travel. These cards *are* the hairline grid — the
               1px rules are the background showing through the gaps, so a card
               that slides even 24px drags a visible tear across the rule. */
            <StaggerItem
              key={service.num}
              as="article"
              direction="none"
              className="bg-cream px-6 py-8 transition-colors hover:bg-white sm:px-8 sm:py-9"
            >
              <p className="mb-4 font-mono text-xs text-gold-500">
                {service.num}
              </p>
              <h3 className="mb-2.5 text-xl">{service.title}</h3>
              <p className="text-sm text-slate-muted sm:text-[14.5px]">
                {service.description}
              </p>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </section>
  );
}
