import { formatNumber } from "@/lib/analytics/format";
import type { AnalyticsBreakdownRow } from "@/lib/analytics/types";

import { EmptyState } from "./panel";

/**
 * Ranked horizontal bars — the workhorse of the dashboard (top pages,
 * referrers, countries, …).
 *
 * These are *nominal* categories, so every bar wears the same slot-1 hue. A
 * value-ramp here would double-encode the length as colour and waste the
 * identity channel on information the bar already shows.
 */
export function BarList({
  rows,
  emptyLabel,
  valueLabel = "visitors",
  formatLabel,
}: {
  rows: AnalyticsBreakdownRow[];
  emptyLabel: string;
  valueLabel?: string;
  /** e.g. turns "GB" into "United Kingdom" for the country list. */
  formatLabel?: (label: string) => string;
}) {
  if (rows.length === 0) return <EmptyState>{emptyLabel}</EmptyState>;

  const max = Math.max(...rows.map((row) => row.visitors), 1);

  return (
    <ul className="space-y-3">
      {rows.map((row) => {
        const display = formatLabel ? formatLabel(row.label) : row.label;
        const share = (row.visitors / max) * 100;

        return (
          <li key={row.label}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate text-ink" title={display}>
                {display}
              </span>
              {/* Direct label on every row: the bar is the shape, this is the
                  value, so nothing is gated behind a hover. */}
              <span className="shrink-0 tabular-nums text-slate-muted">
                {formatNumber(row.visitors)}
              </span>
            </div>
            <div
              className="mt-1.5 h-1.5 w-full bg-chart-track"
              role="img"
              aria-label={`${display}: ${formatNumber(row.visitors)} ${valueLabel}`}
            >
              <div
                className="h-full rounded-r-[3px] bg-chart-1"
                style={{ width: `${Math.max(share, 1.5)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
