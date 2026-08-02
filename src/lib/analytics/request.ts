import "server-only";

import { createHash } from "node:crypto";

/**
 * Turning a request into the small set of non-identifying facts the analytics
 * tables actually store.
 */

/**
 * Salt for the visitor hash. A dedicated `ANALYTICS_SALT` is preferred; without
 * one we derive a stable secret from the service-role key so a fresh checkout
 * still works and the hash is still unguessable. Either way the value never
 * leaves the server.
 */
function visitorSalt(): string {
  const explicit = process.env.ANALYTICS_SALT;
  if (explicit) return explicit;

  const derived = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (derived) return `derived:${derived}`;

  // Only reachable before Supabase is configured, where nothing is written.
  return "zenlix-analytics-development-salt";
}

/**
 * Pseudonymous visitor id: SHA-256 over (salt, UTC date, ip, user-agent).
 *
 * Rotating on the UTC date is what keeps this GDPR-friendly — yesterday's hash
 * cannot be linked to today's, so there is no persistent identifier and no
 * cookie banner to show. The trade-off is that "visitors" over a multi-day
 * range means the sum of daily uniques, which is also how Plausible and Fathom
 * define it.
 */
export function visitorHashFrom(
  ip: string,
  userAgent: string | null,
  now = new Date(),
): string {
  const day = now.toISOString().slice(0, 10);

  return createHash("sha256")
    .update(`${visitorSalt()}|${day}|${ip}|${userAgent ?? ""}`)
    .digest("hex")
    .slice(0, 32);
}

/**
 * Two-letter country from whichever edge added it. Vercel and Cloudflare both
 * geolocate before the request reaches us; self-hosted deployments simply get
 * `null` and the dashboard shows "Unknown".
 */
export function countryFrom(headers: Headers): string | null {
  const raw =
    headers.get("x-vercel-ip-country") ??
    headers.get("cf-ipcountry") ??
    headers.get("x-country-code");

  if (!raw) return null;

  const code = raw.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : null;
}

/**
 * Honours an explicit opt-out sent by the browser. The tracking script checks
 * these too; re-checking here means a stale cached script can't override the
 * visitor's choice.
 */
export function hasOptedOutOfTracking(headers: Headers): boolean {
  return headers.get("dnt") === "1" || headers.get("sec-gpc") === "1";
}

const stripWww = (host: string) => host.replace(/^www\./i, "").toLowerCase();

/**
 * Every hostname that counts as "this site": the host the request arrived on
 * plus the configured canonical URL. Both are needed — an apex/www pair, or a
 * Vercel preview domain, would otherwise show up as its own referrer.
 */
export function selfHosts(request: { nextUrl: URL; headers: Headers }): string[] {
  const hosts = new Set<string>();

  hosts.add(stripWww(request.nextUrl.hostname));

  const forwardedHost = request.headers.get("host");
  if (forwardedHost) hosts.add(stripWww(forwardedHost.split(":")[0]!));

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl) {
    try {
      hosts.add(stripWww(new URL(siteUrl).hostname));
    } catch {
      /* Misconfigured NEXT_PUBLIC_SITE_URL — ignore it rather than 500. */
    }
  }

  return [...hosts].filter(Boolean);
}

/**
 * Hostname of an external referrer. Same-site navigations are dropped: they
 * are internal clicks, not acquisition, and counting them would make the site
 * its own top traffic source.
 */
export function externalReferrerHost(
  referrer: string | null | undefined,
  ownHosts: string[],
): string | null {
  if (!referrer) return null;

  try {
    const host = stripWww(new URL(referrer).hostname);
    if (!host || ownHosts.includes(host)) return null;
    return host.slice(0, 255);
  } catch {
    return null;
  }
}

/**
 * Rejects beacons posted from another site.
 *
 * The endpoint is public by necessity, but there is no legitimate reason for a
 * cross-origin POST to reach it — only for someone to inflate this site's
 * numbers from theirs. A missing `Origin` (curl, some privacy extensions) is
 * allowed through and left to the rate limiter.
 */
export function isSameSiteRequest(origin: string | null, ownHosts: string[]): boolean {
  if (!origin || origin === "null") return true;

  try {
    return ownHosts.includes(stripWww(new URL(origin).hostname));
  } catch {
    return false;
  }
}
