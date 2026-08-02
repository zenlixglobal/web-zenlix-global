"use server";

import { headers } from "next/headers";
import { z } from "zod";

import { sendContactEmail } from "@/lib/email/send-contact-email";
import { isSupabaseConfigured } from "@/lib/env";
import { clientIpFrom, rateLimit } from "@/lib/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  contactSchema,
  newsletterSchema,
  type FormState,
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
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = contactSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    company: formData.get("company"),
    inquiryType: formData.get("inquiryType"),
    message: formData.get("message"),
    website: formData.get("website") ?? "",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields and try again.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const input = parsed.data;

  // Honeypot: accept silently so bots don't learn they were caught.
  if (input.website) {
    return { status: "success", message: SUCCESS_MESSAGE };
  }

  const requestHeaders = await headers();
  const ip = clientIpFrom(requestHeaders);
  const limit = rateLimit(`contact:${ip}`, {
    limit: 5,
    windowMs: 10 * 60 * 1000,
  });

  if (!limit.allowed) {
    return {
      status: "error",
      message: `Too many submissions from this connection. Please try again in ${Math.ceil(
        limit.retryAfterSeconds / 60,
      )} minute(s).`,
    };
  }

  if (!isSupabaseConfigured()) {
    console.error("[contact] Supabase is not configured — dropping submission", {
      email: input.email,
    });
    return { status: "error", message: GENERIC_ERROR };
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
      return { status: "error", message: GENERIC_ERROR };
    }

    const emailResult = await sendContactEmail(input, {
      submissionId: data.id,
    });

    if (emailResult.sent) {
      // Recorded so the admin list can flag enquiries nobody was emailed about.
      await supabase
        .from("contact_submissions")
        .update({ email_sent_at: new Date().toISOString() })
        .eq("id", data.id);
    }

    return { status: "success", message: SUCCESS_MESSAGE };
  } catch (error) {
    console.error("[contact] Unexpected failure", error);
    return { status: "error", message: GENERIC_ERROR };
  }
}

/** Footer newsletter signup. */
export async function subscribeToNewsletter(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = newsletterSchema.safeParse({ email: formData.get("email") });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Enter a valid email address.",
    };
  }

  const ip = clientIpFrom(await headers());
  const limit = rateLimit(`newsletter:${ip}`, {
    limit: 5,
    windowMs: 10 * 60 * 1000,
  });

  if (!limit.allowed) {
    return { status: "error", message: "Too many attempts. Try again later." };
  }

  if (!isSupabaseConfigured()) {
    console.error("[newsletter] Supabase is not configured");
    return { status: "error", message: GENERIC_ERROR };
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
      return { status: "error", message: GENERIC_ERROR };
    }

    return { status: "success", message: "You're subscribed. Welcome aboard." };
  } catch (error) {
    console.error("[newsletter] Unexpected failure", error);
    return { status: "error", message: GENERIC_ERROR };
  }
}
