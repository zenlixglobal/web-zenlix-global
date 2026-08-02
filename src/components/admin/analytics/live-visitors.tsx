"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  formatCountry,
  formatNumber,
  formatRelativeTime,
} from "@/lib/analytics/format";
import {
  LIVE_WINDOW_SECONDS,
  type AnalyticsLiveCount,
  type AnalyticsLiveSnapshot,
} from "@/lib/analytics/types";
import { cn } from "@/lib/utils";

/**
 * "Who is on the site right now."
 *
 * Server-rendered from a snapshot so the first paint already has real numbers,
 * then refreshed by polling /api/admin/analytics/live.
 *
 * Three behaviours that matter in production:
 *   * polling pauses while the dashboard tab is hidden, and fires immediately
 *     on return — an admin who tabs back should not see a stale count,
 *   * a failed poll backs off exponentially instead of hammering a struggling
 *     database,
 *   * the previous snapshot stays on screen during a refetch. No skeleton
 *     flash, no layout jump.
 */

const POLL_MS = 10_000;
const MAX_BACKOFF_MS = 80_000;

export function LiveVisitors({ initial }: { initial: AnalyticsLiveSnapshot }) {
  const [snapshot, setSnapshot] = useState(initial);
  const [stale, setStale] = useState(false);
  /**
   * Ticks once a second so the "2m ago" column keeps counting up between
   * polls. Starts as `null` deliberately: the server has no way to know the
   * reader's clock, so seeding this with a timestamp would render one relative
   * time on the server and a different one on hydration.
   */
  const [now, setNow] = useState<number | null>(null);

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

      setSnapshot((await response.json()) as AnalyticsLiveSnapshot);
      setStale(false);
      failuresRef.current = 0;
    } catch (error) {
      if (signal.aborted) return;
      failuresRef.current += 1;
      setStale(true);
      console.error("[analytics] live poll failed", error);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    const schedule = () => {
      if (cancelled) return;

      const delay = Math.min(
        POLL_MS * 2 ** failuresRef.current,
        MAX_BACKOFF_MS,
      );

      timerRef.current = window.setTimeout(async () => {
        if (document.visibilityState === "visible") {
          await poll(controller.signal);
        }
        schedule();
      }, delay);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      void poll(controller.signal).finally(schedule);
    };

    schedule();
    document.addEventListener("visibilitychange", onVisibilityChange);

    // The clock is an external system, so it is read from a callback rather
    // than synchronously in the effect body. The 0ms first tick fills in the
    // "—" placeholder on the frame after hydration.
    const syncClock = () => setNow(Date.now());
    const firstTick = window.setTimeout(syncClock, 0);
    const tick = window.setInterval(syncClock, 1000);

    return () => {
      cancelled = true;
      controller.abort();
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      window.clearTimeout(firstTick);
      window.clearInterval(tick);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [poll]);

  return (
    <div
      className={cn(
        "border border-line bg-white transition-opacity",
        stale && "opacity-60",
      )}
    >
      <div className="grid gap-px bg-line lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
        <HeroCount
          visitors={snapshot.visitors}
          sessions={snapshot.sessions}
          stale={stale}
        />

        <div className="grid gap-px bg-line sm:grid-cols-2">
          <LiveList
            title="Current pages"
            rows={snapshot.pages}
            emptyLabel="No pages being viewed."
          />
          <LiveList
            title="Countries"
            rows={snapshot.countries}
            emptyLabel="No locations yet."
            formatLabel={formatCountry}
          />
        </div>
      </div>

      <LiveTable sessions={snapshot.recent} now={now} />
    </div>
  );
}

/**
 * The one hero figure on the page. Everything else is a stat tile — this is
 * the number the dashboard leads with.
 */
