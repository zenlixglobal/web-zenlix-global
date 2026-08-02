"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { formatBucket, formatCompact, formatNumber } from "@/lib/analytics/format";
import type { AnalyticsTimeseriesPoint, TimeBucket } from "@/lib/analytics/types";
import { cn } from "@/lib/utils";

import { TableView } from "./panel";

/**
 * Visitors and page views over the selected range.
 *
 * Two series, one y-axis — both are counts of the same kind of thing, so they
 * are directly comparable. (A second scale would invent a correlation the data
 * doesn't have.) Enquiries live in their own chart below rather than as a third
 * line here: at one-to-two orders of magnitude smaller they would be a flat
 * line along the baseline.
 */

const SERIES = [
  { key: "visitors", label: "Visitors", color: "var(--color-chart-1)", area: true },
  { key: "page_views", label: "Page views", color: "var(--color-chart-2)", area: false },
] as const;

type SeriesKey = (typeof SERIES)[number]["key"];

const PLOT_HEIGHT = 220;
const AXIS_BAND = 22;
const PADDING = { top: 12, right: 14, bottom: AXIS_BAND, left: 44 };
const FALLBACK_WIDTH = 760;

export function TrafficChart({
  points,
  bucket,
  timeZone,
}: {
  points: AnalyticsTimeseriesPoint[];
  bucket: TimeBucket;
  /** Reporting timezone the buckets were cut in. */
  timeZone: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(FALLBACK_WIDTH);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Real pixel width rather than a scaled viewBox: `preserveAspectRatio="none"`
  // would stretch the 2px strokes and the type along with the plot.
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      const next = entry?.contentRect.width ?? 0;
      if (next > 0) setWidth(next);
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const height = PLOT_HEIGHT + PADDING.top + PADDING.bottom;
  const plotWidth = Math.max(width - PADDING.left - PADDING.right, 1);

  const max = useMemo(() => {
    const peak = Math.max(
      ...points.flatMap((point) => [point.visitors, point.page_views]),
      0,
    );
    return niceMax(peak);
  }, [points]);

  const xFor = useCallback(
    (index: number) =>
      PADDING.left +
      (points.length <= 1 ? plotWidth / 2 : (index / (points.length - 1)) * plotWidth),
    [plotWidth, points.length],
  );

  const yFor = useCallback(
    (value: number) => PADDING.top + PLOT_HEIGHT - (value / max) * PLOT_HEIGHT,
    [max],
  );

  const ticks = useMemo(() => [0, 0.25, 0.5, 0.75, 1].map((t) => t * max), [max]);
  const xTickIndices = useMemo(() => pickXTicks(points.length, width), [points.length, width]);

  const paths = useMemo(
    () =>
      SERIES.map((series) => {
        const line = points
          .map((point, index) => {
            const command = index === 0 ? "M" : "L";
            return `${command}${xFor(index).toFixed(2)},${yFor(point[series.key]).toFixed(2)}`;
          })
          .join(" ");

        const baseline = PADDING.top + PLOT_HEIGHT;
        const area =
          points.length > 0
            ? `${line} L${xFor(points.length - 1).toFixed(2)},${baseline} L${xFor(0).toFixed(2)},${baseline} Z`
            : "";

        return { ...series, line, area };
      }),
    [points, xFor, yFor],
  );

  const handlePointer = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      if (points.length === 0) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const ratio = (x - PADDING.left) / plotWidth;
      const index = Math.round(ratio * Math.max(points.length - 1, 1));
      setActiveIndex(Math.min(Math.max(index, 0), points.length - 1));
    },
    [plotWidth, points.length],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<SVGSVGElement>) => {
      if (points.length === 0) return;

      const step =
        event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
      if (step === 0) {
        if (event.key === "Escape") setActiveIndex(null);
        return;
      }

      event.preventDefault();
      setActiveIndex((current) => {
        const next = (current ?? -1) + step;
        return Math.min(Math.max(next, 0), points.length - 1);
      });
    },
    [points.length],
  );

  const active = activeIndex === null ? null : points[activeIndex];

  return (
    <div>
      <Legend />

      {/* `overflow-hidden` covers the single frame between first paint at the
          fallback width and the ResizeObserver reporting the real one. */}
      <div ref={containerRef} className="relative mt-3 overflow-hidden">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          tabIndex={0}
          aria-label={`Visitors and page views by ${bucket}. Use the arrow keys to step through the series, or open the table view below.`}
          className="max-w-full touch-pan-y outline-none focus-visible:ring-2 focus-visible:ring-gold-500/60"
          onPointerMove={handlePointer}
          onPointerLeave={() => setActiveIndex(null)}
          onKeyDown={handleKeyDown}
          onBlur={() => setActiveIndex(null)}
        >
          {/* Gridlines: solid hairlines, one step off the surface. */}
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={PADDING.left}
                x2={width - PADDING.right}
                y1={yFor(tick)}
                y2={yFor(tick)}
                stroke="var(--color-chart-grid)"
                strokeWidth={1}
              />
              <text
                x={PADDING.left - 8}
                y={yFor(tick)}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-slate-muted text-[10px] tabular-nums"
              >
                {formatCompact(tick)}
              </text>
            </g>
          ))}

          {paths.map((series) =>
            series.area ? (
              <path
                key={`${series.key}-area`}
                d={series.area}
                fill={series.color}
                fillOpacity={0.1}
              />
            ) : null,
          )}

          {paths.map((series) => (
            <path
              key={series.key}
              d={series.line}
              fill="none"
              stroke={series.color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {xTickIndices.map((index) => (
            <text
              key={index}
              x={xFor(index)}
              y={height - 6}
              textAnchor={
                index === 0
                  ? "start"
                  : index === points.length - 1
                    ? "end"
                    : "middle"
              }
              className="fill-slate-muted text-[10px]"
            >
              {formatBucket(points[index]!.bucket, bucket, timeZone)}
            </text>
          ))}

          {activeIndex !== null && active ? (
            <g>
              <line
                x1={xFor(activeIndex)}
                x2={xFor(activeIndex)}
                y1={PADDING.top}
                y2={PADDING.top + PLOT_HEIGHT}
                stroke="var(--color-chart-axis)"
                strokeWidth={1}
              />
              {SERIES.map((series) => (
                <circle
                  key={series.key}
                  cx={xFor(activeIndex)}
                  cy={yFor(active[series.key])}
                  r={4}
                  fill={series.color}
                  // 2px ring in the surface colour keeps the dot legible
                  // wherever the two series cross.
                  stroke="#ffffff"
                  strokeWidth={2}
                />
              ))}
            </g>
          ) : null}
        </svg>

        {activeIndex !== null && active ? (
          <Tooltip
            point={active}
            bucket={bucket}
            timeZone={timeZone}
            x={xFor(activeIndex)}
            containerWidth={width}
          />
        ) : null}
      </div>

      <TableView
        caption="Visitors and page views per interval"
        columns={["Interval", "Visitors", "Page views", "Sessions"]}
        rows={points.map((point) => [
          formatBucket(point.bucket, bucket, timeZone, { long: true }),
          formatNumber(point.visitors),
          formatNumber(point.page_views),
          formatNumber(point.sessions),
        ])}
      />
    </div>
  );
}

function Legend() {
  return (
    <ul className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
      {SERIES.map((series) => (
        <li key={series.key} className="flex items-center gap-2 text-xs text-slate-muted">
          <span
            aria-hidden
            className="h-0.5 w-4 rounded-full"
            style={{ backgroundColor: series.color }}
          />
          {series.label}
        </li>
      ))}
    </ul>
  );
}

function Tooltip({
  point,
  bucket,
  timeZone,
  x,
  containerWidth,
}: {
  point: AnalyticsTimeseriesPoint;
  bucket: TimeBucket;
  timeZone: string;
  x: number;
  containerWidth: number;
}) {
  const TOOLTIP_WIDTH = 168;
  // Clamp so the card never hangs off either edge of the panel.
  const left = Math.min(
    Math.max(x - TOOLTIP_WIDTH / 2, 0),
    Math.max(containerWidth - TOOLTIP_WIDTH, 0),
  );

  return (
    <div
      role="status"
      aria-live="polite"
      style={{ left, width: TOOLTIP_WIDTH }}
      className={cn(
        "pointer-events-none absolute top-0 border border-line bg-white px-3 py-2 text-xs shadow-sm",
      )}
    >
      <p className="font-medium text-navy-900">
        {formatBucket(point.bucket, bucket, timeZone, { long: true })}
      </p>
      <dl className="mt-1.5 space-y-1">
        {SERIES.map((series) => (
          <div key={series.key} className="flex items-center justify-between gap-3">
            <dt className="flex items-center gap-1.5 text-slate-muted">
              <span
                aria-hidden
                className="size-1.5 rounded-full"
                style={{ backgroundColor: series.color }}
              />
              {series.label}
            </dt>
            <dd className="tabular-nums text-ink">
              {formatNumber(point[series.key as SeriesKey])}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** Rounds a peak up to a clean axis maximum (1 / 2 / 5 × 10ⁿ). */
function niceMax(value: number): number {
  if (value <= 0) return 4;

  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalised = value / magnitude;
  const step = normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 5 ? 5 : 10;

  return step * magnitude;
}

/** Evenly spaced x labels that always include the first and last bucket. */
function pickXTicks(count: number, width: number): number[] {
  if (count === 0) return [];
  if (count === 1) return [0];

  const maxTicks = Math.max(2, Math.min(8, Math.floor(width / 90)));
  if (count <= maxTicks) return Array.from({ length: count }, (_, i) => i);

  const stride = (count - 1) / (maxTicks - 1);
  return Array.from({ length: maxTicks }, (_, i) => Math.round(i * stride));
}
