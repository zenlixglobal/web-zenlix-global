"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { findAuthUserByEmail } from "@/lib/admin-users";
import { recordAudit } from "@/lib/audit";
import { authorize } from "@/lib/auth";
import { env } from "@/lib/env";
import {
  areaCapabilities,
  can,
  canManageRole,
  CAPABILITY_LABELS,
  findArea,
  findLevel,
  levelOf,
  resolveCapabilities,
  ROLE_LABELS,
  type AdminRole,
  type Capability,
} from "@/lib/permissions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AdminUserRow } from "@/lib/supabase/types";
import {
  areaAccessSchema,
  generateTemporaryPassword,
  inviteSchema,
  passwordSchema,
  profileSchema,
  roleChangeSchema,
  setDisabledSchema,
  userIdSchema,
  type SettingsFormState,
} from "@/lib/validation/settings";

/**
 * Team and profile management.
 *
 * Every action here is a public HTTP endpoint, so each one re-derives the
 * caller from the session — nothing about *who* is acting is ever read from
 * the request body. The client only ever names the target and the change.
 *
 * Writes go through the session client so the policies and triggers in
 * 0004_admin_roles.sql get the final say. The checks below exist to produce a
 * readable message and to avoid side effects (like creating an Auth account)
 * before a doomed write; they are not the boundary.
 */

/** 23505 = unique_violation, which on admin_users can only be the primary key. */
const UNIQUE_VIOLATION = "23505";

function fail(message: string, fieldErrors?: SettingsFormState["fieldErrors"]) {
  return { status: "error" as const, message, fieldErrors };
}

function ok(message: string, extra: Partial<SettingsFormState> = {}) {
  return { status: "success" as const, message, ...extra };
}

function fieldErrorsOf(error: z.ZodError): Record<string, string[]> {
  return z.flattenError(error).fieldErrors as Record<string, string[]>;
}

// ---------------------------------------------------------------------------
// Profile — anything a signed-in admin may change about themselves
// ---------------------------------------------------------------------------

