import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Reveal } from "@/components/motion/reveal";
import { ArticleBody } from "@/components/site/article-body";
import { Container } from "@/components/site/container";
import { PageBanner } from "@/components/site/page-banner";
import { site } from "@/content/site";
import { fetchInsightBySlug } from "@/lib/insights";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await fetchInsightBySlug(slug);

  if (!article) return { title: "Article not found", robots: { index: false } };

  const url = `${site.url}/insights/${article.slug}`;

  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: article.title,
      description: article.excerpt,
      publishedTime: article.published_at ?? undefined,
      modifiedTime: article.updated_at,
      ...(article.image_url ? { images: [{ url: article.image_url }] } : {}),
    },
    twitter: {
      card: article.image_url ? "summary_large_image" : "summary",
      title: article.title,
      description: article.excerpt,
    },
  };
}

/**
 * A published insight.
 *
 * Rendered per request rather than statically: articles are edited in the
 * admin, and a cached page would keep serving the old copy after a correction.
 * Unpublishing likewise has to take effect immediately, which is enforced by
 * the RLS filter in `fetchInsightBySlug` — an unpublished slug simply 404s.
 */
export const dynamic = "force-dynamic";

export default async function InsightPage({ params }: Props) {
  const { slug } = await params;
  const article = await fetchInsightBySlug(slug);

  if (!article) notFound();

  const published = article.published_at ?? article.created_at;

  return (
    <>
      <PageBanner eyebrow={article.category} heading={article.title}>
        <p className="text-[15px] text-navy-fg-muted">
          {article.author ? `${article.author} · ` : ""}
          <time dateTime={published}>{formatDate(published)}</time>
        </p>
      </PageBanner>

      <section className="bg-cream py-14 sm:py-18">
        <Container>
          {/* The lead image gets the reveal; the prose below it deliberately
              does not. Fading paragraphs in as someone scrolls an article
              means the text they are reaching for is the text still arriving. */}
          {article.image_url ? (
            <Reveal className="relative mb-10 h-56 w-full max-w-180 overflow-hidden sm:h-80">
              <Image
                src={article.image_url}
                alt={article.image_alt ?? ""}
                fill
                sizes="(min-width: 768px) 720px, 100vw"
                className="object-cover"
                priority
              />
            </Reveal>
          ) : null}

          <ArticleBody body={article.body} />

          <Reveal className="mt-12 max-w-180 border-t border-line pt-6">
            <Link
              href="/#insights"
              className="text-[13px] font-semibold text-navy-900 underline-offset-4 hover:underline"
            >
              <span aria-hidden>&larr;</span> All insights
            </Link>
          </Reveal>
        </Container>
      </section>

      {/* Tells Google this is an article, and who wrote it. */}
      <script
        type="application/ld+json"
        // Values come from our own database and are JSON-encoded, not
        // interpolated into markup.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: article.title,
            description: article.excerpt,
            datePublished: published,
            dateModified: article.updated_at,
            author: { "@type": "Organization", name: article.author ?? site.name },
            publisher: { "@type": "Organization", name: site.name },
            mainEntityOfPage: `${site.url}/insights/${article.slug}`,
            ...(article.image_url ? { image: article.image_url } : {}),
          }),
        }}
      />
    </>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "long",
    timeZone: "Europe/London",
  }).format(new Date(value));
}
