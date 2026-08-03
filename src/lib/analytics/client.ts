/**
 * Browser half of the analytics pipeline.
 *
 * No cookies and no persistent id: a session id lives in `localStorage` behind
 * a 30-minute idle window, and the server derives a daily-rotating visitor hash
 * from the request itself. That is what lets the site run this without a
 * consent banner.
 */

import type { Beacon, BeaconType, TrackedEvent } from "@/lib/analytics/schema";

const COLLECT_URL = "/api/analytics/collect";
const SESSION_KEY = "zx.analytics.session";
const OPT_OUT_KEY = "zx.analytics.optout";

/** Matches the sessionisation window every other analytics tool uses. */
const SESSION_IDLE_MS = 30 * 60 * 1000;

/** How often a visible tab reports that it is still there. */
export const HEARTBEAT_MS = 15_000;

/** Stop beating after this long so a tab left open overnight isn't "live". */
const MAX_SESSION_MS = 4 * 60 * 60 * 1000;

type StoredSession = { id: string; startedAt: number; expiresAt: number };

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    // Safari in Lockdown Mode / private iframes throw on access.
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* Storage unavailable — tracking degrades to nothing, which is fine. */
  }
}

/**
 * True when we must not track: an explicit opt-out, or a browser-level
 * Do Not Track / Global Privacy Control signal. The collect endpoint checks
 * the same headers, so a cached copy of this script cannot override it.
 */
export function isTrackingDisabled(): boolean {
  if (typeof window === "undefined") return true;
  return isTrackingOptedOut() || hasBrowserPrivacySignal();
}

/**
 * The stored opt-out on its own. The privacy-page toggle needs this separately
 * from {@link hasBrowserPrivacySignal} — a browser sending GPC already stops
 * tracking, and showing that as "you chose this" would misreport whose setting
 * it is.
 */
export function isTrackingOptedOut(): boolean {
  if (typeof window === "undefined") return false;
  return readStorage(OPT_OUT_KEY) === "1";
}

/** A browser-level Do Not Track / Global Privacy Control signal. */
export function hasBrowserPrivacySignal(): boolean {
  if (typeof window === "undefined") return false;

  const nav = window.navigator as Navigator & { globalPrivacyControl?: boolean };
  return nav.doNotTrack === "1" || nav.globalPrivacyControl === true;
}

/** Lets someone opt out from the browser console or a privacy-page toggle. */
export function setTrackingOptOut(optedOut: boolean): void {
  writeStorage(OPT_OUT_KEY, optedOut ? "1" : "0");
}

function newSession(now: number): StoredSession {
  return {
    id: crypto.randomUUID(),
    startedAt: now,
    expiresAt: now + SESSION_IDLE_MS,
  };
}

/**
 * The current session id, extending its idle window as a side effect. Returns
 * `null` once the session has run past `MAX_SESSION_MS`, which is how an
 * abandoned tab stops appearing in the live view.
 */
export function touchSession(): string | null {
  if (typeof window === "undefined") return null;

  const now = Date.now();
  const raw = readStorage(SESSION_KEY);
  let session: StoredSession | null = null;

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<StoredSession>;
      if (
        typeof parsed.id === "string" &&
        typeof parsed.startedAt === "number" &&
        typeof parsed.expiresAt === "number" &&
        parsed.expiresAt > now
      ) {
        session = parsed as StoredSession;
      }
    } catch {
      /* Corrupt entry — start over. */
    }
  }

  if (session && now - session.startedAt > MAX_SESSION_MS) return null;
  if (!session) session = newSession(now);

  session.expiresAt = now + SESSION_IDLE_MS;
  writeStorage(SESSION_KEY, JSON.stringify(session));

  return session.id;
}

/** Read-only peek, for attaching the session to a form submission. */
export function currentSessionId(): string | null {
  if (typeof window === "undefined") return null;

  const raw = readStorage(SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<StoredSession>;
    return typeof parsed.id === "string" ? parsed.id : null;
  } catch {
    return null;
  }
}

type BeaconInput = Omit<Beacon, "sid" | "type"> & { type: BeaconType };

/**
 * Fire-and-forget POST.
 *
 * `sendBeacon` is used when the page may be going away (it survives unload and
 * is not cancelled by navigation); otherwise a keepalive `fetch` is preferred
 * because it reports failures and respects the abort signal.
 */
export function sendBeacon(input: BeaconInput, { unloading = false } = {}): void {
  if (typeof window === "undefined" || isTrackingDisabled()) return;

  const sid = unloading ? currentSessionId() : touchSession();
  if (!sid) return;

  const body = JSON.stringify({ ...input, sid } satisfies Beacon);

  if (unloading && typeof navigator.sendBeacon === "function") {
    const blob = new Blob([body], { type: "application/json" });
    if (navigator.sendBeacon(COLLECT_URL, blob)) return;
  }

  void fetch(COLLECT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
    credentials: "omit",
    cache: "no-store",
    // Analytics must never surface an error to the visitor.
  }).catch(() => {});
}

/**
 * Records a named conversion. Called from the contact form so
 * the dashboard can tie enquiries back to the traffic that produced them.
 */
export function trackEvent(
  event: TrackedEvent,
  props?: Beacon["props"],
): void {
  sendBeacon({
    type: "event",
    path: typeof window === "undefined" ? "/" : window.location.pathname,
    event,
    props,
  });
}
