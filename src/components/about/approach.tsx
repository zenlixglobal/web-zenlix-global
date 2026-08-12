import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { Container } from "@/components/site/container";
import { SectionHeading } from "@/components/site/section-heading";
import { aboutPage } from "@/content/site";

const { approach } = aboutPage;

/**
 * The stages of a search, drawn as a single hairline rail with a gold marker
 * per step.
 *
 * White rather than cream so the section separates from the narrative above it
 * without adding a third navy band to the page.
 */
export function Approach() {
  return (
    <section className="bg-white py-16 sm:py-20 lg:py-28">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow={approach.eyebrow}
            heading={approach.heading}
            intro={approach.intro}
            className="mb-10 sm:mb-14"
          />
        </Reveal>

        <Stagger as="div" stagger={0.09}>
          <ol className="border-l border-line">
            {approach.items.map((item) => (
              <StaggerItem
                key={item.step}
                as="li"
                distance={12}
                className="relative grid gap-x-10 gap-y-2 pb-10 pl-7 last:pb-0 sm:grid-cols-[7rem_1fr] sm:pl-10"
              >
                {/* Centred on the rail: half the marker's width to the left of
                    the border it sits on. */}
                <span
                  aria-hidden
                  className="absolute top-2 -left-[5px] size-2.5 bg-gold-500"
                />
                <span className="font-mono text-[13px] tracking-[0.06em] text-gold-500">
                  {item.step}
                </span>
                <div className="max-w-160">
                  <h3 className="text-lg leading-[1.35] sm:text-xl">
                    {item.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-[1.75] text-slate-muted sm:text-[15px]">
                    {item.body}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </ol>
        </Stagger>
      </Container>
    </section>
  );
}