export async function updateProfile(
  prevState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const attempt = (prevState.attempt ?? 0) + 1;

  // Every admin has a profile, so the capability floor is simply "is an admin".
  const auth = await authorize("submissions:read");
  if (!auth.ok) return { ...fail(auth.message), attempt };

  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName"),
  });

  if (!parsed.success) {
    return {
      ...fail(
        "Please check the highlighted field.",
        fieldErrorsOf(parsed.error),
      ),
      attempt,
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("admin_users")
    .update({ full_name: parsed.data.fullName })
    .eq("user_id", auth.user.id);

  if (error) {
    console.error("[settings] profile update failed", error);
    return { ...fail("Could not save your profile."), attempt };
  }

  await recordAudit(auth.user, "profile.updated", {
    targetId: auth.user.id,
    targetLabel: auth.user.email,
    meta: { full_name: parsed.data.fullName },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/users");

  return { ...ok("Profile saved."), attempt };
}

export async function changePassword(
  prevState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const attempt = (prevState.attempt ?? 0) + 1;

  const auth = await authorize("submissions:read");
  if (!auth.ok) return { ...fail(auth.message), attempt };

  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      ...fail(
        "Please check the highlighted fields.",
        fieldErrorsOf(parsed.error),
      ),
      attempt,
    };
  }

  // Supabase does not require the old password to set a new one, which means a
  // borrowed session — an unlocked laptop, a stolen cookie — could otherwise
  // lock the real owner out of their own account. Verifying it first is what
  // makes that attack need the password too.
  const verified = await verifyPassword(
    auth.user.email,
    parsed.data.currentPassword,
  );

  if (!verified) {
    return {
      ...fail("That current password is incorrect.", {
        currentPassword: ["That current password is incorrect"],
      }),
      attempt,
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.newPassword,
  });

  if (error) {
    console.error("[settings] password change failed", error.message);
    return {
      ...fail(
        error.message.toLowerCase().includes("password")
          ? error.message
          : "Could not update your password.",
      ),
      attempt,
    };
  }

  await recordAudit(auth.user, "password.changed", {
    targetId: auth.user.id,
    targetLabel: auth.user.email,
  });

  return {
    ...ok("Password updated. Your other devices stay signed in."),
    attempt,
  };
}

/**
 * Checks a password without touching the caller's session.
 *
 * A throwaway client with `persistSession: false` — signing in through the
 * cookie-backed server client would rotate the caller's own tokens as a side
 * effect of a validation check.
 */
async function verifyPassword(
  email: string,
  password: string,
): Promise<boolean> {
  try {
    const probe = createClient(env.supabaseUrl(), env.supabaseAnonKey(), {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error } = await probe.auth.signInWithPassword({ email, password });
    return !error;
  } catch (error) {
    console.error("[settings] password verification threw", error);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Team
// ---------------------------------------------------------------------------

/** Reads a target's current role, which decides whether the actor outranks them. */
async function loadTarget(userId: string): Promise<AdminUserRow | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("admin_users")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[settings] target lookup failed", error);
    return null;
  }

  return (data as AdminUserRow | null) ?? null;
}

function revalidateTeam() {
  revalidatePath("/admin/settings/users");
  revalidatePath("/admin/settings");
}

/**
 * Adds someone to the team.
 *
 * Two paths, and the difference matters: if the email already has a Supabase
 * Auth account we grant that account access and never touch its password. Only
 * a genuinely new address gets an account created, and only then is a
 * temporary password generated and shown once.
 */
export async function inviteAdminUser(
  prevState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const attempt = (prevState.attempt ?? 0) + 1;

  const auth = await authorize("users:manage");
  if (!auth.ok) return { ...fail(auth.message), attempt };

  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    fullName: formData.get("fullName") || undefined,
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return {
      ...fail(
        "Please check the highlighted fields.",
        fieldErrorsOf(parsed.error),
      ),
      attempt,
    };
  }

  const { email, fullName, role } = parsed.data;

  if (!canManageRole(auth.user, role)) {
    return {
      ...fail(`You cannot grant the ${ROLE_LABELS[role]} role.`, {
        role: ["Choose a role below your own"],
      }),
      attempt,
    };
  }

  let existing: { id: string; email: string } | null = null;

  try {
    existing = await findAuthUserByEmail(email);
  } catch (error) {
    console.error("[settings] auth lookup failed", error);
    return {
      ...fail("Could not reach the authentication service. Try again."),
      attempt,
    };
  }

  // Created here only so the failure path below knows whether the Auth account
  // is ours to clean up. Granting access to a pre-existing account must never
  // delete it.
  let createdUserId: string | null = null;
  let temporaryPassword: string | undefined;
  let userId: string;

  if (existing) {
    userId = existing.id;
  } else {
    temporaryPassword = generateTemporaryPassword();

    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: temporaryPassword,
      // No mail is sent from here, so leaving the address unconfirmed would
      // block the first sign-in with nothing to unblock it.
      email_confirm: true,
      user_metadata: fullName ? { full_name: fullName } : undefined,
    });

    if (error || !data.user) {
      console.error("[settings] createUser failed", error);
      return {
        ...fail(error?.message ?? "Could not create that account."),
        attempt,
      };
    }

    userId = data.user.id;
    createdUserId = data.user.id;
  }

  // Deliberately the session client: the insert has to clear "managers add
  // admins" and the rank trigger. A service-role insert here would let this
  // action grant a role the caller cannot grant.
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("admin_users").insert({
    user_id: userId,
    email,
    role,
    full_name: fullName || null,
    invited_by: auth.user.id,
  });

  if (error) {
    // Roll the Auth account back so a rejected grant doesn't strand a
    // half-created login that nobody can see in the UI.
    if (createdUserId) {
      const admin = createSupabaseAdminClient();
      const { error: cleanupError } =
        await admin.auth.admin.deleteUser(createdUserId);
      if (cleanupError) {
        console.error(
          "[settings] orphaned auth user",
          createdUserId,
          cleanupError,
        );
      }
    }

    if (error.code === UNIQUE_VIOLATION) {
      return {
        ...fail("That person is already on the team.", {
          email: ["Already has access"],
        }),
        attempt,
      };
    }

    console.error("[settings] grant failed", error);
    return { ...fail("Could not add that person to the team."), attempt };
  }

  await recordAudit(auth.user, existing ? "user.granted" : "user.invited", {
    targetId: userId,
    targetLabel: email,
    meta: { role, existing_account: Boolean(existing) },
  });

  revalidateTeam();

  return {
    ...ok(
      existing
        ? `${email} already had a login — they now have ${ROLE_LABELS[role]} access.`
        : `${email} added as ${ROLE_LABELS[role]}.`,
      { temporaryPassword },
    ),
    attempt,
  };
}

