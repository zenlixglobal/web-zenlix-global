import Image from "next/image";

import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { Container } from "@/components/site/container";
import { Eyebrow } from "@/components/site/eyebrow";
import { aboutPage } from "@/content/site";

const { story } = aboutPage;

/**
 * The founder's note on /about.
 *
 * Two columns on desktop: a framed photograph that stays put while the prose
 * scrolls past it, and the narrative itself. The photo column is the grid item
 * (so it inherits the row's full height) and the <figure> inside it is what
 * sticks — a sticky element only travels as far as its parent is tall.
 */
export function Story() {
  return (
    <section className="py-16 sm:py-20 lg:py-28">
      <Container>
        <Stagger
          as="div"
          className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16"
        >
          <StaggerItem direction="right">
            <figure className="border border-line bg-white p-3 lg:sticky lg:top-28">
              {/* Portrait only once it is a column of its own — stacked, a 4:5
                  crop at full width eats a whole phone screen before a word of
                  the story is visible. */}
              <div className="relative aspect-[3/2] w-full overflow-hidden sm:aspect-[16/10] lg:aspect-[4/5]">
                <Image
                  src={story.image.src}
                  alt={story.image.alt}
                  fill
                  sizes="(min-width: 1024px) 380px, 100vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="px-3 pt-5 pb-3">
                <p className="font-mono text-[11.5px] tracking-[0.08em] text-gold-500 uppercase">
                  {story.signature.caption}
                </p>
                <p className="mt-2.5 font-heading text-lg font-semibold text-navy-900">
                  {story.signature.name}
                </p>
                <p className="text-sm text-slate-muted">
                  {story.signature.role}
                </p>
              </figcaption>
            </figure>
          </StaggerItem>

          <div>
            <StaggerItem>
              <Eyebrow className="mb-3.5">{story.eyebrow}</Eyebrow>
            </StaggerItem>

            <StaggerItem>
              <h2 className="max-w-[22ch] text-[clamp(1.75rem,5vw,2.5rem)] leading-[1.15]">
                {story.heading}
              </h2>
            </StaggerItem>

            <StaggerItem>
              <p className="mt-5 max-w-[54ch] font-heading text-lg leading-[1.55] text-navy-900 sm:text-xl">
                {story.lede}
              </p>
            </StaggerItem>

            {/* One <p> per paragraph rather than one prose block, so each
                paragraph arrives on its own beat as the reader gets to it.
                (No drop cap: the opening word is whatever the founders end up
                writing, and a floated initial breaks apart on a narrow letter
                — "In [2019]" sets as "I n".) */}
            <div className="mt-7 max-w-[68ch] space-y-5 text-[15.5px] leading-[1.8] text-slate-muted sm:text-[16.5px]">
              {story.paragraphs.map((paragraph, index) => (
                <StaggerItem key={index} as="p" distance={12}>
                  {paragraph}
                </StaggerItem>
              ))}
            </div>

            <Reveal
              as="figure"
              className="mt-9 max-w-[56ch] border-l-2 border-gold-500 pl-6"
            >
              <blockquote className="font-heading text-lg leading-[1.5] text-navy-900 italic sm:text-xl">
                &ldquo;{story.pullQuote}&rdquo;
              </blockquote>
            </Reveal>
          </div>
        </Stagger>

        {/* The checkable facts, deliberately separated from the narrative:
            prose is where a firm sounds like itself, this row is where it has
            to be accurate. */}
        <Stagger
          as="div"
          stagger={0.06}
          className="mt-14 grid grid-cols-2 gap-8 border-t border-line pt-8 sm:mt-16 sm:gap-10 lg:grid-cols-4"
        >
          {story.facts.map((fact) => (
            <StaggerItem key={fact.label} distance={12}>
              <dl>
                <dt className="font-mono text-[11.5px] tracking-[0.08em] text-slate-muted uppercase">
                  {fact.label}
                </dt>
                <dd className="mt-2 font-heading text-lg font-semibold text-navy-900 sm:text-xl">
                  {fact.value}
                </dd>
              </dl>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </section>
  );
}
