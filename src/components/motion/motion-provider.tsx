"use client";

import { MotionConfig } from "motion/react";

import { transition } from "@/components/motion/tokens";

/**
 * Wraps the marketing shell so every animation inherits the house curve and,
 * more importantly, honours `prefers-reduced-motion`.
 *
 * The reduced-motion block in `globals.css` cannot do this job on its own:
 * it neutralises CSS transitions and keyframes, but Motion animates through
 * inline styles that a stylesheet has no say over. `reducedMotion="user"`
 * drops the transforms while keeping opacity fades, which is what the
 * accessibility guidance actually asks for — vestibular triggers are movement
 * and scale, not a crossfade.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={transition}>
      {children}
    </MotionConfig>
  );
}
