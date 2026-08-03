"use client";

import Link from "next/link";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";

import { saveInsight } from "@/app/admin/insights/actions";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { InsightArticle } from "@/lib/supabase/types";
import {
  idleInsightFormState,
  slugify,
} from "@/lib/validation/insight";

const labelClass =
  "font-mono text-[11px] tracking-[0.06em] text-slate-muted uppercase";

function SaveButton({ published }: { published: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="navy" size="lg" disabled={pending}>
      {pending ? "Saving…" : published ? "Save & publish" : "Save draft"}
    </Button>
  );
}

/**
 * Create/edit form for an insight article.
 *
 * Like the contact form, every input is keyed on `attempt` and seeded from the
 * values the action echoes back: React 19 resets an uncontrolled action form
 * once the action settles, and losing a 2,000-word draft to a validation error
 * would be unforgivable.
 */
export function InsightForm({ article }: { article?: InsightArticle }) {
  const [state, formAction] = useActionState(saveInsight, idleInsightFormState);
  const formRef = useRef<HTMLFormElement>(null);
  const uid = useId();

  const attempt = state.attempt ?? 0;
  const echoed = state.values;

  // The slug tracks the title only until the author edits it by hand, so a
  // published URL is never silently rewritten by a later title tweak.
  const [slug, setSlug] = useState(article?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(article));
  const [published, setPublished] = useState(article?.published ?? false);

  const initial = (field: keyof InsightArticle, fallback = "") =>
    echoed?.[field as string] ?? (article?.[field] as string | null) ?? fallback;

  useEffect(() => {
    if (state.status === "success") toast.success(state.message);
    else if (state.status === "error") toast.error(state.message);
  }, [state]);

  const errorFor = (field: string) => state.fieldErrors?.[field];
  const fieldError = (field: string) =>
    errorFor(field)?.map((message) => ({ message }));

  return (
    <form ref={formRef} action={formAction} noValidate className="grid gap-5">
      {article ? <input type="hidden" name="id" value={article.id} /> : null}

      <Field data-invalid={Boolean(errorFor("title")) || undefined}>
        <FieldLabel htmlFor={`${uid}-title`} className={labelClass}>
          Headline *
        </FieldLabel>
        <Input
          key={`title-${attempt}`}
          id={`${uid}-title`}
          name="title"
          defaultValue={initial("title")}
          placeholder="Why senior engineering roles sit open for five months"
          className="h-11"
          required
          aria-invalid={Boolean(errorFor("title")) || undefined}
          onChange={(event) => {
            if (!slugTouched) setSlug(slugify(event.target.value));
          }}
        />
        <FieldError errors={fieldError("title")} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field data-invalid={Boolean(errorFor("slug")) || undefined}>
          <FieldLabel htmlFor={`${uid}-slug`} className={labelClass}>
            URL slug *
          </FieldLabel>
          <Input
            id={`${uid}-slug`}
            name="slug"
            value={echoed?.slug ?? slug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(slugify(event.target.value));
            }}
            placeholder="senior-roles-open-five-months"
            className="h-11 font-mono text-[13px]"
            aria-invalid={Boolean(errorFor("slug")) || undefined}
            aria-describedby={`${uid}-slug-hint`}
          />
          <p id={`${uid}-slug-hint`} className="text-xs text-slate-muted">
            /insights/{slug || "your-article"}
            {article?.published ? " · changing this breaks existing links" : ""}
          </p>
          <FieldError errors={fieldError("slug")} />
        </Field>

        <Field data-invalid={Boolean(errorFor("category")) || undefined}>
          <FieldLabel htmlFor={`${uid}-category`} className={labelClass}>
            Category *
          </FieldLabel>
          <Input
            key={`category-${attempt}`}
            id={`${uid}-category`}
            name="category"
            defaultValue={initial("category")}
            placeholder="Hiring Trends"
            className="h-11"
            required
            aria-invalid={Boolean(errorFor("category")) || undefined}
          />
          <FieldError errors={fieldError("category")} />
        </Field>
      </div>

      <Field data-invalid={Boolean(errorFor("excerpt")) || undefined}>
        <FieldLabel htmlFor={`${uid}-excerpt`} className={labelClass}>
          Card summary *
        </FieldLabel>
        <Textarea
          key={`excerpt-${attempt}`}
          id={`${uid}-excerpt`}
          name="excerpt"
          rows={2}
          defaultValue={initial("excerpt")}
          placeholder="One or two sentences. This is what appears on the homepage card and in search results."
          required
          aria-invalid={Boolean(errorFor("excerpt")) || undefined}
        />
        <FieldError errors={fieldError("excerpt")} />
      </Field>

      <Field data-invalid={Boolean(errorFor("body")) || undefined}>
        <FieldLabel htmlFor={`${uid}-body`} className={labelClass}>
          Article *
        </FieldLabel>
        <Textarea
          key={`body-${attempt}`}
          id={`${uid}-body`}
          name="body"
          rows={18}
          defaultValue={initial("body")}
          placeholder={"## A section heading\n\nA paragraph of the article.\n\n- A bullet point\n- Another one\n\n> A pull quote\n\nUse **bold**, *italic* and [links](https://example.com)."}
          className="font-mono text-[13px] leading-relaxed"
          required
          aria-invalid={Boolean(errorFor("body")) || undefined}
          aria-describedby={`${uid}-body-hint`}
        />
        <p id={`${uid}-body-hint`} className="text-xs text-slate-muted">
          Markdown subset: <code>##</code> headings, <code>-</code> bullets,{" "}
          <code>1.</code> numbered lists, <code>&gt;</code> quotes,{" "}
          <code>**bold**</code>, <code>*italic*</code>, <code>[text](url)</code>.
          HTML is not rendered.
        </p>
        <FieldError errors={fieldError("body")} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field data-invalid={Boolean(errorFor("imageUrl")) || undefined}>
          <FieldLabel htmlFor={`${uid}-imageUrl`} className={labelClass}>
            Cover image URL
          </FieldLabel>
          <Input
            key={`imageUrl-${attempt}`}
            id={`${uid}-imageUrl`}
            name="imageUrl"
            type="url"
            defaultValue={initial("image_url")}
            placeholder="https://images.unsplash.com/…"
            className="h-11"
            aria-invalid={Boolean(errorFor("imageUrl")) || undefined}
            aria-describedby={`${uid}-image-hint`}
          />
          <p id={`${uid}-image-hint`} className="text-xs text-slate-muted">
            The host must be allow-listed in next.config.ts, or the image will
            not render.
          </p>
          <FieldError errors={fieldError("imageUrl")} />
        </Field>

        <Field data-invalid={Boolean(errorFor("imageAlt")) || undefined}>
          <FieldLabel htmlFor={`${uid}-imageAlt`} className={labelClass}>
            Image alt text
          </FieldLabel>
          <Input
            key={`imageAlt-${attempt}`}
            id={`${uid}-imageAlt`}
            name="imageAlt"
            defaultValue={initial("image_alt")}
            placeholder="Describe the image for screen readers"
            className="h-11"
            aria-invalid={Boolean(errorFor("imageAlt")) || undefined}
          />
          <FieldError errors={fieldError("imageAlt")} />
        </Field>
      </div>

      <Field data-invalid={Boolean(errorFor("author")) || undefined}>
        <FieldLabel htmlFor={`${uid}-author`} className={labelClass}>
          Byline
        </FieldLabel>
        <Input
          key={`author-${attempt}`}
          id={`${uid}-author`}
          name="author"
          defaultValue={initial("author")}
          placeholder="Zenlix Global"
          className="h-11 sm:max-w-80"
          aria-invalid={Boolean(errorFor("author")) || undefined}
        />
        <FieldError errors={fieldError("author")} />
      </Field>

      <label className="flex items-start gap-3 border border-line bg-white p-4">
        <input
          type="checkbox"
          name="published"
          checked={published}
          onChange={(event) => setPublished(event.target.checked)}
          className="mt-0.5 size-4 accent-navy-900"
        />
        <span>
          <span className="block text-sm font-medium text-navy-900">
            Published
          </span>
          <span className="block text-xs text-slate-muted">
            Published articles appear on the homepage (newest three) and at
            their own URL. Drafts are invisible to visitors, even by direct
            link.
          </span>
        </span>
      </label>

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
        <SaveButton published={published} />
        <Button asChild variant="outline" size="lg">
          <Link href="/admin/insights">Cancel</Link>
        </Button>
        {article?.published ? (
          <Button asChild variant="ghost" size="lg" className="ml-auto">
            <Link href={`/insights/${article.slug}`} target="_blank">
              View on site
            </Link>
          </Button>
        ) : null}
      </div>
    </form>
  );
}
