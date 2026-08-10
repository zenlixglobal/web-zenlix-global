import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS, type AdminRole } from "@/lib/permissions";
import { cn } from "@/lib/utils";

/**
 * Roles read as a ladder, so the colours do too: gold for the top of it,
 * navy for management, quiet grey below. Deliberately not the destructive
 * palette — a viewer is not an error state.
 */
const STYLES: Record<AdminRole, string> = {
  owner: "bg-gold-500/18 text-[#7a6410]",
  admin: "bg-navy-900/10 text-navy-900",
  editor: "bg-slate-500/10 text-slate-700",
  viewer: "bg-slate-500/8 text-slate-muted",
};

export function RoleBadge({
  role,
  className,
}: {
  role: AdminRole;
  className?: string;
}) {
  return (
    <Badge variant="secondary" className={cn(STYLES[role], className)}>
      {ROLE_LABELS[role]}
    </Badge>
  );
}
