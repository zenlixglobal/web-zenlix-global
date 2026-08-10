import Link from "next/link";
import { LogOutIcon } from "lucide-react";

import { signOut } from "@/app/admin/actions";
import { AdminNav } from "@/components/admin/admin-nav";
import { LivePill } from "@/components/admin/live-pill";
import { LogoMark } from "@/components/site/logo";
import { Button } from "@/components/ui/button";
import { displayName } from "@/lib/admin-users";
import type { AdminUser } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/permissions";

export function AdminShell({
  user,
  /**
   * Seeds the header's live count so it renders a real number on first paint.
   * Pages that have already loaded a live snapshot should pass it; the rest
   * start at zero and correct themselves on the first poll.
   */
  liveVisitors = 0,
  children,
}: {
  user: AdminUser;
  liveVisitors?: number;
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="border-b border-white/14 bg-navy-900">
        <div className="mx-auto flex w-full max-w-300 flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-3.5 sm:px-8">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link
              href="/admin"
              className="flex items-center gap-2.5 font-heading text-lg text-white"
            >
              <LogoMark size={28} className="size-7" />
              <span>Zenlix Admin</span>
            </Link>
            <AdminNav capabilities={user.capabilities} />
          </div>

          <div className="flex items-center gap-3">
            <LivePill initialVisitors={liveVisitors} />
            {/* Name over email: on a shared screen the role is the useful
                signal, and the address is one click away in Settings. */}
            <Link
              href="/admin/settings"
              className="hidden text-right text-sm leading-tight text-navy-fg-subtle transition-colors hover:text-white lg:block"
            >
              {displayName({ full_name: user.fullName, email: user.email })}
              <span className="block text-xs text-gold-300">
                {ROLE_LABELS[user.role]}
              </span>
            </Link>
            <form action={signOut}>
              <Button
                type="submit"
                variant="outline-light"
                size="sm"
                className="h-9 gap-1.5 px-3"
              >
                <LogOutIcon className="size-4" />
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-300 flex-1 px-5 py-8 sm:px-8 sm:py-10">
        {children}
      </main>
    </>
  );
}
