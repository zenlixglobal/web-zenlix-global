import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { Container } from "@/components/site/container";
import { SectionHeading } from "@/components/site/section-heading";
import { aboutPage } from "@/content/site";

const { principles } = aboutPage;

/**
 * The working promises, laid out on the same hairline grid the services use on
 * the home page — 1px gaps over a `line`-coloured background are the rules.
 */
export function Principles() {
  return (
    <section className="py-16 sm:py-20 lg:py-28">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow={principles.eyebrow}
            heading={principles.heading}
            intro={principles.intro}
            className="mb-10 sm:mb-14"
          />
        </Reveal>
      </Container>

      <Container className="px-0 sm:px-0">
        <Stagger
          delayChildren={0.1}
          stagger={0.06}
          className="grid gap-px border-y border-line bg-line sm:grid-cols-2 sm:border-x"
        >
          {principles.items.map((item) => (
            /* Fade only. These cards are the grid: the 1px rules are the
               background showing through the gaps, and a card that travels
               drags a visible tear across them. */
            <StaggerItem
              key={item.num}
              as="article"
              direction="none"
              className="bg-cream px-6 py-8 transition-colors hover:bg-white sm:px-9 sm:py-10"
            >
              <p className="mb-4 font-mono text-xs text-gold-500">{item.num}</p>
              <h3 className="mb-3 text-lg leading-[1.35] sm:text-xl">
                {item.title}
              </h3>
              <p className="max-w-[52ch] text-sm leading-[1.75] text-slate-muted sm:text-[15px]">
                {item.body}
              </p>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </section>
  );
}
