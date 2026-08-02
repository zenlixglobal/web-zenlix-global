import { z } from "zod";

/**
 * The beacon contract between `AnalyticsTracker` and /api/analytics/collect.
 *
 * Everything here is attacker-controlled — the endpoint is public — so each
 * field is bounded, and anything the server can derive itself (country,
 * device, visitor identity) is deliberately *not* accepted from the client.
 */

export const BEACON_TYPES = ["pageview", "heartbeat", "event", "leave"] as const;
export type BeaconType = (typeof BEACON_TYPES)[number];

/** Event names the site is allowed to report. An allow-list keeps the events
 *  table from becoming a dumping ground and makes the dashboard's funnel
 *  meaningful. */
export const TRACKED_EVENTS = [
  "contact_submitted",
  "contact_failed",
  "newsletter_subscribed",
] as const;
export type TrackedEvent = (typeof TRACKED_EVENTS)[number];

export const beaconSchema = z.object({
  type: z.enum(BEACON_TYPES),
  /** Session id minted by the browser; scoped to a 30-minute idle window. */
  sid: z.uuid(),
  path: z.string().min(1).max(512),
  title: z.string().max(300).optional(),
  /** `document.referrer` — resolved to a host and filtered server-side. */
  referrer: z.string().max(2048).optional(),
  /** `location.search` of the entry page, parsed for UTM tags server-side. */
  query: z.string().max(2048).optional(),
  screenWidth: z.number().int().min(0).max(20000).optional(),
  /** Engaged milliseconds on the page being left. */
  durationMs: z.number().int().min(0).max(3_600_000).optional(),
  event: z.enum(TRACKED_EVENTS).optional(),
  props: z.record(z.string().max(48), z.union([z.string().max(200), z.number(), z.boolean()]))
    .optional(),
});

export type Beacon = z.infer<typeof beaconSchema>;

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;

export type UtmTags = Partial<Record<(typeof UTM_KEYS)[number], string>>;

/** Pulls campaign tags out of a raw query string, bounded to 128 chars each. */
export function parseUtmTags(query: string | undefined): UtmTags {
  if (!query) return {};

  const params = new URLSearchParams(query.startsWith("?") ? query.slice(1) : query);
  const tags: UtmTags = {};

  for (const key of UTM_KEYS) {
    const value = params.get(key)?.trim();
    if (value) tags[key] = value.slice(0, 128);
  }

  return tags;
}

/**
 * Strips query strings and fragments, collapses trailing slashes, and caps the
 * length — so `/about?utm_source=x` and `/about/` are one row in "Top pages".
 */
export function normalisePath(path: string): string {
  const withoutQuery = path.split("?")[0]!.split("#")[0]!;
  if (!withoutQuery.startsWith("/")) return "/";
  const trimmed = withoutQuery.replace(/\/+$/, "");
  return (trimmed || "/").slice(0, 512);
}
