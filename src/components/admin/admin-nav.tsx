"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Enquiries" },
  { href: "/admin/analytics", label: "Analytics" },
] as const;

/**
 * Top-level admin sections. A client component only because the active tab
 * depends on the current path — everything it links to is server-rendered.
 */
export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin sections" className="flex items-center gap-1">
      {LINKS.map((link) => {
        // "/admin" would otherwise match every child route.
        const active =
          link.href === "/admin"
            ? pathname === "/admin" || pathname.startsWith("/admin/submissions")
            : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "border-b-2 px-2.5 py-1.5 text-sm transition-colors",
              active
                ? "border-gold-500 text-white"
                : "border-transparent text-navy-fg-subtle hover:text-white",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
