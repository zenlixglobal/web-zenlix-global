import { Container } from "@/components/site/container";
import { SectionHeading } from "@/components/site/section-heading";
import { servicesSection } from "@/content/site";

export function Services() {
  return (
    <section id="services" className="py-16 sm:py-20 lg:py-28">
      <Container>
        <SectionHeading
          eyebrow={servicesSection.eyebrow}
          heading={servicesSection.heading}
          intro={servicesSection.intro}
          className="mb-10 sm:mb-16"
        />
      </Container>

      <Container className="px-0 sm:px-0">
        {/* 1px gap over a `line`-coloured background draws the hairline grid,
            exactly as the original `gap:1px; background:var(--line)` did. */}
        <div className="grid gap-px border-y border-line bg-line sm:grid-cols-2 sm:border-x lg:grid-cols-4">
          {servicesSection.services.map((service) => (
            <article
              key={service.num}
              className="bg-cream px-6 py-8 transition-colors hover:bg-white sm:px-8 sm:py-9"
            >
              <p className="mb-4 font-mono text-xs text-gold-500">
                {service.num}
              </p>
              <h3 className="mb-2.5 text-xl">{service.title}</h3>
              <p className="text-sm text-slate-muted sm:text-[14.5px]">
                {service.description}
              </p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
