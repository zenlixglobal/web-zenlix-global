import "server-only";

import type { AdminUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Append-only record of who changed what in the admin area.
 *
 * Written with the **session** client on purpose. The insert policy pins
 * `actor_id` to `auth.uid()`, so an entry cannot be attributed to anyone but
 * the person who actually made the request — a guarantee the service-role
 * client would throw away.
 *
 * Never throws. An audit write failing must not roll back or mask the change
 * the admin actually asked for; a dropped line in the log is logged loudly to
 * the server console instead.
 */
export type AuditAction =
  | "user.invited"
  | "user.granted"
  | "user.role_changed"
  | "permission.changed"
  | "access.changed"
  | "user.disabled"
  | "user.enabled"
  | "user.removed"
  | "profile.updated"
  | "password.changed";

export async function recordAudit(
  actor: Pick<AdminUser, "id" | "email">,
  action: AuditAction,
  details: {
    targetId?: string | null;
    targetLabel?: string | null;
    meta?: Record<string, unknown>;
  } = {},
): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.from("admin_audit_log").insert({
      actor_id: actor.id,
      actor_email: actor.email,
      action,
      target_id: details.targetId ?? null,
      target_label: details.targetLabel ?? null,
      meta: details.meta ?? {},
    });

    if (error) console.error("[audit] insert failed", action, error);
  } catch (error) {
    console.error("[audit] insert threw", action, error);
  }
}
