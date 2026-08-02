import { ArrowDownRightIcon, ArrowRightIcon, ArrowUpRightIcon } from "lucide-react";

import { computeDelta } from "@/lib/analytics/format";
import { cn } from "@/lib/utils";

/**
 * label · value · delta · sparkline.
 *
 * `goodDirection` exists because "up" is not universally good: more visitors is
 * a win, a higher bounce rate is not, so the arrow's colour has to be told
 * which way the metric should be moving.
 */
export function StatTile({
  label,
  value,
  previous,
  current,
  goodDirection = "up",
  hint,
  trend,
  emphasis = false,
}: {
  label: string;
  /** Pre-formatted display value (percent, duration, compact number, …). */
  value: string;
  current: number;
  previous: number;
  goodDirection?: "up" | "down";
  hint?: string;
  /** Optional 12-ish point sparkline over the same range. */
  trend?: number[];
  emphasis?: boolean;
}) {
  const delta = computeDelta(current, previous);
  const isGood =
    delta.direction === "flat" ? null : delta.direction === goodDirection;

  const Icon =
    delta.direction === "up"
      ? ArrowUpRightIcon
      : delta.direction === "down"
        ? ArrowDownRightIcon
        : ArrowRightIcon;

  return (
    <div
      className={cn(
        "flex flex-col justify-between border border-line bg-white px-4 py-3.5",
        emphasis && "border-navy-900/25 bg-navy-900/3",
      )}
    >
      <p className="font-mono text-[11px] tracking-[0.06em] text-slate-muted uppercase">
        {label}
      </p>

      {/* Proportional figures: `tabular-nums` makes a value like 121 look
          loose at this size. */}
      <p className="mt-2 font-heading text-2xl leading-none font-semibold text-navy-900">
        {value}
      </p>

      <div className="mt-2.5 flex items-end justify-between gap-3">
        <span
          className={cn(
            "inline-flex items-center gap-1 text-xs",
            isGood === null && "text-slate-muted",
            isGood === true && "text-positive",
            isGood === false && "text-negative",
          )}
        >
          <Icon className="size-3.5" aria-hidden />
          {delta.label}
          <span className="text-slate-muted">{hint ?? "vs previous"}</span>
        </span>

        {trend && trend.length > 1 ? <Sparkline values={trend} /> : null}
      </div>
    </div>
  );
}

/**
 * Decorative by design: it shows shape, not values, and every number it plots
 * is also in the main chart's table view. Hence `aria-hidden`.
 */
function Sparkline({ values }: { values: number[] }) {
  const width = 64;
  const height = 20;
  const max = Math.max(...values, 1);
  const step = values.length > 1 ? width / (values.length - 1) : width;

  const points = values
    .map((value, index) => {
      const x = index * step;
      // Inset by 1px top and bottom so a 2px stroke is never clipped.
      const y = height - 1 - (value / max) * (height - 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden
      className="shrink-0 overflow-visible"
    >
      <polyline
        points={points}
        fill="none"
        stroke="var(--color-chart-1)"
        strokeOpacity={0.55}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
