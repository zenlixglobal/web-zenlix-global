import { after } from "next/server";
import type { NextRequest } from "next/server";

import {
  countryFrom,
  externalReferrerHost,
  hasOptedOutOfTracking,
  isSameSiteRequest,
  selfHosts,
  visitorHashFrom,
} from "@/lib/analytics/request";
import { beaconSchema, normalisePath, parseUtmTags } from "@/lib/analytics/schema";
import { isBotUserAgent, parseUserAgent } from "@/lib/analytics/user-agent";
import { isSupabaseConfigured } from "@/lib/env";
import { clientIpFrom, rateLimit } from "@/lib/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/** node: the visitor hash uses `node:crypto`. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public ingest for the tracking beacon.
 *
 * Always answers 204 with an empty body — `sendBeacon` discards the response
 * anyway, and staying silent about *why* a beacon was dropped (bot, opt-out,
 * bad payload) gives a scraper nothing to calibrate against. The only
 * exception is 429, which is worth telling an honest client about.
 *
 * The write goes through the service-role client because the analytics tables
 * have no INSERT policy; `analytics_track()` is the only entry point, and it
 * caps every field it stores.
 */

/**
 * A visible tab beats 4×/min per open page. This allows roughly ten such tabs
 * from one IP before shedding — comfortably above a real office NAT, well
 * below what it takes to skew the numbers.
 */
const RATE_LIMIT = { limit: 400, windowMs: 10 * 60 * 1000 };

const NO_CONTENT = () => new Response(null, { status: 204 });

export async function POST(request: NextRequest) {
  const headers = request.headers;
  const ownHosts = selfHosts(request);

  if (!isSameSiteRequest(headers.get("origin"), ownHosts)) return NO_CONTENT();
  if (hasOptedOutOfTracking(headers)) return NO_CONTENT();

  const userAgent = headers.get("user-agent");
  if (isBotUserAgent(userAgent)) return NO_CONTENT();

  const ip = clientIpFrom(headers);
  const limit = rateLimit(`analytics:${ip}`, RATE_LIMIT);

  if (!limit.allowed) {
    return new Response(null, {
      status: 429,
      headers: { "Retry-After": String(limit.retryAfterSeconds) },
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NO_CONTENT();
  }

  const parsed = beaconSchema.safeParse(body);
  if (!parsed.success) return NO_CONTENT();

  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NO_CONTENT();
  }

  const beacon = parsed.data;
  const { device, browser, os } = parseUserAgent(
    userAgent,
    headers.get("sec-ch-ua-mobile") === "?1",
  );

  const payload = {
    type: beacon.type,
    session_id: beacon.sid,
    visitor_hash: visitorHashFrom(ip, userAgent),
    path: normalisePath(beacon.path),
    title: beacon.title,
    referrer_host: externalReferrerHost(beacon.referrer, ownHosts),
    referrer_url: beacon.referrer?.slice(0, 1024),
    ...parseUtmTags(beacon.query),
    country: countryFrom(headers),
    device_type: device,
    browser,
    os,
    screen_width: beacon.screenWidth,
    duration_ms: beacon.durationMs,
    event_name: beacon.event,
    props: beacon.props,
  };

  // Respond immediately; the insert finishes after the response is flushed so
  // a slow database never shows up as latency in the visitor's browser.
  after(async () => {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.rpc("analytics_track", { p_payload: payload });

    if (error) console.error("[analytics] track failed", error);
  });

  return NO_CONTENT();
}
