import { cn } from "@/lib/utils";

/**
 * Small gold mono label above every section heading.
 *
 * The original `.eyebrow::before` drew a short gold rule to the left of the
 * text. It was removed because at these sizes it reads as a stray dash rather
 * than as a rule.
 */
export function Eyebrow({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex items-center font-mono text-[11px] tracking-[0.14em] text-gold-500 uppercase sm:text-[12.5px]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
