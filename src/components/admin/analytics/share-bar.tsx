import { formatNumber, formatPercent } from "@/lib/analytics/format";
import type { AnalyticsBreakdownRow } from "@/lib/analytics/types";

import { EmptyState } from "./panel";

/** Slots are assigned in fixed order and never cycled — see globals.css. */
const SERIES = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
] as const;

/**
 * One stacked bar for a genuine part-to-whole split (device mix).
 *
 * Segments are separated by a 2px gap in the surface colour rather than a
 * stroke, and the legend below carries identity so colour is never the only
 * channel. Capped at four segments: past that the tail folds into "Other"
 * rather than inventing a fifth hue.
 */
export function ShareBar({
  rows,
  emptyLabel,
}: {
  rows: AnalyticsBreakdownRow[];
  emptyLabel: string;
}) {
  const total = rows.reduce((sum, row) => sum + row.visitors, 0);

  if (total === 0) return <EmptyState>{emptyLabel}</EmptyState>;

  const head = rows.slice(0, SERIES.length - 1);
  const tail = rows.slice(SERIES.length - 1);
  const tailTotal = tail.reduce((sum, row) => sum + row.visitors, 0);

  const segments = [
    ...head,
    ...(tailTotal > 0
      ? [{ label: "Other", visitors: tailTotal, views: 0 }]
      : []),
  ].map((row, index) => ({
    ...row,
    color: SERIES[index]!,
    share: (row.visitors / total) * 100,
  }));

  return (
    <div>
      <div className="flex h-2.5 w-full gap-0.5 overflow-hidden">
        {segments.map((segment) => (
          <div
            key={segment.label}
            className="h-full first:rounded-l-[2px] last:rounded-r-[2px]"
            style={{
              width: `${segment.share}%`,
              backgroundColor: segment.color,
            }}
            role="img"
            aria-label={`${segment.label}: ${formatPercent(segment.share)}`}
          />
        ))}
      </div>

      <ul className="mt-4 space-y-2">
        {segments.map((segment) => (
          <li
            key={segment.label}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                aria-hidden
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              <span className="truncate text-ink capitalize">{segment.label}</span>
            </span>
            <span className="shrink-0 tabular-nums text-slate-muted">
              {formatPercent(segment.share)}
              <span className="ml-2 text-xs">
                ({formatNumber(segment.visitors)})
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
