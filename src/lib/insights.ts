import "server-only";

import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { InsightArticle } from "@/lib/supabase/types";

/**
 * Read side of the Insights feature.
 *
 * These run through the *session* client, which for an anonymous visitor
 * carries the anon key. That is deliberate: the RLS policy in
 * `0003_insights.sql` exposes published rows to `anon`, so a draft stays
 * invisible even to someone who guesses its slug. Never swap these for the
 * service-role client — it bypasses RLS and would serve drafts publicly.
 */

/** Columns the card grid needs. Excludes `body`, which can be 60KB. */
const CARD_COLUMNS =
  "id, slug, title, category, excerpt, image_url, image_alt, published_at";

export type InsightCard = Pick<
  InsightArticle,
  | "id"
  | "slug"
  | "title"
  | "category"
  | "excerpt"
  | "image_url"
  | "image_alt"
  | "published_at"
>;

export async function fetchPublishedInsights(limit = 3): Promise<InsightCard[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("insight_articles")
    .select(CARD_COLUMNS)
    .eq("published", true)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    // A failed read must not take the homepage down; the section falls back to
    // the static teasers in site.ts.
    console.error("[insights] list failed", error);
    return [];
  }

  return (data ?? []) as InsightCard[];
}

export async function fetchInsightBySlug(
  slug: string,
): Promise<InsightArticle | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("insight_articles")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (error) {
    console.error("[insights] fetch by slug failed", error);
    return null;
  }

  return (data as InsightArticle | null) ?? null;
}

/** Slugs for the sitemap. */
export async function fetchInsightSitemapEntries(): Promise<
  { slug: string; updated_at: string }[]
> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("insight_articles")
    .select("slug, updated_at")
    .eq("published", true)
    .order("published_at", { ascending: false })
    .limit(1000);

  if (error) {
    console.error("[insights] sitemap query failed", error);
    return [];
  }

  return (data ?? []) as { slug: string; updated_at: string }[];
}