export async function updateAdminRole(
  prevState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const attempt = (prevState.attempt ?? 0) + 1;

  const auth = await authorize("users:manage");
  if (!auth.ok) return { ...fail(auth.message), attempt };

  const parsed = roleChangeSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });

  if (!parsed.success) return { ...fail("Invalid role change."), attempt };

  const guard = await guardTarget(
    auth.user,
    parsed.data.userId,
    parsed.data.role,
  );
  if (guard) return { ...fail(guard), attempt };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("admin_users")
    .update({ role: parsed.data.role })
    .eq("user_id", parsed.data.userId);

  if (error) {
    console.error("[settings] role change failed", error);
    return { ...fail(databaseMessage(error.message)), attempt };
  }

  // The role is a preset, so choosing one re-fills the feature boxes rather
  // than layering on top of whatever was ticked before. Keeping stale
  // overrides would make the preset a lie: pick "Viewer" and the person could
  // still be holding a granted `insights:write` from when they were an editor.
  const { error: clearError } = await supabase
    .from("admin_user_permissions")
    .delete()
    .eq("user_id", parsed.data.userId);

  if (clearError) {
    console.error("[settings] clearing overrides failed", clearError);
  }

  const target = await loadTarget(parsed.data.userId);

  await recordAudit(auth.user, "user.role_changed", {
    targetId: parsed.data.userId,
    targetLabel: target?.email ?? null,
    meta: { role: parsed.data.role },
  });

  revalidateTeam();

  return {
    ...ok(
      `Features reset to the ${ROLE_LABELS[parsed.data.role]} preset. Adjust them individually below.`,
    ),
    attempt,
  };
}

export async function setAdminDisabled(
  prevState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const attempt = (prevState.attempt ?? 0) + 1;

  const auth = await authorize("users:manage");
  if (!auth.ok) return { ...fail(auth.message), attempt };

  const parsed = setDisabledSchema.safeParse({
    userId: formData.get("userId"),
    disabled: formData.get("disabled"),
  });

  if (!parsed.success) return { ...fail("Invalid request."), attempt };

  const disabled = parsed.data.disabled === "true";

  const guard = await guardTarget(auth.user, parsed.data.userId);
  if (guard) return { ...fail(guard), attempt };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("admin_users")
    .update({ disabled_at: disabled ? new Date().toISOString() : null })
    .eq("user_id", parsed.data.userId);

  if (error) {
    console.error("[settings] disable toggle failed", error);
    return { ...fail(databaseMessage(error.message)), attempt };
  }

  const target = await loadTarget(parsed.data.userId);

  await recordAudit(auth.user, disabled ? "user.disabled" : "user.enabled", {
    targetId: parsed.data.userId,
    targetLabel: target?.email ?? null,
  });

  revalidateTeam();

  return {
    ...ok(disabled ? "Access suspended." : "Access restored."),
    attempt,
  };
}

/**
 * Revokes access. Deliberately does *not* delete the Supabase Auth account:
 * the audit log and any future `auth.users` reference would break, and getting
 * it wrong is unrecoverable. Deleting the login is a separate, manual act in
 * the Supabase dashboard.
 */
export async function removeAdminUser(
  prevState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const attempt = (prevState.attempt ?? 0) + 1;

  const auth = await authorize("users:manage");
  if (!auth.ok) return { ...fail(auth.message), attempt };

  const parsed = userIdSchema.safeParse({ userId: formData.get("userId") });
  if (!parsed.success) return { ...fail("Invalid request."), attempt };

  const guard = await guardTarget(auth.user, parsed.data.userId);
  if (guard) return { ...fail(guard), attempt };

  const target = await loadTarget(parsed.data.userId);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("admin_users")
    .delete()
    .eq("user_id", parsed.data.userId);

  if (error) {
    console.error("[settings] remove failed", error);
    return { ...fail(databaseMessage(error.message)), attempt };
  }

  await recordAudit(auth.user, "user.removed", {
    targetId: parsed.data.userId,
    targetLabel: target?.email ?? null,
    meta: { role: target?.role ?? null },
  });

  revalidateTeam();

  return {
    ...ok(
      `${target?.email ?? "That user"} no longer has admin access. Their sign-in still exists in Supabase Auth.`,
    ),
    attempt,
  };
}

