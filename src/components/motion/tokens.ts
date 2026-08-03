import type { Transition, Variants } from "motion/react";

/**
 * The motion design system.
 *
 * Every animation on the marketing site is built from these values, for the
 * same reason the colours live in `globals.css` rather than as one-off hexes:
 * one easing curve and one set of durations is what makes a page feel designed
 * instead of merely animated. Restyle the motion here, not at the call site.
 */

/**
 * Expo-out. Nearly all of the distance is covered in the first third of the
 * duration, so elements arrive quickly and settle softly — this reads as
 * "expensive" where a linear or ease-in-out curve reads as "template".
 */
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/** Symmetric curve for state changes that have no arrival, e.g. hover colour. */
export const EASE_INOUT = [0.4, 0, 0.2, 1] as const;

export const DURATION = {
  /** Micro-interactions: hover, tap, focus. */
  fast: 0.2,
  /** Page-transition crossfades. */
  medium: 0.35,
  /** The default for content arriving on screen. */
  slow: 0.6,
  /** Hero-scale entrances. */
  slower: 0.9,
} as const;

/**
 * The stat count-up runs far longer than any entrance. The numbers *are* the
 * content of that band, so the tally has to be legible while it climbs — under
 * a second it reads as a flicker on load rather than as a count.
 */
export const COUNT_DURATION = 2.4;

/**
 * Ease-out cubic, for the count-up only. EASE_OUT is expo and spends most of
 * its duration within a digit of the target, which turns a long count into a
 * short burst followed by a stall; this curve keeps the digits moving.
 */
export const EASE_COUNT = [0.33, 1, 0.68, 1] as const;

/** How far a revealing element travels. Deliberately small — a long throw
 *  looks like a slideshow, and it costs layout stability on slow devices. */
export const DISTANCE = 24;

/** Gap between siblings in a staggered group. */
export const STAGGER = 0.08;

/**
 * Fire the reveal slightly *before* the element reaches the viewport edge, so
 * the animation is already settling by the time it is comfortably in view
 * rather than starting after the user has stopped scrolling.
 *
 * `once` is non-negotiable: re-animating on every scroll-past is the single
 * most common way scroll animation turns into an irritant.
 */
export const VIEWPORT = { once: true, margin: "0px 0px -80px 0px" } as const;

export const transition: Transition = {
  duration: DURATION.slow,
  ease: EASE_OUT,
};

export type Direction = "up" | "down" | "left" | "right" | "none";

function offset(direction: Direction, distance: number) {
  switch (direction) {
    case "up":
      return { y: distance };
    case "down":
      return { y: -distance };
    case "left":
      return { x: distance };
    case "right":
      return { x: -distance };
    case "none":
      return {};
  }
}

/** The one reveal used everywhere: fade plus a short travel. */
export function revealVariants(
  direction: Direction = "up",
  distance: number = DISTANCE,
): Variants {
  return {
    hidden: { opacity: 0, ...offset(direction, distance) },
    visible: { opacity: 1, x: 0, y: 0, transition },
  };
}

/**
 * Parent of a staggered group. It animates nothing itself — it exists only to
 * own the timing, so the children stay declarative.
 *
 * `delayChildren` lets a group start after the heading above it has landed.
 */
export function staggerVariants(
  stagger: number = STAGGER,
  delayChildren = 0,
): Variants {
  return {
    hidden: {},
    visible: {
      transition: { staggerChildren: stagger, delayChildren },
    },
  };
}
