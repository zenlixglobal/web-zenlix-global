/**
 * Shapes returned by the reporting functions in
 * supabase/migrations/0002_analytics.sql.
 *
 * Kept free of any server-only import so both the dashboard (server) and the
 * live widget (client) can share them.
 */

export const TIME_BUCKETS = ["hour", "day", "week"] as const;
export type TimeBucket = (typeof TIME_BUCKETS)[number];

export const BREAKDOWN_DIMENSIONS = [
  "page",
  "entry_page",
  "referrer",
  "country",
  "device",
  "browser",
  "os",
  "utm_source",
  "utm_campaign",
] as const;
export type BreakdownDimension = (typeof BREAKDOWN_DIMENSIONS)[number];

/** `analytics_overview()` — each metric paired with the previous window. */
export type AnalyticsOverview = {
  visitors: number;
  prev_visitors: number;
  sessions: number;
  prev_sessions: number;
  page_views: number;
  prev_page_views: number;
  avg_seconds: number;
  prev_avg_seconds: number;
  bounce_rate: number;
  prev_bounce_rate: number;
  conversions: number;
  prev_conversions: number;
  conversion_rate: number;
  prev_conversion_rate: number;
};

export const EMPTY_OVERVIEW: AnalyticsOverview = {
  visitors: 0,
  prev_visitors: 0,
  sessions: 0,
  prev_sessions: 0,
  page_views: 0,
  prev_page_views: 0,
  avg_seconds: 0,
  prev_avg_seconds: 0,
  bounce_rate: 0,
  prev_bounce_rate: 0,
  conversions: 0,
  prev_conversions: 0,
  conversion_rate: 0,
  prev_conversion_rate: 0,
};

/** One gap-filled bucket from `analytics_timeseries()`. */
export type AnalyticsTimeseriesPoint = {
  bucket: string;
  visitors: number;
  sessions: number;
  page_views: number;
  conversions: number;
};

export type AnalyticsBreakdownRow = {
  label: string;
  visitors: number;
  views: number;
};

/** One visitor currently on the site, from `analytics_live()`. */
export type LiveSession = {
  id: string;
  current_path: string;
  country: string;
  device_type: string;
  browser: string;
  referrer_host: string;
  page_view_count: number;
  started_at: string;
  last_seen_at: string;
  converted: boolean;
};

export type AnalyticsLiveSnapshot = {
  visitors: number;
  sessions: number;
  pages: AnalyticsLiveCount[];
  countries: AnalyticsLiveCount[];
  devices: AnalyticsLiveCount[];
  recent: LiveSession[];
};

export type AnalyticsLiveCount = { label: string; visitors: number };

export const EMPTY_LIVE_SNAPSHOT: AnalyticsLiveSnapshot = {
  visitors: 0,
  sessions: 0,
  pages: [],
  countries: [],
  devices: [],
  recent: [],
};

/**
 * How long after its last heartbeat a session stops counting as live. The
 * browser beats every 15s, so this tolerates several dropped beacons — a
 * visitor on a flaky connection shouldn't blink out of the list.
 */
export const LIVE_WINDOW_SECONDS = 300;