function HeroCount({
  visitors,
  sessions,
  stale,
}: {
  visitors: number;
  sessions: number;
  stale: boolean;
}) {
  return (
    <div className="bg-navy-900 px-5 py-5 text-white">
      <p className="flex items-center gap-2 font-mono text-[11px] tracking-[0.08em] text-navy-fg-subtle uppercase">
        <span className="relative flex size-2" aria-hidden>
          {/* The ping is suppressed under prefers-reduced-motion by the
              global rule in globals.css. */}
          {!stale ? (
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-gold-500 opacity-70" />
          ) : null}
          <span
            className={cn(
              "relative inline-flex size-2 rounded-full",
              stale ? "bg-navy-fg-subtle" : "bg-gold-500",
            )}
          />
        </span>
        {stale ? "Reconnecting" : "Live now"}
      </p>

      <p className="mt-3 font-heading text-5xl leading-none font-semibold text-white">
        {formatNumber(visitors)}
      </p>

      <p className="mt-2 text-sm text-navy-fg-muted">
        {visitors === 1 ? "visitor" : "visitors"} on the site
        {sessions !== visitors ? ` · ${formatNumber(sessions)} sessions` : ""}
      </p>

      <p className="mt-3 text-xs text-navy-fg-subtle">
        Active within the last {Math.round(LIVE_WINDOW_SECONDS / 60)} minutes.
      </p>
    </div>
  );
}

function LiveList({
  title,
  rows,
  emptyLabel,
  formatLabel,
}: {
  title: string;
  rows: AnalyticsLiveCount[];
  emptyLabel: string;
  formatLabel?: (label: string) => string;
}) {
  const max = Math.max(...rows.map((row) => row.visitors), 1);

  return (
    <div className="bg-white px-4 py-4">
      <h3 className="font-mono text-[11px] tracking-[0.06em] text-slate-muted uppercase">
        {title}
      </h3>

      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-slate-muted">{emptyLabel}</p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {rows.slice(0, 5).map((row) => {
            const display = formatLabel ? formatLabel(row.label) : row.label;

            return (
              <li key={row.label}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="truncate text-ink" title={display}>
                    {display}
                  </span>
                  <span className="shrink-0 tabular-nums text-slate-muted">
                    {formatNumber(row.visitors)}
                  </span>
                </div>
                <div className="mt-1 h-1 w-full bg-chart-track">
                  <div
                    className="h-full rounded-r-[2px] bg-chart-1"
                    style={{ width: `${Math.max((row.visitors / max) * 100, 2)}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function LiveTable({
  sessions,
  now,
}: {
  sessions: AnalyticsLiveSnapshot["recent"];
  /** `null` until the client clock is available — see `LiveVisitors`. */
  now: number | null;
}) {
  if (sessions.length === 0) {
    return (
      <p className="border-t border-line px-4 py-6 text-center text-sm text-slate-muted">
        Nobody is on the site right now. This updates automatically.
      </p>
    );
  }

  return (
    <div className="border-t border-line">
      <div className="max-h-80 overflow-auto">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">
            Visitors currently on the site, most recently active first
          </caption>
          <thead className="sticky top-0 bg-white">
            <tr className="border-b border-line text-xs text-slate-muted">
              <th scope="col" className="px-4 py-2 font-medium">Page</th>
              <th scope="col" className="px-4 py-2 font-medium">Location</th>
              <th scope="col" className="hidden px-4 py-2 font-medium sm:table-cell">
                Device
              </th>
              <th scope="col" className="hidden px-4 py-2 font-medium md:table-cell">
                Came from
              </th>
              <th scope="col" className="px-4 py-2 text-right font-medium">Views</th>
              <th scope="col" className="px-4 py-2 text-right font-medium">Seen</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr key={session.id} className="border-b border-line/60 last:border-0">
                <td className="max-w-56 truncate px-4 py-2 text-ink" title={session.current_path}>
                  {session.current_path}
                  {session.converted ? (
                    <span className="ml-2 font-mono text-[10px] text-positive uppercase">
                      enquired
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-2 text-slate-muted">
                  {formatCountry(session.country)}
                </td>
                <td className="hidden px-4 py-2 text-slate-muted capitalize sm:table-cell">
                  {session.device_type} · {session.browser}
                </td>
                <td
                  className="hidden max-w-40 truncate px-4 py-2 text-slate-muted md:table-cell"
                  title={session.referrer_host}
                >
                  {session.referrer_host}
                </td>
                <td className="px-4 py-2 text-right tabular-nums text-slate-muted">
                  {formatNumber(session.page_view_count)}
                </td>
                <td className="px-4 py-2 text-right whitespace-nowrap tabular-nums text-slate-muted">
                  {now === null ? "—" : formatRelativeTime(session.last_seen_at, now)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
