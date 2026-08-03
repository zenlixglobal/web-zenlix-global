import type { MetadataRoute } from "next";

import { site } from "@/content/site";
import { fetchInsightSitemapEntries } from "@/lib/insights";

/**
 * Async because published articles come from the database. Next revalidates
 * this on demand, so a newly published insight is discoverable without a
 * rebuild.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  const articles = await fetchInsightSitemapEntries();

  return [
    { url: site.url, lastModified, changeFrequency: "monthly", priority: 1 },
    {
      url: `${site.url}/about`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${site.url}/contact`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.8,
    },
    ...articles.map((article) => ({
      url: `${site.url}/insights/${article.slug}`,
      lastModified: new Date(article.updated_at),
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
    {
      url: `${site.url}/privacy`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${site.url}/terms`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}
