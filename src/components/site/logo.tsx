import Image from "next/image";
import Link from "next/link";

import { site } from "@/content/site";
import { cn } from "@/lib/utils";

/**
 * The Zenlix monogram — the gold "Z"-over-globe mark.
 *
 * The supplied artwork (`public/zenlix-icon.png`) came on a baked-in navy
 * plate a few shades off the site navy, so it read as a visible block in the
 * header. `public/zenlix-mark.png` is that same mark with the plate keyed out
 * and the edges un-mixed, so it composites cleanly onto any background.
 *
 * `size` drives the intrinsic dimensions Next.js uses to build the srcset —
 * keep it close to the rendered size so phones don't download a 2× asset for
 * a 28px logo.
 */
export function LogoMark({
  size = 40,
  className,
  priority = false,
}: {
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/zenlix-mark.png"
      alt=""
      aria-hidden
      width={size}
      height={size}
      priority={priority}
      className={cn("shrink-0 object-contain", className)}
    />
  );
}

/**
 * Mark + wordmark, sized for the tightest place it appears (the 320px-wide
 * phone header, where it shares the bar with the hamburger). Callers with more
 * room — the site header past `sm` — scale it up through `className` /
 * `markClassName`; those defaults are unprefixed so a plain `size-9` from the
 * drawer still wins.
 *
 * `whitespace-nowrap` keeps "Zenlix Global" on one line: wrapping it would push
 * the fixed-height bar out of shape rather than saving any width.
 */
export function Logo({
  className,
  markClassName,
  onNavigate,
}: {
  className?: string;
  markClassName?: string;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href="/"
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-2 font-heading text-[22px] font-semibold whitespace-nowrap text-white",
        "rounded-xs outline-offset-4 focus-visible:outline-2 focus-visible:outline-gold-500",
        className,
      )}
    >
      {/* Intrinsic size stays at the largest rendered size (55px in the header)
          so the srcset covers it; every other use is smaller and reuses the
          same cached file. */}
      <LogoMark size={55} priority className={cn("size-10", markClassName)} />
      <span>{site.name}</span>
    </Link>
  );
}
