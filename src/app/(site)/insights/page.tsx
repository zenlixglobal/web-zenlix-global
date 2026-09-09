import type { Metadata } from "next";
import Link from "next/link";

import { Reveal, Stagger } from "@/components/motion/reveal";
import { ArticleCard, toArticleCard } from "@/components/site/article-card";
import { Container } from "@/components/site/container";
import { PageBanner } from "@/components/site/page-banner";
import { Button } from "@/components/ui/button";
import { insightsPage } from "@/content/site";
import { fetchPublishedInsights } from "@/lib/insights";

export const metadata: Metadata = {
  title: insightsPage.eyebrow,
  description: insightsPage.intro,
  alternates: { canonical: "/insights" },
};

/**
 * The Insights hub.
 *
 * Its job is crawlability as much as browsing: without it, every published
 * article is reachable only from sitemap.xml, which gives search engines no
 * internal links to weigh and no page that groups the articles together.
 *
 * Dynamic for the same reason as the article pages — unpublishing has to take
 * effect at once, and a cached list would keep linking to a 404.
 */
export const dynamic = "force-dynamic";

/** Generous: the grid is cheap and a staffing blog will not outgrow this soon. */
const MAX_ARTICLES = 60;

export default async function InsightsPage() {
  const published = await fetchPublishedInsights(MAX_ARTICLES);
  const articles = published.map(toArticleCard);

  return (
    <>
      <PageBanner
        eyebrow={insightsPage.eyebrow}
        heading={insightsPage.heading}
        intro={insightsPage.intro}
      />

      <section className="bg-cream py-16 sm:py-20 lg:py-24">
        <Container>
          {articles.length > 0 ? (
            <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-[30px]">
              {articles.map((article) => (
                <ArticleCard
                  key={article.title}
                  article={article}
                  sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
                />
              ))}
            </Stagger>
          ) : (
            /* Never a bare grid: an empty page that still offers a next step
               reads as deliberate, and keeps the URL worth indexing. */
            <Reveal className="mx-auto max-w-150 border border-line bg-white px-8 py-14 text-center">
              <p className="text-base text-slate-muted">{insightsPage.empty}</p>
              <Button asChild variant="navy" size="xl" className="mt-7">
                <Link href="/contact">
                  {insightsPage.emptyCta} <span aria-hidden>&rarr;</span>
                </Link>
              </Button>
            </Reveal>
          )}
        </Container>
      </section>
    </>
  );
}
