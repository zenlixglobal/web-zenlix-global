import { z } from "zod";

import { inquiryValues } from "@/content/site";

/**
 * Shared by the client form (via react-hook-form) and the server action, so
 * the browser and the server can never disagree about what is valid.
 */
export const contactSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(100, "First name is too long"),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .max(100, "Last name is too long"),
  email: z
    .email("Enter a valid work email")
    .trim()
    .max(320, "Email is too long"),
  phone: z
    .string()
    .trim()
    .min(5, "Enter a valid phone number")
    .max(40, "Phone number is too long")
    .regex(/^[0-9+()\-.\s]+$/, "Use digits and + ( ) - . only"),
  company: z
    .string()
    .trim()
    .min(1, "Company name is required")
    .max(200, "Company name is too long"),
  inquiryType: z.enum(inquiryValues, {
    error: "Select an inquiry type",
  }),
  message: z
    .string()
    .trim()
    .min(10, "Please give us a little more detail (10 characters minimum)")
    .max(5000, "Message is too long"),
  /**
   * Honeypot. Real users never see this field, so anything in it is a bot.
   * Named innocuously because scrapers fill fields by name.
   */
  website: z.string().max(0).optional().or(z.literal("")),
});

export type ContactInput = z.infer<typeof contactSchema>;

export const newsletterSchema = z.object({
  email: z.email("Enter a valid email address").trim().max(320),
});

export type NewsletterInput = z.infer<typeof newsletterSchema>;

/** The raw strings a submission carried, echoed back on failure. */
export type ContactFieldValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  inquiryType: string;
  message: string;
};

/** Shape returned by both server actions, consumed by `useActionState`. */
export type FormState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
  /**
   * What the visitor typed, sent back so a rejected submission doesn't wipe
   * the form.
   *
   * React 19 resets an uncontrolled `<form action={fn}>` once the action
   * settles, regardless of outcome. Re-seeding the inputs from here is what
   * makes a validation error survivable — otherwise a missing phone number
   * costs the visitor their whole message.
   *
   * Absent on success, which is how the form knows to come back empty.
   */
  values?: ContactFieldValues;
  /**
   * Increments per submission. The form keys its inputs on this so they
   * remount with the echoed values, rather than depending on whether React's
   * reset lands before or after the re-render.
   */
  attempt?: number;
};

export const idleFormState: FormState = { status: "idle", message: "" };

/** Newsletter equivalent — one field, same reset problem. */
export type NewsletterFormState = FormState & { email?: string };

/**
 * Pulls the submitted strings straight off the FormData, before validation.
 *
 * Bounded because this round-trips back through the RSC payload and the input
 * is attacker-controlled; the cap is well above every field's real maximum, so
 * no legitimate submission is ever truncated.
 */
export function readContactValues(formData: FormData): ContactFieldValues {
  const read = (name: string, limit: number) =>
    String(formData.get(name) ?? "").slice(0, limit);

  return {
    firstName: read("firstName", 400),
    lastName: read("lastName", 400),
    email: read("email", 400),
    phone: read("phone", 200),
    company: read("company", 400),
    inquiryType: read("inquiryType", 100),
    message: read("message", 10_000),
  };
}
