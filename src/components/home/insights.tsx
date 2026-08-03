import Image from "next/image";
import Link from "next/link";

import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { Container } from "@/components/site/container";
import { SectionHeading } from "@/components/site/section-heading";
import { insightsSection } from "@/content/site";
import { fetchPublishedInsights } from "@/lib/insights";

/** Used when a published article has no image of its own. */
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=600";

/**
 * Cards come from `insight_articles` once anything is published in the admin,
 * and fall back to the static teasers in site.ts until then — so the section
 * never renders empty on a fresh install or if the query fails.
 */
export async function Insights() {
  const published = await fetchPublishedInsights(3);

  const articles =
    published.length > 0
      ? published.map((article) => ({
          category: article.category,
          title: article.title,
          excerpt: article.excerpt,
          href: `/insights/${article.slug}`,
          image: {
            src: article.image_url ?? FALLBACK_IMAGE,
            alt: article.image_alt ?? "",
          },
        }))
      : insightsSection.articles;

  return (
    <section id="insights" className="py-16 sm:py-20 lg:py-28">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow={insightsSection.eyebrow}
            heading={insightsSection.heading}
            className="mb-10 sm:mb-16"
          />
        </Reveal>

        <Stagger stagger={0.1} className="grid gap-6 md:grid-cols-2 lg:gap-8">
          {insightsSection.testimonials.map((testimonial, index) => (
            <StaggerItem
              key={index}
              as="figure"
              lift
              className="border border-line bg-white p-7 sm:p-9"
            >
              <blockquote className="font-heading text-lg leading-[1.5] text-navy-900 italic sm:text-[19px]">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-6">
                <b className="block text-sm sm:text-[14.5px]">
                  {testimonial.role}
                </b>
                <span className="font-mono text-[13px] text-slate-muted">
                  {testimonial.company}
                </span>
              </figcaption>
            </StaggerItem>
          ))}
        </Stagger>

        <Stagger className="mt-6 grid gap-6 sm:grid-cols-2 lg:mt-5 lg:grid-cols-3 lg:gap-[30px]">
          {articles.map((article) => (
            /* `group` has to stay on this element — the image's zoom is a
               `group-hover:` rule and the lift is the same gesture. */
            <StaggerItem
              key={article.title}
              as="article"
              lift
              className="group border border-line bg-white transition-shadow hover:shadow-sm"
            >
              <div className="relative h-45 overflow-hidden sm:h-[170px]">
                <Image
                  src={article.image.src}
                  alt={article.image.alt}
                  fill
                  sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-400 group-hover:scale-106"
                />
              </div>
              <div className="p-6 pb-7 sm:p-[26px] sm:pb-[30px]">
                <p className="font-mono text-[11.5px] tracking-[0.06em] text-gold-500 uppercase">
                  {article.category}
                </p>
                <h3 className="mt-3 mb-2.5 text-lg leading-[1.35]">
                  {article.title}
                </h3>
                <p className="mb-4 text-sm text-slate-muted">
                  {article.excerpt}
                </p>
                {article.href ? (
                  <Link
                    href={article.href}
                    className="inline-block border-b border-gold-500 pb-0.5 text-[13px] font-semibold text-navy-900 transition-colors hover:text-gold-500"
                  >
                    Read Article <span aria-hidden>&rarr;</span>
                  </Link>
                ) : null}
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </section>
  );
}
