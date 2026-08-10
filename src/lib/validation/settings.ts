import { z } from "zod";

import { ADMIN_ROLES } from "@/lib/permissions";

/**
 * Schemas for everything under /admin/settings.
 *
 * Shape validation only — whether the *caller* may perform the change is a
 * separate question answered by `authorize()` and by RLS. A perfectly valid
 * payload can still name a user the actor has no business touching.
 */

/** Shared by every settings action, consumed by `useActionState`. */
export type SettingsFormState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
  /**
   * Shown once, never stored: the generated password for a newly created
   * account. There is no way to retrieve it afterwards.
   */
  temporaryPassword?: string;
  /** Bumped on every submit so client effects re-fire on a repeated result. */
  attempt?: number;
};

export const idleSettingsState: SettingsFormState = {
  status: "idle",
  message: "",
};

export const profileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Enter your name")
    .max(120, "Name is too long"),
});

/**
 * Supabase enforces a 6-character minimum by default. 10 is the floor here
 * because these accounts can read every enquiry the site has ever taken.
 */
const password = z
  .string()
  .min(10, "Use at least 10 characters")
  .max(72, "Passwords are capped at 72 characters");

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: password,
    confirmPassword: z.string(),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "The two passwords don't match",
    path: ["confirmPassword"],
  })
  .refine((value) => value.newPassword !== value.currentPassword, {
    message: "Choose a password you haven't used here before",
    path: ["newPassword"],
  });

export const inviteSchema = z.object({
  email: z.email("Enter a valid email").trim().toLowerCase().max(320),
  fullName: z.string().trim().max(120, "Name is too long").optional(),
  role: z.enum(ADMIN_ROLES, { error: "Choose a role" }),
});

export const roleChangeSchema = z.object({
  userId: z.uuid(),
  role: z.enum(ADMIN_ROLES, { error: "Choose a role" }),
});

export const userIdSchema = z.object({ userId: z.uuid() });

/**
 * One access level for one area, for one person.
 *
 * The area and level are validated against `ACCESS_AREAS` in the action rather
 * than here: the pairing has to be checked together (a level id is only
 * meaningful inside its area), and an enum of every id would not express that.
 */
export const areaAccessSchema = z.object({
  userId: z.uuid(),
  area: z.string().min(1).max(40),
  level: z.string().min(1).max(40),
});

export const setDisabledSchema = z.object({
  userId: z.uuid(),
  disabled: z.enum(["true", "false"]),
});

/**
 * A first password for an invited account.
 *
 * Generated server-side from `crypto.getRandomValues` rather than `Math.random`
 * — this is a credential, however short-lived. The alphabet drops the
 * characters that are ambiguous when read aloud or copied out of a chat.
 */
export function generateTemporaryPassword(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = new Uint32Array(20);
  crypto.getRandomValues(bytes);

  return Array.from(bytes, (n) => alphabet[n % alphabet.length]).join("");
}
