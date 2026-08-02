import { formatBucket, formatNumber } from "@/lib/analytics/format";
import type { AnalyticsTimeseriesPoint, TimeBucket } from "@/lib/analytics/types";
import { cn } from "@/lib/utils";

import { EmptyState, TableView } from "./panel";

/**
 * Enquiries per interval, on the same buckets as the traffic chart above —
 * small multiples rather than a third line, because enquiries are counted in
 * ones while page views are counted in hundreds.
 *
 * Built from flex children rather than SVG: a column chart needs no path
 * geometry, and plain elements resize with the panel without a ResizeObserver
 * or any client JavaScript at all.
 */
export function EnquiryChart({
  points,
  counts,
  bucket,
  timeZone,
}: {
  points: AnalyticsTimeseriesPoint[];
  counts: number[];
  bucket: TimeBucket;
  /** Reporting timezone the buckets were cut in. */
  timeZone: string;
}) {
  const total = counts.reduce((sum, count) => sum + count, 0);

  if (points.length === 0) {
    return <EmptyState>No data for this range yet.</EmptyState>;
  }

  const max = Math.max(...counts, 1);
  const lastIndex = points.length - 1;

  return (
    <div>
      <div className="flex h-28 items-end gap-px" role="img"
        aria-label={`Enquiries by ${bucket}: ${formatNumber(total)} in total. Exact values are in the table view below.`}
      >
        {points.map((point, index) => {
          const count = counts[index] ?? 0;
          const label = `${formatBucket(point.bucket, bucket, timeZone, { long: true })}: ${formatNumber(count)} ${count === 1 ? "enquiry" : "enquiries"}`;

          return (
            <div
              key={point.bucket}
              // The hit area is the whole column, so the native tooltip is
              // reachable even where the bar itself is one pixel tall.
              className="group flex h-full min-w-0 flex-1 items-end justify-center"
              title={label}
            >
              <div
                className={cn(
                  "w-full max-w-6 rounded-t-[4px] bg-chart-3 transition-opacity group-hover:opacity-80",
                  count === 0 && "bg-chart-track",
                )}
                style={{
                  // A zero column keeps a 2px stub so the axis stays readable
                  // as a row of intervals rather than a gap.
                  height: count === 0 ? "2px" : `${Math.max((count / max) * 100, 4)}%`,
                }}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex justify-between text-[10px] text-slate-muted">
        <span>{formatBucket(points[0]!.bucket, bucket, timeZone)}</span>
        {lastIndex > 0 ? (
          <span>{formatBucket(points[lastIndex]!.bucket, bucket, timeZone)}</span>
        ) : null}
      </div>

      <TableView
        caption="Enquiries per interval"
        columns={["Interval", "Enquiries"]}
        rows={points
          .map((point, index) => [
            formatBucket(point.bucket, bucket, timeZone, { long: true }),
            formatNumber(counts[index] ?? 0),
          ])
          .filter((_, index) => (counts[index] ?? 0) > 0)}
      />
    </div>
  );
}