/**
 * Sets one area — Enquiries, Insights, Analytics, Team — to one access level.
 *
 * The area's whole capability set is rewritten in a single statement so the
 * result can never be half-applied: pick "View only" and edit/delete are
 * revoked in the same breath that view is granted.
 *
 * When the chosen level already matches what the person's role gives them, the
 * overrides are deleted instead of written. That keeps them tracking the role
 * rather than pinning today's meaning of "Editor" onto them forever.
 */
export async function setAreaAccess(
  prevState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const attempt = (prevState.attempt ?? 0) + 1;

  const auth = await authorize("users:manage");
  if (!auth.ok) return { ...fail(auth.message), attempt };

  const parsed = areaAccessSchema.safeParse({
    userId: formData.get("userId"),
    area: formData.get("area"),
    level: formData.get("level"),
  });

  if (!parsed.success) return { ...fail("Invalid access change."), attempt };

  const area = findArea(parsed.data.area);
  const level = area ? findLevel(area, parsed.data.level) : null;

  if (!area || !level) return { ...fail("Unknown access level."), attempt };

  const guard = await guardTarget(auth.user, parsed.data.userId);
  if (guard) return { ...fail(guard), attempt };

  const target = await loadTarget(parsed.data.userId);
  if (!target) {
    return { ...fail("That user is no longer on the team."), attempt };
  }

  if (target.role === "owner") {
    return {
      ...fail("Owners always have every feature. Change their role instead."),
      attempt,
    };
  }

  // Re-derived from the session, never trusted from the form: the client says
  // which level, the server decides whether this actor may hand it out.
  const ungrantable = level.capabilities.filter(
    (capability) => !can(auth.user, capability),
  );

  if (ungrantable.length > 0) {
    return {
      ...fail(
        `You cannot grant "${CAPABILITY_LABELS[ungrantable[0]]}" — you don't have it yourself.`,
      ),
      attempt,
    };
  }

  const covered = areaCapabilities(area);
  const roleDefault = levelOf(area, resolveCapabilities(target.role));
  const supabase = await createSupabaseServerClient();

  const { error } =
    level.id === roleDefault.id
      ? await supabase
          .from("admin_user_permissions")
          .delete()
          .eq("user_id", parsed.data.userId)
          .in("capability", [...covered])
      : await supabase.from("admin_user_permissions").upsert(
          covered.map((capability) => ({
            user_id: parsed.data.userId,
            capability,
            granted: level.capabilities.includes(capability),
            updated_by: auth.user.id,
          })),
          { onConflict: "user_id,capability" },
        );

  if (error) {
    console.error("[settings] area access change failed", error);
    return { ...fail(databaseMessage(error.message)), attempt };
  }

  await recordAudit(auth.user, "access.changed", {
    targetId: parsed.data.userId,
    targetLabel: target.email,
    meta: { area: area.id, level: level.id, label: level.label },
  });

  revalidateTeam();

  return {
    ...ok(
      `${area.label}: ${level.label.toLowerCase()}${
        level.id === roleDefault.id
          ? ` — following the ${ROLE_LABELS[target.role]} preset again.`
          : "."
      }`,
    ),
    attempt,
  };
}

/**
 * The shared pre-flight for every action that targets another person.
 *
 * Returns a message when the change must not proceed, or null to continue.
 * Each rule here is also enforced by a trigger — this exists so the UI can say
 * *why*, rather than surfacing a raw Postgres error.
 */
async function guardTarget(
  actor: { id: string; role: AdminRole; capabilities: Capability[] },
  targetId: string,
  nextRole?: AdminRole,
): Promise<string | null> {
  if (targetId === actor.id) {
    return "You cannot change your own role or access. Ask another owner.";
  }

  const target = await loadTarget(targetId);
  if (!target) return "That user is no longer on the team.";

  if (!canManageRole(actor, target.role)) {
    return `You do not outrank ${ROLE_LABELS[target.role]}s.`;
  }

  if (nextRole && !canManageRole(actor, nextRole)) {
    return `You cannot grant the ${ROLE_LABELS[nextRole]} role.`;
  }

  return null;
}

/** Surfaces the trigger's own wording, which is written to be read by a human. */
function databaseMessage(message: string): string {
  const known = [
    "at least one active owner",
    "outrank",
    "your own role",
    "your own admin access",
  ];

  return known.some((fragment) => message.includes(fragment))
    ? message
    : "Could not apply that change.";
}
