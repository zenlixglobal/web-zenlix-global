import type { Metadata } from "next";

import { AdminShell } from "@/components/admin/admin-shell";
import { InviteForm } from "@/components/admin/settings/invite-form";
import { PermissionEditor } from "@/components/admin/settings/permission-editor";
import { RoleBadge } from "@/components/admin/settings/role-badge";
import { SettingsNav } from "@/components/admin/settings/settings-nav";
import {
  RoleSelect,
  UserRowMenu,
} from "@/components/admin/settings/user-row-actions";
import { Badge } from "@/components/ui/badge";
import { displayName, listAdminTeam } from "@/lib/admin-users";
import { requireCapability } from "@/lib/auth";
import {
  ACCESS_AREAS,
  can,
  canManageRole,
  CAPABILITY_LABELS,
  findArea,
  isCapability,
  levelOf,
  resolveCapabilities,
  ROLE_LABELS,
  type AdminRole,
  type CapabilityOverride,
} from "@/lib/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AdminAuditLogRow } from "@/lib/supabase/types";

export const metadata: Metadata = { title: "Users" };

export const dynamic = "force-dynamic";

/**
 * The team.
 *
 * `requireCapability("users:read")` bounces editors and viewers who typed the
 * URL; the roster query underneath is gated by RLS regardless, so a bypass of
 * this check returns an empty list rather than the team.
 */
