import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { isSupabaseConfigured } from "@/lib/env";
import {
  can,
  isAdminRole,
  isCapability,
  resolveCapabilities,
  type AdminRole,
  type Capability,
  type CapabilityOverride,
} from "@/lib/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminUser = {
  id: string;
  email: string;
  role: AdminRole;
  fullName: string | null;
  createdAt: string;
  /**
   * The resolved feature set: the role's defaults, plus this person's own
   * grants and revocations, closed over implications. Resolved once per
   * request so nothing downstream has to know the two-layer model exists.
   */
  capabilities: Capability[];
};

/**
 * The authorization boundary for /admin.
 *
 * Call this in every admin page/action — not just the layout — because layouts
 * do not re-run on every navigation and never run for Server Actions.
 *
 * `getUser()` (not `getSession()`) is used deliberately: it revalidates the JWT
 * with Supabase instead of trusting a cookie the browser could have forged.
 * Membership of `admin_users` is then read back through RLS, which is also how
 * a suspended account loses access: `is_admin()` ignores rows with a
 * `disabled_at`, so revoking someone takes effect on their next request rather
 * than whenever their JWT happens to expire.
 */
const getAuthUser = cache(async () => {
  // Before Supabase is wired up there is no one to authenticate. Treat that as
  // "signed out" so /admin redirects to the login page's setup instructions
  // rather than throwing a 500.
  if (!isSupabaseConfigured()) return null;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return error ? null : user;
});

export const getAdminUser = cache(async (): Promise<AdminUser | null> => {
  const user = await getAuthUser();
  if (!user) return null;

  const supabase = await createSupabaseServerClient();

  // Replaces the old is_admin() RPC: the row is only selectable when the
  // "admins read the team" policy passes, and that policy calls is_admin()
  // itself. So this is the same check, and it returns the role in the same
  // round trip instead of needing a second one.
  const { data: profile, error: profileError } = await supabase
    .from("admin_users")
    .select("role, full_name, email, created_at, disabled_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("[auth] admin profile lookup failed", profileError);
    return null;
  }

  // `disabled_at` is re-checked rather than left to the policy alone, so a
  // future policy edit cannot quietly re-admit suspended accounts.
  if (!profile || profile.disabled_at || !isAdminRole(profile.role)) {
    return null;
  }

  // Own overrides are readable without `users:read` — "admins read their own
  // permissions" exists precisely so this resolves for everyone.
  const { data: overrideRows, error: overrideError } = await supabase
    .from("admin_user_permissions")
    .select("capability, granted")
    .eq("user_id", user.id);

  if (overrideError) {
    // Failing closed to the role default is the safe direction: it can only
    // ever withhold a granted extra, never hand out something revoked.
    console.error("[auth] permission overrides failed", overrideError);
  }

  const overrides: CapabilityOverride[] = (overrideRows ?? [])
    .filter((row) => isCapability(row.capability))
    .map((row) => ({
      capability: row.capability as Capability,
      granted: row.granted,
    }));

  return {
    id: user.id,
    email: profile.email || user.email || "",
    role: profile.role,
    fullName: profile.full_name,
    createdAt: profile.created_at,
    capabilities: resolveCapabilities(profile.role, overrides),
  };
});

/**
 * Same as above, but redirects instead of returning null.
 *
 * The two destinations are not cosmetic. Someone holding a valid Supabase
 * session that is *not* on the team — access revoked, suspended, or never
 * granted — would otherwise ping-pong forever: this redirect sends them to
 * /admin/login, and proxy.ts bounces anyone with a session off /admin/login
 * straight back here. The `?denied=1` marker is what breaks that loop, and
 * `proxy.ts` is written to respect it.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const user = await getAdminUser();
  if (user) return user;

  const signedIn = await getAuthUser();
  redirect(signedIn ? "/admin/login?denied=1" : "/admin/login");
}

/**
 * `requireAdmin()` plus a capability check, for pages.
 *
 * Sends someone who typed a URL their role cannot open back to the dashboard.
 * Server Actions use `authorize()` instead — a POST needs an error message,
 * not a redirect.
 */
export async function requireCapability(
  capability: Capability,
): Promise<AdminUser> {
  const user = await requireAdmin();
  if (!can(user, capability)) redirect("/admin?denied=1");
  return user;
}

export type AuthzResult =
  | { ok: true; user: AdminUser }
  | { ok: false; message: string };

/**
 * The Server Action form of the check.
 *
 * Returns rather than throws, so the caller can surface the refusal in the
 * form it came from. RLS refuses the write either way — this is what turns
 * that refusal into a sentence instead of a silent no-op.
 */
export async function authorize(capability: Capability): Promise<AuthzResult> {
  const user = await getAdminUser();

  if (!user) return { ok: false, message: "Your session has expired." };

  if (!can(user, capability)) {
    return { ok: false, message: "Your role does not allow that." };
  }

  return { ok: true, user };
}
