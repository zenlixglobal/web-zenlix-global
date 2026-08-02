/**
 * Number and date formatting for the analytics dashboard.
 *
 * All of it is `en-GB` and explicitly non-locale-reactive: the same numbers
 * have to read identically on the server render and after hydration, and a
 * dashboard read from two countries should not show two different date orders.
 */

const COMPACT = new Intl.NumberFormat("en-GB", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const PLAIN = new Intl.NumberFormat("en-GB");

/** Full precision — for tables and tooltips, where the exact value matters. */
export function formatNumber(value: number): string {
  return PLAIN.format(Math.round(value));
}

/** 1,284 / 12.9K / 4.2M — for stat tiles and axis ticks. */
export function formatCompact(value: number): string {
  return Math.abs(value) < 10_000 ? PLAIN.format(Math.round(value)) : COMPACT.format(value);
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 10) / 10}%`;
}

/** Seconds as a human duration: 0s / 48s / 3m 12s / 1h 04m. */
export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));

  if (total < 60) return `${total}s`;

  const minutes = Math.floor(total / 60);
  if (minutes < 60) return `${minutes}m ${String(total % 60).padStart(2, "0")}s`;

  const hours = Math.floor(minutes / 60);
  return `${hours}h ${String(minutes % 60).padStart(2, "0")}m`;
}

/** "2 minutes ago" — used by the live list, which is always within the hour. */
export function formatRelativeTime(iso: string, now = Date.now()): string {
  const seconds = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));

  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  return `${Math.floor(minutes / 60)}h ago`;
}

export type Delta = {
  /** Percentage change against the previous period, or null when it was zero. */
  percent: number | null;
  direction: "up" | "down" | "flat";
  label: string;
};

/**
 * Change against the equivalent preceding window.
 *
 * A previous value of zero has no meaningful percentage (every increase is
 * "infinity%"), so those render as "New" instead of a fabricated number.
 */
export function computeDelta(current: number, previous: number): Delta {
  if (previous === 0) {
    return current === 0
      ? { percent: null, direction: "flat", label: "No change" }
      : { percent: null, direction: "up", label: "New" };
  }

  const percent = ((current - previous) / previous) * 100;
  const rounded = Math.round(percent * 10) / 10;

  if (Math.abs(rounded) < 0.05) {
    return { percent: 0, direction: "flat", label: "0%" };
  }

  return {
    percent: rounded,
    direction: rounded > 0 ? "up" : "down",
    label: `${rounded > 0 ? "+" : ""}${rounded}%`,
  };
}

/**
 * Bucket label for a chart axis or tooltip.
 *
 * `timeZone` is required, not optional. The buckets were cut in the reporting
 * timezone by `analytics_timeseries()`, so labelling them in anything else
 * would slide every label off its column — and because the traffic chart is a
 * client component, defaulting to the ambient zone would also mean the server
 * (UTC) and the browser rendered different text and blew up hydration.
 */
export function formatBucket(
  iso: string,
  bucket: "hour" | "day" | "week",
  timeZone: string,
  { long = false }: { long?: boolean } = {},
): string {
  const date = new Date(iso);

  if (bucket === "hour") {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      ...(long ? { weekday: "short" as const } : {}),
    }).format(date);
  }

  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    day: "numeric",
    month: "short",
    ...(long && bucket === "week" ? { year: "numeric" as const } : {}),
  }).format(date);
}

/** Country code to a readable name, falling back to the code itself. */
const REGION_NAMES = new Intl.DisplayNames(["en-GB"], { type: "region" });

export function formatCountry(code: string): string {
  if (!/^[A-Z]{2}$/.test(code)) return code;
  try {
    return REGION_NAMES.of(code) ?? code;
  } catch {
    return code;
  }
}
