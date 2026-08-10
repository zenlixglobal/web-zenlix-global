"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { can, type Capability } from "@/lib/permissions";
import { cn } from "@/lib/utils";

/**
 * Every admin section, with the capability that unlocks it.
 *
 * `Settings` has no capability: a viewer still has a profile and a password to
 * change. What they can see *inside* it is decided in `SettingsNav`.
 */
const LINKS = [
  { href: "/admin", label: "Enquiries", capability: "submissions:read" },
  { href: "/admin/analytics", label: "Analytics", capability: "analytics:read" },
  { href: "/admin/insights", label: "Insights", capability: "insights:read" },
  { href: "/admin/settings", label: "Settings", capability: null },
] as const;

/**
 * Top-level admin sections. A client component only because the active tab
 * depends on the current path — everything it links to is server-rendered.
 *
 * Hiding a tab is a courtesy, not a control: the pages behind them call
 * `requireCapability()` and the data behind those is gated by RLS.
 */
export function AdminNav({
  capabilities,
}: {
  capabilities: Capability[];
}) {
  const pathname = usePathname();

  const visible = LINKS.filter(
    (link) => link.capability === null || can({ capabilities }, link.capability),
  );

  return (
    <nav aria-label="Admin sections" className="flex items-center gap-1">
      {visible.map((link) => {
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
