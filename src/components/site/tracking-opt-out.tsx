"use client";

import { useSyncExternalStore } from "react";

import {
  hasBrowserPrivacySignal,
  isTrackingOptedOut,
  setTrackingOptOut,
} from "@/lib/analytics/client";

/**
 * The opt-out control the privacy policy points at.
 *
 * `localStorage` and the GPC flag do not exist on the server, so both are read
 * through `useSyncExternalStore` with a server snapshot of "not opted out".
 * React then re-renders with the real value after hydration instead of
 * mismatching. Subscribing to `storage` is a bonus: opting out in one tab
 * updates the control in every other one.
 */

const listeners = new Set<() => void>();

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);

  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** `storage` only fires in *other* tabs, so this tab is told explicitly. */
function notifyThisTab(): void {
  for (const listener of listeners) listener();
}

/** The signal is fixed for the life of the page; nothing ever fires. */
const subscribeToNothing = () => () => {};

export function TrackingOptOut() {
  const optedOut = useSyncExternalStore(subscribe, isTrackingOptedOut, () => false);
  const browserSignal = useSyncExternalStore(
    subscribeToNothing,
    hasBrowserPrivacySignal,
    () => false,
  );

  function toggle() {
    setTrackingOptOut(!optedOut);
    notifyThisTab();
  }

  // A browser sending GPC or DNT is already honored, on this device and at the
  // collect endpoint. Offering a toggle on top of it would imply the choice is
  // ours to reverse.
  if (browserSignal) {
    return (
      <p className="mt-4 rounded-sm border border-line bg-cream px-4 py-3 text-[15px] text-slate-muted">
        <strong className="font-semibold text-ink">
          Your browser is sending a Global Privacy Control or Do Not Track
          signal, and we are honoring it.
        </strong>{" "}
        No analytics are being recorded for this visit.
      </p>
    );
  }

  return (
    <div className="mt-4 rounded-sm border border-line bg-cream px-4 py-4">
      <p className="mb-3 text-[15px] text-slate-muted">
        {optedOut
          ? "You have opted out of analytics on this browser."
          : "Analytics are on for this browser."}{" "}
        This choice is stored on your device, so it needs setting once per
        browser and is cleared if you clear site data.
      </p>
      <button
        type="button"
        onClick={toggle}
        aria-pressed={optedOut}
        className="inline-flex h-11 items-center justify-center border border-navy-900 px-6 text-[13.5px] font-semibold text-navy-900 transition-colors hover:bg-navy-900 hover:text-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500"
      >
        {optedOut ? "Turn analytics back on" : "Opt out of analytics"}
      </button>
    </div>
  );
}
