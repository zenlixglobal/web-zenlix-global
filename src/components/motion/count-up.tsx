"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

import { COUNT_DURATION, EASE_COUNT } from "@/components/motion/tokens";

/**
 * Splits a display stat into the number to count and the text around it, so
 * the content file can keep writing "92%", "550+" and "10 Days" rather than
 * being reshaped into props for the sake of an animation.
 *
 * Returns null when there is no leading number ("Same day"), in which case the
 * caller renders the value untouched.
 */
function parse(value: string) {
  const match = /^(\D*)(\d[\d,]*)(.*)$/s.exec(value);
  if (!match) return null;

  const [, prefix, digits, suffix] = match;
  const target = Number(digits.replace(/,/g, ""));
  if (!Number.isFinite(target)) return null;

  // Preserve the thousands separator the copy was written with.
  const grouped = digits.includes(",");
  const format = (n: number) =>
    `${prefix}${grouped ? Math.round(n).toLocaleString("en-US") : Math.round(n)}${suffix}`;

  return { target, format };
}

/**
 * Counts a hero stat up from zero the first time it scrolls into view.
 *
 * The final value is what renders on the server and what React hydrates, and
 * the animation is then driven imperatively through the ref. Doing it that way
 * rather than through state is what keeps the real number in the HTML for
 * crawlers and for anyone without JavaScript — a stat that server-renders as
 * "0" is a worse trade than no animation at all.
 */
export function CountUp({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node || !inView || reducedMotion) return;

    const parsed = parse(value);
    if (!parsed) return;

    const controls = animate(0, parsed.target, {
      duration: COUNT_DURATION,
      ease: EASE_COUNT,
      onUpdate: (latest) => {
        node.textContent = parsed.format(latest);
      },
      // Snap back to the authored string so any formatting the parser did not
      // model (spacing, casing) survives the animation.
      onComplete: () => {
        node.textContent = value;
      },
    });

    return () => controls.stop();
  }, [inView, reducedMotion, value]);

  return (
    <span ref={ref} className={className}>
      {value}
    </span>
  );
}
