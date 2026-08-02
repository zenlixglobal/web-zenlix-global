"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import type { AnalyticsLiveSnapshot } from "@/lib/analytics/types";
import { cn } from "@/lib/utils";

/**
 * Live visitor count in the admin header, so the number is visible from the
 * enquiries list too — not just the analytics page.
 *
 * Polls more slowly than the full live panel (30s vs 10s): this is an ambient
 * indicator, and it is mounted on every admin page.
 */
const POLL_MS = 30_000;
const MAX_BACKOFF_MS = 240_000;

export function LivePill({ initialVisitors }: { initialVisitors: number }) {
  const [visitors, setVisitors] = useState(initialVisitors);
  const [ok, setOk] = useState(true);

  const failuresRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  const poll = useCallback(async (signal: AbortSignal) => {
    try {
      const response = await fetch("/api/admin/analytics/live", {
        signal,
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      if (!response.ok) throw new Error(`live: ${response.status}`);

      const snapshot = (await response.json()) as AnalyticsLiveSnapshot;
      setVisitors(snapshot.visitors);
      setOk(true);
      failuresRef.current = 0;
    } catch {
      if (signal.aborted) return;
      failuresRef.current += 1;
      setOk(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    const schedule = () => {
      if (cancelled) return;

      timerRef.current = window.setTimeout(
        async () => {
          if (document.visibilityState === "visible") {
            await poll(controller.signal);
          }
          schedule();
        },
        Math.min(POLL_MS * 2 ** failuresRef.current, MAX_BACKOFF_MS),
      );
    };

    schedule();

    return () => {
      cancelled = true;
      controller.abort();
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, [poll]);

  return (
    <Link
      href="/admin/analytics"
      title={`${visitors} ${visitors === 1 ? "visitor" : "visitors"} on the site right now`}
      className="flex items-center gap-2 border border-white/20 px-2.5 py-1.5 text-sm text-white transition-colors hover:border-white/50"
    >
      <span className="relative flex size-2" aria-hidden>
        {ok && visitors > 0 ? (
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-gold-500 opacity-70" />
        ) : null}
        <span
          className={cn(
            "relative inline-flex size-2 rounded-full",
            ok ? "bg-gold-500" : "bg-navy-fg-subtle",
          )}
        />
      </span>
      <span className="tabular-nums">{visitors}</span>
      <span className="hidden text-navy-fg-subtle sm:inline">live</span>
    </Link>
  );
}
