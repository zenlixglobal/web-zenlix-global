import { Eyebrow } from "@/components/site/eyebrow";
import { cn } from "@/lib/utils";

/** Ported from `.sec-head`: eyebrow + h2 + optional intro paragraph. */
export function SectionHeading({
  eyebrow,
  heading,
  intro,
  className,
  onNavy = false,
}: {
  eyebrow: string;
  heading: React.ReactNode;
  intro?: string;
  className?: string;
  onNavy?: boolean;
}) {
  return (
    <div className={cn("max-w-160", className)}>
      <Eyebrow className="mb-3.5">{eyebrow}</Eyebrow>
      <h2
        className={cn(
          "text-[clamp(1.75rem,5vw,2.5rem)] leading-[1.15]",
          onNavy && "text-white",
        )}
      >
        {heading}
      </h2>
      {intro ? (
        <p
          className={cn(
            "mt-4 text-base sm:text-[16.5px]",
            onNavy ? "text-navy-fg-muted" : "text-slate-muted",
          )}
        >
          {intro}
        </p>
      ) : null}
    </div>
  );
}
