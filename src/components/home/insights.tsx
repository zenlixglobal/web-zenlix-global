import Link from "next/link";

import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import {
  ArticleCard,
  toArticleCard,
  type ArticleCardData,
} from "@/components/site/article-card";
import { Container } from "@/components/site/container";
import { SectionHeading } from "@/components/site/section-heading";
import { insightsSection } from "@/content/site";
import { fetchPublishedInsights } from "@/lib/insights";

/**
 * Cards come from `insight_articles` once anything is published in the admin,
 * and fall back to the static teasers in site.ts until then — so the section
 * never renders empty on a fresh install or if the query fails.
 */
export async function Insights() {
  const published = await fetchPublishedInsights(3);

  const articles: ArticleCardData[] =
    published.length > 0
      ? published.map(toArticleCard)
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
            <ArticleCard
              key={article.title}
              article={article}
              sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
            />
          ))}
        </Stagger>

        {/* The hub only earns a link once it has something on it. */}
        {published.length > 0 ? (
          <Reveal className="mt-10 text-center">
            <Link
              href="/insights"
              className="inline-block border-b border-gold-500 pb-0.5 text-[13px] font-semibold text-navy-900 transition-colors hover:text-gold-500"
            >
              View all insights <span aria-hidden>&rarr;</span>
            </Link>
          </Reveal>
        ) : null}

      </Container>
    </section>
  );
}
