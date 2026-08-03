"use client";

import { motion } from "motion/react";

import { DURATION, EASE_OUT } from "@/components/motion/tokens";

/**
 * Route transition for the marketing pages.
 *
 * A template — not a layout — because Next gives it a fresh key per route, so
 * it remounts on every navigation and the entrance replays. A layout would
 * animate once on first load and never again.
 *
 * Opacity only, deliberately. A transform here would make this element the
 * containing block for any `position: fixed` descendant, and the crossfade is
 * doing the work anyway: the per-section reveals below supply the movement.
 */
export default function SiteTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <motion.div
      data-motion
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: DURATION.medium, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}
