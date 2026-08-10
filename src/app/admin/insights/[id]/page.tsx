import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { deleteInsight } from "@/app/admin/insights/actions";
import { InsightForm } from "@/components/admin/insight-form";
import { Button } from "@/components/ui/button";
import { requireCapability } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { InsightArticle } from "@/lib/supabase/types";

export const metadata: Metadata = { title: "Edit article" };

export const dynamic = "force-dynamic";

export default async function EditInsightPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireCapability("insights:write");
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("insight_articles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) console.error("[insights] load failed", error);
  if (!data) notFound();

  const article = data as InsightArticle;

  return (
    <AdminShell user={user}>
      <div className="mb-6">
        <Link
          href="/admin/insights"
          className="text-[13px] text-slate-muted underline-offset-4 hover:text-navy-900 hover:underline"
        >
          <span aria-hidden>&larr;</span> Insights
        </Link>
        <h1 className="mt-2 text-2xl sm:text-3xl">Edit article</h1>
        <p className="mt-1 text-sm text-slate-muted">
          Last updated {formatDate(article.updated_at)}
          {article.published_at
            ? ` · first published ${formatDate(article.published_at)}`
            : " · never published"}
        </p>
      </div>

      <div className="max-w-4xl">
        <InsightForm article={article} />

        {/* Editors write and unpublish; only admins destroy. The section is
            hidden rather than disabled — there is nothing an editor can do
            here, so offering the affordance would only be a dead end. */}
        {can(user, "insights:delete") ? (
          <div className="mt-10 border border-destructive/25 bg-destructive/5 p-4">
            <h2 className="text-sm font-semibold text-destructive">
              Delete this article
            </h2>
            <p className="mt-1 mb-3 text-xs text-slate-muted">
              Permanent, and cannot be undone. If the article is published, the
              URL will start returning 404 — unpublish instead if you only want
              it off the site for now.
            </p>
            {/* No JS confirm: the button is styled as destructive and sits
                behind its own heading, which is the pattern used elsewhere in
                /admin. */}
            <form action={deleteInsight}>
              <input type="hidden" name="id" value={article.id} />
              <input type="hidden" name="slug" value={article.slug} />
              <Button type="submit" variant="destructive" size="lg">
                Delete permanently
              </Button>
            </form>
          </div>
        ) : null}
      </div>
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
