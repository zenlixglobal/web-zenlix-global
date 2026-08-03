import { z } from "zod";

/** Shared by the admin form and the server action. */

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const insightSchema = z.object({
  title: z.string().trim().min(3, "Title is required").max(200, "Title is too long"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Slug is too short")
    .max(120, "Slug is too long")
    .regex(SLUG_PATTERN, "Use lowercase letters, numbers and hyphens only"),
  category: z
    .string()
    .trim()
    .min(2, "Category is required")
    .max(60, "Category is too long"),
  excerpt: z
    .string()
    .trim()
    .min(10, "Write a slightly longer summary (10 characters minimum)")
    .max(400, "The summary is too long for a card (400 characters maximum)"),
  body: z
    .string()
    .trim()
    .min(10, "The article needs a body")
    .max(60000, "The article is too long"),
  imageUrl: z
    .union([z.url("Enter a valid image URL"), z.literal("")])
    .optional()
    .transform((value) => value || null),
  imageAlt: z
    .string()
    .trim()
    .max(300, "Alt text is too long")
    .optional()
    .transform((value) => value || null),
  author: z
    .string()
    .trim()
    .max(120, "Author name is too long")
    .optional()
    .transform((value) => value || null),
  published: z.boolean(),
});

export type InsightInput = z.infer<typeof insightSchema>;

/**
 * Turns a headline into a URL slug.
 *
 * Runs on the client to prefill the field and on the server as a fallback, so
 * it must be deterministic and dependency-free. `NFKD` + stripping combining
 * marks folds accented characters to ASCII rather than dropping them, so
 * "Résumé" becomes "resume" and not "rsum".
 */
export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120)
    .replace(/-+$/g, "");
}

export type InsightFormState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
  /** Echoed back so a rejected save never costs the author their draft. */
  values?: Record<string, string>;
  attempt?: number;
};

export const idleInsightFormState: InsightFormState = {
  status: "idle",
  message: "",
};
