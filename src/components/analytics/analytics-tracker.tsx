"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { HEARTBEAT_MS, isTrackingDisabled, sendBeacon } from "@/lib/analytics/client";

/**
 * Mounted once in the marketing layout. Renders nothing.
 *
 * Three jobs:
 *   1. a `pageview` on first paint and on every client-side navigation,
 *   2. a `heartbeat` every 15s while the tab is visible — this is what drives
 *      the live-visitor count in /admin/analytics,
 *   3. a `leave` carrying engaged time when the page is hidden or unloaded.
 *
 * "Engaged" time deliberately excludes the stretch where a tab sat in the
 * background, so time-on-page reflects reading rather than tab hoarding.
 *
 * `usePathname` alone drives re-sends; the query string is read from
 * `window.location` at send time, which keeps the component out of
 * `useSearchParams`' static-rendering bailout.
 */
export function AnalyticsTracker() {
  const pathname = usePathname();

  // Kept in refs so the visibility handlers below always read live values
  // without re-subscribing on every render.
  const engagedMsRef = useRef(0);
  const resumedAtRef = useRef<number | null>(null);
  const pathRef = useRef(pathname);

  useEffect(() => {
    if (isTrackingDisabled()) return;

    pathRef.current = pathname;

    // Settle any time still owed to the previous page before the new one
    // starts accruing.
    engagedMsRef.current = 0;
    resumedAtRef.current =
      document.visibilityState === "visible" ? Date.now() : null;

    const isEntry = !document.referrer || !document.referrer.includes(location.host);

    sendBeacon({
      type: "pageview",
      path: pathname,
      title: document.title.slice(0, 300),
      referrer: document.referrer || undefined,
      // Campaign tags only mean something on the page the visitor arrived at.
      query: isEntry ? location.search || undefined : undefined,
      screenWidth: window.screen?.width,
    });

    /** Engaged ms since the last resume, plus whatever was already banked. */
    const settle = () => {
      if (resumedAtRef.current !== null) {
        engagedMsRef.current += Date.now() - resumedAtRef.current;
        resumedAtRef.current = null;
      }
      return engagedMsRef.current;
    };

    const heartbeat = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      sendBeacon({ type: "heartbeat", path: pathRef.current });
    }, HEARTBEAT_MS);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        resumedAtRef.current = Date.now();
        sendBeacon({ type: "heartbeat", path: pathRef.current });
        return;
      }

      // Hiding is the reliable "page is going away" signal on mobile, where
      // `pagehide`/`beforeunload` are not guaranteed to fire.
      const durationMs = settle();
      sendBeacon(
        { type: "leave", path: pathRef.current, durationMs },
        { unloading: true },
      );
    };

    const onPageHide = () => {
      const durationMs = settle();
      sendBeacon(
        { type: "leave", path: pathRef.current, durationMs },
        { unloading: true },
      );
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      window.clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);

      // A client-side navigation unmounts this effect: close out the page the
      // visitor just left so its time-on-page isn't lost.
      const durationMs = settle();
      if (durationMs > 0) {
        sendBeacon({ type: "leave", path: pathRef.current, durationMs });
      }
    };
  }, [pathname]);

  return null;
}
