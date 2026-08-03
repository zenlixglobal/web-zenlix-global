import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLinkIcon, PlusIcon } from "lucide-react";

import { AdminShell } from "@/components/admin/admin-shell";
import { toggleInsightPublished } from "@/app/admin/insights/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { InsightArticle } from "@/lib/supabase/types";

export const metadata: Metadata = { title: "Insights" };

export const dynamic = "force-dynamic";

/**
 * Every insight article, draft and published.
 *
 * Reachable only through `requireAdmin()`, and the query runs on the session
 * client — the "admins read every insight" policy is what makes drafts visible
 * here while the public policy hides them everywhere else.
 */
export default async function InsightsAdminPage() {
  const user = await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("insight_articles")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(200);

  const articles = (data ?? []) as InsightArticle[];
  const live = articles.filter((article) => article.published).length;

  return (
    <AdminShell user={user}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl">Insights</h1>
          <p className="mt-1 text-sm text-slate-muted">
            {articles.length === 0
              ? "Write articles for the homepage and your own /insights pages."
              : `${live} published, ${articles.length - live} draft${
                  articles.length - live === 1 ? "" : "s"
                }. The newest three published appear on the homepage.`}
          </p>
        </div>

        <Button asChild variant="navy" size="lg" className="gap-2">
          <Link href="/admin/insights/new">
            <PlusIcon className="size-4" />
            New article
          </Link>
        </Button>
      </div>

      {error ? (
        <p className="border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Could not load articles: {error.message}
        </p>
      ) : articles.length === 0 ? (
        <div className="border border-line bg-white px-4 py-12 text-center">
          <p className="text-sm text-slate-muted">
            No articles yet. Until you publish one, the homepage shows the
            static placeholder cards from{" "}
            <code className="font-mono text-xs">src/content/site.ts</code>.
          </p>
          <Button asChild variant="navy" size="lg" className="mt-5 gap-2">
            <Link href="/admin/insights/new">
              <PlusIcon className="size-4" />
              Write the first one
            </Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto border border-line bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Article</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {articles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell className="max-w-96">
                    <Link
                      href={`/admin/insights/${article.id}`}
                      className="font-medium text-navy-900 underline-offset-4 hover:underline"
                    >
                      {article.title}
                    </Link>
                    <span className="block truncate font-mono text-xs text-slate-muted">
                      /insights/{article.slug}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-muted">
                    {article.category}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-slate-muted">
                    {formatDate(article.updated_at)}
                  </TableCell>
                  <TableCell>
                    {article.published ? (
                      <Badge
                        variant="outline"
                        className="border-emerald-600/30 bg-emerald-600/10 font-mono text-[11px] text-emerald-800 uppercase"
                      >
                        Published
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-line bg-muted font-mono text-[11px] text-slate-muted uppercase"
                      >
                        Draft
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      {article.published ? (
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="gap-1.5"
                        >
                          <Link
                            href={`/insights/${article.slug}`}
                            target="_blank"
                          >
                            <ExternalLinkIcon className="size-3.5" />
                            View
                          </Link>
                        </Button>
                      ) : null}

                      <form action={toggleInsightPublished}>
                        <input type="hidden" name="id" value={article.id} />
                        <input type="hidden" name="slug" value={article.slug} />
                        <input
                          type="hidden"
                          name="published"
                          value={article.published ? "false" : "true"}
                        />
                        <Button type="submit" variant="outline" size="sm">
                          {article.published ? "Unpublish" : "Publish"}
                        </Button>
                      </form>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AdminShell>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/London",
  }).format(new Date(value));
}
