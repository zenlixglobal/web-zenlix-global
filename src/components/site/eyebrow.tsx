import { cn } from "@/lib/utils";

/**
 * Small gold mono label with a leading rule, used above every section heading.
 * Ported from `.eyebrow` / `.eyebrow::before`.
 */
export function Eyebrow({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 font-mono text-[11px] tracking-[0.14em] text-gold-500 uppercase sm:text-[12.5px]",
        className,
      )}
      {...props}
    >
      <span aria-hidden className="h-px w-5.5 shrink-0 bg-gold-500" />
      {children}
    </div>
  );
}
