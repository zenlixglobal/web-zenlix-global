"use server";

import { headers } from "next/headers";
import { z } from "zod";

import { sendEnquirerAcknowledgement } from "@/lib/email/send-acknowledgement-email";
import { sendContactEmail } from "@/lib/email/send-contact-email";
import { isSupabaseConfigured } from "@/lib/env";
import { clientIpFrom, rateLimit } from "@/lib/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  contactSchema,
  newsletterSchema,
  readContactValues,
  type FormState,
  type NewsletterFormState,
} from "@/lib/validation/contact";

const GENERIC_ERROR =
  "Something went wrong on our end. Please try again, or email us directly.";

const SUCCESS_MESSAGE =
  "Thank you — your enquiry is with our team. We'll be in touch shortly.";

/**
 * Handles the /contact form: validate → persist to Supabase → notify by email.
 *
 * The database write is what makes a submission "accepted"; email is a
 * best-effort notification on top, so a mail provider outage never loses an
 * enquiry.
 */
export async function submitContactForm(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const attempt = (prevState.attempt ?? 0) + 1;
  // Captured before validation so every failure path can hand the visitor
  // their own text back.
  const values = readContactValues(formData);
  const fail = (message: string, fieldErrors?: FormState["fieldErrors"]) =>
    ({ status: "error", message, fieldErrors, values, attempt }) satisfies FormState;

  const parsed = contactSchema.safeParse({
    ...values,
    website: formData.get("website") ?? "",
  });

  if (!parsed.success) {
    return fail(
      "Please check the highlighted fields and try again.",
      z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    );
  }

  const input = parsed.data;

  // Honeypot: accept silently so bots don't learn they were caught.
  if (input.website) {
    return { status: "success", message: SUCCESS_MESSAGE, attempt };
  }

  const requestHeaders = await headers();
  const ip = clientIpFrom(requestHeaders);
  const limit = rateLimit(`contact:${ip}`, {
    limit: 5,
    windowMs: 10 * 60 * 1000,
  });

  if (!limit.allowed) {
    return fail(
      `Too many submissions from this connection. Please try again in ${Math.ceil(
        limit.retryAfterSeconds / 60,
      )} minute(s).`,
    );
  }

  if (!isSupabaseConfigured()) {
    console.error("[contact] Supabase is not configured — dropping submission", {
      email: input.email,
    });
    return fail(GENERIC_ERROR);
  }

  try {
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("contact_submissions")
      .insert({
        first_name: input.firstName,
        last_name: input.lastName,
        email: input.email,
        phone: input.phone,
        company: input.company,
        inquiry_type: input.inquiryType,
        message: input.message,
        source_page: "/contact",
        user_agent: requestHeaders.get("user-agent")?.slice(0, 500) ?? null,
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error("[contact] Supabase insert failed", error);
      return fail(GENERIC_ERROR);
    }

    // Both notifications go out together — neither should wait on the other,
    // and neither can fail the submission, which the database write already
    // accepted. `allSettled` because a rejected acknowledgement must not stop
    // the team from being told.
    const [teamResult] = await Promise.allSettled([
      sendContactEmail(input, { submissionId: data.id }),
      sendEnquirerAcknowledgement(input),
    ]);

    if (teamResult.status === "fulfilled" && teamResult.value.sent) {
      // Recorded so the admin list can flag enquiries nobody was emailed about.
      await supabase
        .from("contact_submissions")
        .update({ email_sent_at: new Date().toISOString() })
        .eq("id", data.id);
    }

    return { status: "success", message: SUCCESS_MESSAGE, attempt };
  } catch (error) {
    console.error("[contact] Unexpected failure", error);
    return fail(GENERIC_ERROR);
  }
}

/** Footer newsletter signup. */
export async function subscribeToNewsletter(
  prevState: NewsletterFormState,
  formData: FormData,
): Promise<NewsletterFormState> {
  const attempt = (prevState.attempt ?? 0) + 1;
  // Same React 19 form-reset problem as the contact form: echo the address
  // back so a rejected signup doesn't blank the field.
  const email = String(formData.get("email") ?? "").slice(0, 400);
  const fail = (message: string) =>
    ({ status: "error", message, email, attempt }) satisfies NewsletterFormState;

  const parsed = newsletterSchema.safeParse({ email });

  if (!parsed.success) {
    return fail("Enter a valid email address.");
  }

  const ip = clientIpFrom(await headers());
  const limit = rateLimit(`newsletter:${ip}`, {
    limit: 5,
    windowMs: 10 * 60 * 1000,
  });

  if (!limit.allowed) {
    return fail("Too many attempts. Try again later.");
  }

  if (!isSupabaseConfigured()) {
    console.error("[newsletter] Supabase is not configured");
    return fail(GENERIC_ERROR);
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email: parsed.data.email });

    // 23505 = unique violation. Already subscribed is a success from the
    // visitor's point of view, and confirming it doesn't leak anything useful.
    if (error && error.code !== "23505") {
      console.error("[newsletter] Supabase insert failed", error);
      return fail(GENERIC_ERROR);
    }

    return {
      status: "success",
      message: "You're subscribed. Welcome aboard.",
      attempt,
    };
  } catch (error) {
    console.error("[newsletter] Unexpected failure", error);
    return fail(GENERIC_ERROR);
  }
}
