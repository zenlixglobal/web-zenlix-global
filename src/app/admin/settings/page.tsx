import type { Metadata } from "next";

import { AdminShell } from "@/components/admin/admin-shell";
import { PasswordForm } from "@/components/admin/settings/password-form";
import { ProfileForm } from "@/components/admin/settings/profile-form";
import { RoleBadge } from "@/components/admin/settings/role-badge";
import { SettingsNav } from "@/components/admin/settings/settings-nav";
import { requireAdmin } from "@/lib/auth";
import {
  ACCESS_AREAS,
  levelOf,
  ROLE_DESCRIPTIONS,
} from "@/lib/permissions";

export const metadata: Metadata = { title: "Profile" };

export const dynamic = "force-dynamic";

/**
 * Every admin's own account page.
 *
 * `requireAdmin()` rather than `requireCapability()`: a viewer has no team
 * access but still needs somewhere to change their password.
 */
export default async function SettingsProfilePage() {
  const user = await requireAdmin();

  return (
    <AdminShell user={user}>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-slate-muted">
          Your account and, if your role allows it, the people who can reach
          this admin.
        </p>
      </div>

      <SettingsNav capabilities={user.capabilities} />

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <section className="border border-line bg-white p-5 sm:p-6">
          <h2 className="text-lg">Your profile</h2>
          <dl className="mt-4 mb-6 grid gap-3 border-b border-line pb-6 text-sm">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-slate-muted">Email</dt>
              <dd className="font-medium break-all">{user.email}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-slate-muted">Role</dt>
              <dd>
                <RoleBadge role={user.role} />
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-slate-muted">Member since</dt>
              <dd className="font-medium">
                {new Intl.DateTimeFormat("en-GB", {
                  dateStyle: "medium",
                }).format(new Date(user.createdAt))}
              </dd>
            </div>
          </dl>

          {/* Your own access, spelled out. Once features are grantable one at
              a time, "you are an Editor" stops being a complete answer. */}
          <div className="mb-6">
            <p className="mb-3 text-sm text-slate-muted">
              {ROLE_DESCRIPTIONS[user.role]} Your email, role, and features are
              changed by an owner, not here.
            </p>
            <dl className="grid gap-2 sm:grid-cols-2">
              {ACCESS_AREAS.map((area) => {
                const level = levelOf(area, user.capabilities);
                return (
                  <div
                    key={area.id}
                    className="flex items-baseline justify-between gap-3 border-b border-line/60 pb-1"
                  >
                    <dt className="text-sm">{area.label}</dt>
                    <dd
                      className={
                        level.id === "none"
                          ? "text-sm text-slate-muted"
                          : "text-sm font-medium"
                      }
                    >
                      {level.label}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>

          <ProfileForm fullName={user.fullName} />
        </section>

        <section className="border border-line bg-white p-5 sm:p-6">
          <h2 className="text-lg">Change password</h2>
          <p className="mt-1 mb-5 text-sm text-slate-muted">
            You&rsquo;ll need your current password to set a new one.
          </p>
          <PasswordForm />
        </section>
      </div>
    </AdminShell>
  );
}
