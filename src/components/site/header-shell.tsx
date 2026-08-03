"use client";

import { motion, useMotionValueEvent, useScroll, useSpring } from "motion/react";
import { useState } from "react";

import { DURATION, EASE_INOUT } from "@/components/motion/tokens";
import { cn } from "@/lib/utils";

/**
 * The fixed header's scroll behaviour.
 *
 * Two things happen past the fold: the bar condenses and its background goes
 * fully opaque, and a gold rule tracks reading progress along the bottom edge.
 *
 * The header *content* stays in the Server Component that renders this — only
 * the scroll state lives on the client. The condensed flag is published as a
 * `data-` attribute so the height change is a CSS transition on the existing
 * layout classes rather than a JS-animated height, which would thrash layout
 * on every frame of the scroll.
 */
export function HeaderShell({ children }: { children: React.ReactNode }) {
  const { scrollY, scrollYProgress } = useScroll();
  const [condensed, setCondensed] = useState(false);

  // 24px rather than 0 so the bar does not flicker on the elastic overscroll
  // at the top of the page on iOS.
  useMotionValueEvent(scrollY, "change", (latest) => {
    setCondensed(latest > 24);
  });

  // Smooths the rule's travel over the raw scroll value, which on a trackpad
  // arrives in visibly discrete jumps.
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.header
      data-condensed={condensed}
      className={cn(
        "group/header fixed inset-x-0 top-0 z-50 border-b border-white/14",
        "supports-[backdrop-filter]:backdrop-blur-[10px]",
        condensed ? "bg-navy-900 shadow-lg shadow-navy-950/20" : "bg-navy-900/92",
      )}
      style={{
        transitionProperty: "background-color, box-shadow",
        transitionDuration: `${DURATION.medium}s`,
        transitionTimingFunction: `cubic-bezier(${EASE_INOUT.join(",")})`,
      }}
    >
      {children}

      <motion.div
        aria-hidden
        style={{ scaleX: progress }}
        className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-gold-500"
      />
    </motion.header>
  );
}
