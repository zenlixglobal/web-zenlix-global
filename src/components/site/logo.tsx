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
        "flex items-center gap-2.5 font-heading text-[34px] font-semibold text-white",
        "rounded-xs outline-offset-4 focus-visible:outline-2 focus-visible:outline-gold-500",
        className,
      )}
    >
      <LogoMark
        size={55}
        priority
        className={cn("size-[55px]", markClassName)}
      />
      <span>{site.name}</span>
    </Link>
  );
}
