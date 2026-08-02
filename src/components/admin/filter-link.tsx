import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * The square pill used by every filter row in /admin. A link rather than a
 * button so each filtered view is a real, shareable, back-button-able URL.
 */
export function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "border px-3 py-1.5 text-sm transition-colors",
        active
          ? "border-navy-900 bg-navy-900 text-white"
          : "border-line bg-white text-slate-muted hover:border-navy-900 hover:text-navy-900",
      )}
    >
      {children}
    </Link>
  );
}
