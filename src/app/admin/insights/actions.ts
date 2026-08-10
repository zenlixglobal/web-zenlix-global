"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { authorize } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { InsightArticleInput } from "@/lib/supabase/types";
import {
  insightSchema,
  slugify,
  type InsightFormState,
} from "@/lib/validation/insight";

/**
 * Insight article CRUD.
 *
 * Server Actions are public HTTP endpoints, so each re-checks the caller and
 * their role. The writes also go through the session client, so the "admins
 * write insights" RLS policy is the backstop if that check is ever removed.
 *
 * Deleting is held to a higher rank than writing: an editor can unpublish an
 * article, which is reversible, but only an admin can destroy one.
 */

/** 23505 = unique_violation, which here can only be the slug. */
const UNIQUE_VIOLATION = "23505";

function readValues(formData: FormData) {
  const read = (name: string) => String(formData.get(name) ?? "");

  return {
    title: read("title"),
    // An empty slug is derived from the title rather than rejected — the
    // author shouldn't have to think about URLs to publish.
    slug: read("slug").trim() || slugify(read("title")),
    category: read("category"),
    excerpt: read("excerpt"),
    body: read("body"),
    imageUrl: read("imageUrl"),
    imageAlt: read("imageAlt"),
    author: read("author"),
    published: formData.get("published") === "on",
  };
}

/** Everything the form needs to re-render itself after a rejected save. */
function echo(values: ReturnType<typeof readValues>): Record<string, string> {
  return {
    title: values.title,
    slug: values.slug,
    category: values.category,
    excerpt: values.excerpt,
    body: values.body,
    imageUrl: values.imageUrl,
    imageAlt: values.imageAlt,
    author: values.author,
    published: values.published ? "on" : "",
  };
}

function toRow(parsed: z.infer<typeof insightSchema>): InsightArticleInput {
  return {
    title: parsed.title,
    slug: parsed.slug,
    category: parsed.category,
    excerpt: parsed.excerpt,
    body: parsed.body,
    image_url: parsed.imageUrl,
    image_alt: parsed.imageAlt,
    author: parsed.author,
    published: parsed.published,
  };
}

/** Refresh every surface an article can appear on. */
function revalidateArticle(slug: string) {
  revalidatePath("/admin/insights");
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
  revalidatePath(`/insights/${slug}`);
}

export async function saveInsight(
  prevState: InsightFormState,
  formData: FormData,
): Promise<InsightFormState> {
  const attempt = (prevState.attempt ?? 0) + 1;

  const auth = await authorize("insights:write");
  if (!auth.ok) return { status: "error", message: auth.message, attempt };

  const values = readValues(formData);
  const id = String(formData.get("id") ?? "").trim();

  const fail = (
    message: string,
    fieldErrors?: InsightFormState["fieldErrors"],
  ): InsightFormState => ({
    status: "error",
    message,
    fieldErrors,
    values: echo(values),
    attempt,
  });

  const parsed = insightSchema.safeParse(values);

  if (!parsed.success) {
    return fail(
      "Please check the highlighted fields.",
      z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    );
  }

  const row = toRow(parsed.data);
  const supabase = await createSupabaseServerClient();

  if (id) {
    const { error } = await supabase
      .from("insight_articles")
      .update(row)
      .eq("id", id);

    if (error) {
      if (error.code === UNIQUE_VIOLATION) {
        return fail("That slug is already used by another article.", {
          slug: ["Choose a different slug"],
        });
      }
      console.error("[insights] update failed", error);
      return fail("Could not save the article.");
    }

    revalidateArticle(row.slug);
    return {
      status: "success",
      message: row.published ? "Article saved and published." : "Draft saved.",
      attempt,
    };
  }

  const { data, error } = await supabase
    .from("insight_articles")
    .insert(row)
    .select("id")
    .single();

  if (error || !data) {
    if (error?.code === UNIQUE_VIOLATION) {
      return fail("That slug is already used by another article.", {
        slug: ["Choose a different slug"],
      });
    }
    console.error("[insights] insert failed", error);
    return fail("Could not create the article.");
  }

  revalidateArticle(row.slug);
  // Redirect so a refresh doesn't post the form again and create a duplicate.
  redirect(`/admin/insights/${data.id}?created=1`);
}

const deleteSchema = z.object({ id: z.uuid(), slug: z.string().max(120) });

export async function deleteInsight(formData: FormData): Promise<void> {
  const auth = await authorize("insights:delete");
  if (!auth.ok) return;

  const parsed = deleteSchema.safeParse({
    id: formData.get("id"),
    slug: formData.get("slug") ?? "",
  });

  if (!parsed.success) return;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("insight_articles")
    .delete()
    .eq("id", parsed.data.id);

  if (error) {
    console.error("[insights] delete failed", error);
    return;
  }

  revalidateArticle(parsed.data.slug);
  redirect("/admin/insights?deleted=1");
}

const publishSchema = z.object({
  id: z.uuid(),
  slug: z.string().max(120),
  published: z.enum(["true", "false"]),
});

/** Publish/unpublish from the list, without opening the editor. */
export async function toggleInsightPublished(formData: FormData): Promise<void> {
  const auth = await authorize("insights:write");
  if (!auth.ok) return;

  const parsed = publishSchema.safeParse({
    id: formData.get("id"),
    slug: formData.get("slug") ?? "",
    published: formData.get("published"),
  });

  if (!parsed.success) return;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("insight_articles")
    .update({ published: parsed.data.published === "true" })
    .eq("id", parsed.data.id);

  if (error) {
    console.error("[insights] publish toggle failed", error);
    return;
  }

  revalidateArticle(parsed.data.slug);
}
