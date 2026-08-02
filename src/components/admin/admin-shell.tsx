import Link from "next/link";
import { LogOutIcon } from "lucide-react";

import { signOut } from "@/app/admin/actions";
import { LogoMark } from "@/components/site/logo";
import { Button } from "@/components/ui/button";
import type { AdminUser } from "@/lib/auth";

export function AdminShell({
  user,
  children,
}: {
  user: AdminUser;
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="border-b border-white/14 bg-navy-900">
        <div className="mx-auto flex w-full max-w-300 flex-wrap items-center justify-between gap-3 px-5 py-3.5 sm:px-8">
          <Link
            href="/admin"
            className="flex items-center gap-2.5 font-heading text-lg text-white"
          >
            <LogoMark size={28} className="size-7" />
            <span>Zenlix Admin</span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-navy-fg-subtle sm:inline">
              {user.email}
            </span>
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
