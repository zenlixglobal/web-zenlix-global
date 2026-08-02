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

/** Shape returned by both server actions, consumed by `useActionState`. */
export type FormState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export const idleFormState: FormState = { status: "idle", message: "" };