export default async function AdminUsersPage() {
  const user = await requireCapability("users:read");
  const { members, error } = await listAdminTeam();
  const activity = can(user, "audit:read") ? await recentActivity() : [];

  const active = members.filter((member) => !member.disabled_at).length;

  return (
    <AdminShell user={user}>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-slate-muted">
          {members.length} {members.length === 1 ? "person" : "people"} can sign
          in to this admin
          {members.length === active ? "" : `, ${active} currently active`}.
        </p>
      </div>

      <SettingsNav capabilities={user.capabilities} />

      {can(user, "users:manage") ? (
        <div className="mb-8">
          <InviteForm
            actor={{ role: user.role, capabilities: user.capabilities }}
          />
        </div>
      ) : null}

      {error ? (
        <p className="border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : (
        /* One card per person rather than a table row: the feature grid is the
           main event here, and it needs the full width to be readable. */
        <ul className="grid gap-4">
          {members.map((member) => {
            const isSelf = member.user_id === user.id;
            // Self is excluded on purpose: nobody edits their own role or
            // permissions, which is also enforced by trigger.
            const manageable = !isSelf && canManageRole(user, member.role);

            return (
              <li
                key={member.user_id}
                className="border border-line bg-white p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
                  <div className="min-w-50">
                    <p className="font-medium">
                      {displayName(member)}
                      {isSelf ? (
                        <span className="ml-2 text-xs text-slate-muted">
                          you
                        </span>
                      ) : null}
                      {member.disabled_at ? (
                        <Badge variant="destructive" className="ml-2">
                          Suspended
                        </Badge>
                      ) : null}
                    </p>
                    <p className="text-xs break-all text-slate-muted">
                      {member.email}
                    </p>
                    <p className="mt-1 text-xs text-slate-muted">
                      Added {formatDate(member.created_at)} · last sign-in{" "}
                      {member.lastSignInAt
                        ? formatDate(member.lastSignInAt)
                        : "never"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {manageable ? (
                      <>
                        <span className="text-xs text-slate-muted">
                          Start from
                        </span>
                        <RoleSelect
                          userId={member.user_id}
                          role={member.role}
                          actor={{
                            role: user.role,
                            capabilities: user.capabilities,
                          }}
                          manageable
                        />
                        <UserRowMenu
                          userId={member.user_id}
                          email={member.email}
                          disabled={Boolean(member.disabled_at)}
                        />
                      </>
                    ) : (
                      <RoleBadge role={member.role} />
                    )}
                  </div>
                </div>

                <div className="mt-5 border-t border-line pt-4">
                  {manageable ? (
                    <PermissionEditor
                      userId={member.user_id}
                      role={member.role}
                      overrides={member.overrides}
                      actor={{
                        role: user.role,
                        capabilities: user.capabilities,
                      }}
                    />
                  ) : (
                    <ReadOnlyFeatures
                      role={member.role}
                      overrides={member.overrides}
                    />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-3 text-xs text-slate-muted">
        Set access per area, per person. The role beside each name is only a
        preset — choosing one refills the four dropdowns, and every change after
        that is individual. Removing someone revokes their admin access but
        keeps their Supabase login; suspending is reversible. Both take effect
        on their next request.
      </p>

      {activity.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-lg">Recent activity</h2>
          <p className="mt-1 mb-4 text-sm text-slate-muted">
            Team and account changes, newest first. This log cannot be edited or
            deleted from the admin.
          </p>
          <ul className="border border-line bg-white divide-y divide-line">
            {activity.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3 text-sm"
              >
                <span>
                  <span className="font-medium">
                    {entry.actor_email ?? "Someone"}
                  </span>{" "}
                  <span className="text-slate-muted">{describe(entry)}</span>
                </span>
                <span className="text-xs text-slate-muted">
                  {formatDate(entry.created_at)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </AdminShell>
  );
}

/**
 * What someone has, for rows you cannot edit — yourself, a peer, an owner.
 *
 * Shown rather than hidden: "why can Omar see analytics?" is the question this
 * page exists to answer, and it should be answerable about people you have no
 * authority to change.
 */
function ReadOnlyFeatures({
  role,
  overrides,
}: {
  role: AdminRole;
  overrides: CapabilityOverride[];
}) {
  if (role === "owner") {
    return (
      <p className="text-sm text-slate-muted">Every feature, as an owner.</p>
    );
  }

  const held = resolveCapabilities(role, overrides);

  return (
    <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {ACCESS_AREAS.map((area) => {
        const level = levelOf(area, held);
        return (
          <div key={area.id}>
            <dt className="text-sm font-medium">{area.label}</dt>
            <dd
              className={
                level.id === "none"
                  ? "text-sm text-slate-muted"
                  : "text-sm text-navy-900"
              }
            >
              {level.label}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

async function recentActivity(): Promise<AdminAuditLogRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("admin_audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("[settings] audit read failed", error);
    return [];
  }

  return (data ?? []) as AdminAuditLogRow[];
}

/** Turns a log row into a sentence, falling back to the raw action verb. */
function describe(entry: AdminAuditLogRow): string {
  const target = entry.target_label ?? "an account";
  const role = typeof entry.meta.role === "string" ? entry.meta.role : null;
  const roleLabel =
    role && role in ROLE_LABELS
      ? ROLE_LABELS[role as keyof typeof ROLE_LABELS]
      : role;

  switch (entry.action) {
    case "user.invited":
      return `added ${target} as ${roleLabel ?? "a team member"}`;
    case "user.granted":
      return `gave ${target} ${roleLabel ?? "admin"} access`;
    case "access.changed": {
      const area =
        typeof entry.meta.area === "string" ? findArea(entry.meta.area) : null;
      const label =
        typeof entry.meta.label === "string"
          ? entry.meta.label.toLowerCase()
          : "a new level";
      return `set ${target}'s ${area?.label.toLowerCase() ?? "access"} to ${label}`;
    }
    case "permission.changed": {
      const feature = isCapability(entry.meta.capability)
        ? `"${CAPABILITY_LABELS[entry.meta.capability]}"`
        : "a feature";

      switch (entry.meta.value) {
        case "grant":
          return `granted ${feature} to ${target}`;
        case "revoke":
          return `revoked ${feature} from ${target}`;
        default:
          return `reset ${feature} to the role default for ${target}`;
      }
    }
    case "user.role_changed":
      return `changed ${target} to ${roleLabel ?? "a new role"}`;
    case "user.disabled":
      return `suspended ${target}`;
    case "user.enabled":
      return `restored ${target}`;
    case "user.removed":
      return `removed ${target} from the team`;
    case "profile.updated":
      return "updated their profile";
    case "password.changed":
      return "changed their password";
    default:
      return entry.action;
  }
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
