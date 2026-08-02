import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminUser = { id: string; email: string };

/**
 * The authorization boundary for /admin.
 *
 * Call this in every admin page/action — not just the layout — because layouts
 * do not re-run on every navigation and never run for Server Actions.
 *
 * `getUser()` (not `getSession()`) is used deliberately: it revalidates the JWT
 * with Supabase instead of trusting a cookie the browser could have forged.
 * Membership of `admin_users` is then checked through RLS.
 */
export const getAdminUser = cache(async (): Promise<AdminUser | null> => {
  // Before Supabase is wired up there is no one to authenticate. Treat that as
  // "signed out" so /admin redirects to the login page's setup instructions
  // rather than throwing a 500.
  if (!isSupabaseConfigured()) return null;

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const { data: isAdmin, error: rpcError } = await supabase.rpc("is_admin");

  if (rpcError) {
    console.error("[auth] is_admin() failed", rpcError);
    return null;
  }

  if (!isAdmin) return null;

  return { id: user.id, email: user.email ?? "" };
});

/** Same as above, but redirects instead of returning null. */
export async function requireAdmin(): Promise<AdminUser> {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  return user;
}
