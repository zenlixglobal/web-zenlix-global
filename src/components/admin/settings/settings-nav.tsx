"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { can, type Capability } from "@/lib/permissions";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/admin/settings", label: "Profile", capability: null },
  { href: "/admin/settings/users", label: "Users", capability: "users:read" },
] as const;

/** Sub-navigation for the settings section, filtered by what the role unlocks. */
export function SettingsNav({
  capabilities,
}: {
  capabilities: Capability[];
}) {
  const pathname = usePathname();

  const visible = TABS.filter(
    (tab) => tab.capability === null || can({ capabilities }, tab.capability),
  );

  // A single tab is not navigation — an editor sees only their profile, so
  // showing them a one-item tab strip is noise.
  if (visible.length < 2) return null;

  return (
    <nav
      aria-label="Settings sections"
      className="mb-8 flex items-center gap-1 border-b border-line"
    >
      {visible.map((tab) => {
        const active =
          tab.href === "/admin/settings"
            ? pathname === "/admin/settings"
            : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-3 py-2.5 text-sm transition-colors",
              active
                ? "border-navy-900 font-medium text-navy-900"
                : "border-transparent text-slate-muted hover:text-navy-900",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
