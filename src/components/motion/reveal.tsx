"use client";

import { motion } from "motion/react";

import {
  DISTANCE,
  DURATION,
  EASE_INOUT,
  STAGGER,
  VIEWPORT,
  type Direction,
  revealVariants,
  staggerVariants,
} from "@/components/motion/tokens";

/** Hover response for card-like surfaces. Kept as a prop on the reveal
 *  wrappers rather than a separate component so a card stays one element. */
const LIFT = {
  y: -4,
  transition: { duration: DURATION.fast, ease: EASE_INOUT },
} as const;

/**
 * The animation primitives the marketing pages are built from.
 *
 * These are deliberately `children`-shaped wrappers rather than animated
 * versions of each section. Children passed from a Server Component are
 * rendered on the server and handed to the client component as finished
 * output, so wrapping a section in <Reveal> costs one small client component
 * and keeps the section itself — and all of its copy — server-rendered.
 *
 * `data-motion` is the hook the <noscript> rule in the root layout uses to
 * force everything visible when JavaScript never arrives. Any element that
 * starts at `opacity: 0` must carry it.
 */

/**
 * The subset of elements these wrappers are allowed to render as. Keeping the
 * grid/list semantics correct matters: a <div> between a <ul> and its <li>s,
 * or inside a CSS grid, changes both layout and the accessibility tree.
 */
const TAGS = {
  div: motion.div,
  span: motion.span,
  li: motion.li,
  p: motion.p,
  article: motion.article,
  figure: motion.figure,
  section: motion.section,
  header: motion.header,
} as const;

export type MotionTag = keyof typeof TAGS;

/**
 * Every entry is a module-level Motion component, so indexing this map is a
 * lookup rather than a component definition — which is what keeps identity
 * stable across renders and the `react-hooks/static-components` rule happy.
 *
 * The cast narrows the union to one member. It is sound for our purposes:
 * these wrappers only ever forward `className`, `children` and Motion's own
 * props, which every element in the map accepts identically.
 */
const tags = TAGS as Record<MotionTag, typeof motion.div>;

type BaseProps = {
  children: React.ReactNode;
  className?: string;
  as?: MotionTag;
};

/**
 * A single element that fades and rises into place the first time it is
 * scrolled into view. Use this for standalone blocks; for a set of siblings
 * that should arrive one after another, use <Stagger> + <StaggerItem>.
 */
export function Reveal({
  children,
  className,
  as = "div",
  direction = "up",
  distance = DISTANCE,
  delay = 0,
  lift = false,
}: BaseProps & {
  direction?: Direction;
  distance?: number;
  /** Seconds. Use sparingly — prefer <Stagger> for sequencing siblings. */
  delay?: number;
  lift?: boolean;
}) {
  const Comp = tags[as];

  return (
    <Comp
      data-motion
      className={className}
      variants={revealVariants(direction, distance)}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      transition={delay ? { delay } : undefined}
      whileHover={lift ? LIFT : undefined}
    >
      {children}
    </Comp>
  );
}

/**
 * Scroll-triggered parent for a group of <StaggerItem>s. It animates nothing
 * itself, so it is safe to drop around an existing grid without disturbing the
 * layout — it only owns the timing.
 */
export function Stagger({
  children,
  className,
  as = "div",
  stagger = STAGGER,
  delayChildren = 0,
}: BaseProps & { stagger?: number; delayChildren?: number }) {
  const Comp = tags[as];

  return (
    <Comp
      className={className}
      variants={staggerVariants(stagger, delayChildren)}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
    >
      {children}
    </Comp>
  );
}

/**
 * Same as <Stagger>, but starts on mount instead of on scroll. For anything
 * above the fold, which is already in view on load and would otherwise either
 * animate at the same instant as the page paints or not at all.
 */
export function Entrance({
  children,
  className,
  as = "div",
  stagger = STAGGER,
  delayChildren = 0,
}: BaseProps & { stagger?: number; delayChildren?: number }) {
  const Comp = tags[as];

  return (
    <Comp
      className={className}
      variants={staggerVariants(stagger, delayChildren)}
      initial="hidden"
      animate="visible"
    >
      {children}
    </Comp>
  );
}

/**
 * A child of <Stagger> or <Entrance>. It carries no trigger of its own —
 * Motion propagates the parent's `hidden`/`visible` state down through the
 * tree, including across the plain server-rendered elements in between.
 */
export function StaggerItem({
  children,
  className,
  as = "div",
  direction = "up",
  distance = DISTANCE,
  lift = false,
}: BaseProps & {
  direction?: Direction;
  distance?: number;
  lift?: boolean;
}) {
  const Comp = tags[as];

  return (
    <Comp
      data-motion
      className={className}
      variants={revealVariants(direction, distance)}
      whileHover={lift ? LIFT : undefined}
    >
      {children}
    </Comp>
  );
}
