import Image from "next/image";
import Link from "next/link";

import { StaggerItem } from "@/components/motion/reveal";
import type { InsightCard } from "@/lib/insights";

/** Used when a published article has no image of its own. */
export const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=600";

export type ArticleCardData = {
  category: string;
  title: string;
  excerpt: string;
  /** Absent on the static teasers in site.ts, which link nowhere. */
  href?: string;
  image: { src: string; alt: string };
};

/** Database row to card props. Shared so the homepage and the hub agree. */
export function toArticleCard(article: InsightCard): ArticleCardData {
  return {
    category: article.category,
    title: article.title,
    excerpt: article.excerpt,
    href: `/insights/${article.slug}`,
    image: {
      src: article.image_url ?? FALLBACK_IMAGE,
      alt: article.image_alt ?? "",
    },
  };
}

/**
 * One article card. Rendered on the homepage teaser row and on /insights, so
 * the two stay identical by construction rather than by copy-paste.
 *
 * Returns a `StaggerItem` because both callers lay their cards out inside a
 * `Stagger` grid; the motion belongs with the card, not with each caller.
 */
export function ArticleCard({
  article,
  sizes,
}: {
  article: ArticleCardData;
  /** Differs per grid — the hub's columns are wider than the homepage's. */
  sizes: string;
}) {
  return (
    /* `group` has to stay on this element — the image's zoom is a
       `group-hover:` rule and the lift is the same gesture. */
    <StaggerItem
      as="article"
      lift
      className="group border border-line bg-white transition-shadow hover:shadow-sm"
    >
      <div className="relative h-45 overflow-hidden sm:h-[170px]">
        <Image
          src={article.image.src}
          alt={article.image.alt}
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-400 group-hover:scale-106"
        />
      </div>
      <div className="p-6 pb-7 sm:p-[26px] sm:pb-[30px]">
        <p className="font-mono text-[11.5px] tracking-[0.06em] text-gold-500 uppercase">
          {article.category}
        </p>
        <h3 className="mt-3 mb-2.5 text-lg leading-[1.35]">{article.title}</h3>
        <p className="mb-4 text-sm text-slate-muted">{article.excerpt}</p>
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
  );
}
