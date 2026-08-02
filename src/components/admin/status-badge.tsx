import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, type SubmissionStatus } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<SubmissionStatus, string> = {
  new: "border-gold-500/40 bg-gold-500/15 text-[#8a6f11]",
  in_progress: "border-navy-700/30 bg-navy-700/10 text-navy-800",
  contacted: "border-emerald-600/30 bg-emerald-600/10 text-emerald-800",
  archived: "border-line bg-muted text-slate-muted",
};

export function StatusBadge({
  status,
  className,
}: {
  status: SubmissionStatus;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("font-mono text-[11px] uppercase", STATUS_STYLES[status], className)}
    >
      {STATUS_LABELS[status]}
    </Badge>
  );
}
