import "server-only";

import { isCapability, type CapabilityOverride } from "@/lib/permissions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AdminUserRow } from "@/lib/supabase/types";

/** A row of the team table, enriched with what only Auth knows. */
export type AdminTeamMember = AdminUserRow & {
  /** From auth.users; null when Auth could not be reached or never signed in. */
  lastSignInAt: string | null;
  /** Per-feature adjustments; empty means this person tracks their role. */
  overrides: CapabilityOverride[];
};

/**
 * `auth.admin.listUsers()` is paginated and the page size is capped. A team
 * table is small by nature, so one page is normally the whole story — the loop
 * exists so a large project degrades to "missing last-seen times" rather than
 * silently truncating.
 */
const AUTH_PAGE_SIZE = 200;
const AUTH_MAX_PAGES = 5;

/**
 * The team list.
 *
 * The roster itself is read with the **session** client so RLS decides who can
 * see it — a caller without the "admins read the team" policy gets an empty
 * list, not a leak. Only the sign-in timestamps come from the service-role
 * client, because `auth.users` is not reachable through PostgREST at all.
 *
 * Callers must have already checked `users:read`; this function does not
 * authorize, it reads.
 */
export async function listAdminTeam(): Promise<{
  members: AdminTeamMember[];
  error: string | null;
}> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("admin_users")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(500);

  if (error) {
    console.error("[settings] team list failed", error);
    return { members: [], error: "Could not load the team." };
  }

  const rows = (data ?? []) as AdminUserRow[];

  // One query for every member's overrides rather than one per row: the table
  // is small and sparse, so the whole set is cheaper than N round trips.
  const { data: permissionRows, error: permissionError } = await supabase
    .from("admin_user_permissions")
    .select("user_id, capability, granted");

  if (permissionError) {
    console.error("[settings] permission read failed", permissionError);
  }

  const overridesByUser = new Map<string, CapabilityOverride[]>();

  for (const row of permissionRows ?? []) {
    if (!isCapability(row.capability)) continue;
    const list = overridesByUser.get(row.user_id) ?? [];
    list.push({ capability: row.capability, granted: row.granted });
    overridesByUser.set(row.user_id, list);
  }

  const lastSignIn = await lastSignInByUserId();

  return {
    members: rows.map((row) => ({
      ...row,
      lastSignInAt: lastSignIn.get(row.user_id) ?? null,
      overrides: overridesByUser.get(row.user_id) ?? [],
    })),
    error: null,
  };
}

async function lastSignInByUserId(): Promise<Map<string, string | null>> {
  const found = new Map<string, string | null>();

  try {
    const admin = createSupabaseAdminClient();

    for (let page = 1; page <= AUTH_MAX_PAGES; page += 1) {
      const { data, error } = await admin.auth.admin.listUsers({
        page,
        perPage: AUTH_PAGE_SIZE,
      });

      if (error) {
        console.error("[settings] listUsers failed", error);
        break;
      }

      for (const user of data.users) {
        found.set(user.id, user.last_sign_in_at ?? null);
      }

      if (data.users.length < AUTH_PAGE_SIZE) break;
    }
  } catch (error) {
    // A missing service-role key must not take the whole page down: the
    // roster is the point, the timestamps are a nicety.
    console.error("[settings] could not reach Auth for sign-in times", error);
  }

  return found;
}

/**
 * Finds an existing Auth account by email.
 *
 * Supabase has no "get user by email" admin endpoint, so this scans the same
 * paginated list. Used when granting access to someone who already has a login
 * — creating a second account for the same address would fail anyway, and
 * would be the wrong thing even if it succeeded.
 */
export async function findAuthUserByEmail(
  email: string,
): Promise<{ id: string; email: string } | null> {
  const target = email.trim().toLowerCase();
  const admin = createSupabaseAdminClient();

  for (let page = 1; page <= AUTH_MAX_PAGES; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: AUTH_PAGE_SIZE,
    });

    if (error) {
      console.error("[settings] listUsers failed", error);
      return null;
    }

    const match = data.users.find(
      (user) => user.email?.toLowerCase() === target,
    );

    if (match) return { id: match.id, email: match.email ?? target };
    if (data.users.length < AUTH_PAGE_SIZE) return null;
  }

  return null;
}

/** Display name for a team member, falling back to the local part of the email. */
export function displayName(member: {
  full_name: string | null;
  email: string;
}): string {
  return member.full_name?.trim() || member.email.split("@")[0] || member.email;
}
