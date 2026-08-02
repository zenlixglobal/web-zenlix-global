import type { TimeBucket } from "@/lib/analytics/types";

/**
 * The date-range presets behind the filter row on /admin/analytics.
 *
 * The bucket size is bound to the range rather than chosen separately, so a
 * chart never ends up with 2,160 hourly columns.
 */
export const RANGE_KEYS = ["24h", "7d", "30d", "90d", "12m"] as const;
export type RangeKey = (typeof RANGE_KEYS)[number];

type RangePreset = {
  label: string;
  /** Shown under the page title, e.g. "the last 7 days". */
  phrase: string;
  hours: number;
  bucket: TimeBucket;
};

export const RANGE_PRESETS: Record<RangeKey, RangePreset> = {
  "24h": {
    label: "24 hours",
    phrase: "the last 24 hours",
    hours: 24,
    bucket: "hour",
  },
  "7d": { label: "7 days", phrase: "the last 7 days", hours: 24 * 7, bucket: "day" },
  "30d": {
    label: "30 days",
    phrase: "the last 30 days",
    hours: 24 * 30,
    bucket: "day",
  },
  "90d": {
    label: "90 days",
    phrase: "the last 90 days",
    hours: 24 * 90,
    bucket: "day",
  },
  "12m": {
    label: "12 months",
    phrase: "the last 12 months",
    hours: 24 * 365,
    bucket: "week",
  },
};

export const DEFAULT_RANGE: RangeKey = "7d";

export function isRangeKey(value: string | undefined): value is RangeKey {
  return value !== undefined && (RANGE_KEYS as readonly string[]).includes(value);
}

export type ResolvedRange = {
  key: RangeKey;
  label: string;
  phrase: string;
  bucket: TimeBucket;
  /** Inclusive lower bound, as an ISO string for PostgREST. */
  from: string;
  /** Exclusive upper bound. */
  to: string;
};

/**
 * Turns a preset into concrete bounds.
 *
 * `to` is rounded up to the next whole bucket so the final column is a
 * complete one and the series doesn't appear to fall off a cliff at "now".
 */
export function resolveRange(key: RangeKey, now = new Date()): ResolvedRange {
  const preset = RANGE_PRESETS[key];
  const to = new Date(now);

  // Round the end up to the next hour; day/week buckets are aligned in SQL,
  // where the reporting timezone is known.
  to.setUTCMinutes(0, 0, 0);
  to.setUTCHours(to.getUTCHours() + 1);

  const from = new Date(to.getTime() - preset.hours * 60 * 60 * 1000);

  return {
    key,
    label: preset.label,
    phrase: preset.phrase,
    bucket: preset.bucket,
    from: from.toISOString(),
    to: to.toISOString(),
  };
}

/**
 * Reporting timezone for day/week bucketing. The dashboard is read from the
 * UK, so "today" should mean a UK day rather than a UTC one.
 */
export function reportingTimeZone(): string {
  return process.env.ANALYTICS_TIMEZONE || "Europe/London";
}
