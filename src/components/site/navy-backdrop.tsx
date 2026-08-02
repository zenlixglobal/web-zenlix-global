/**
 * The decorative constellation behind the hero and page banners.
 * Ported verbatim from the `.hero-mesh` SVG in the original index.html.
 */
export function HeroMesh({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1180 640"
      preserveAspectRatio="xMaxYMid slice"
      aria-hidden="true"
      className={className}
    >
      <g stroke="#C9A227" strokeWidth="1" opacity="0.35">
        <line x1="700" y1="80" x2="900" y2="180" />
        <line x1="900" y1="180" x2="850" y2="380" />
        <line x1="850" y1="380" x2="1050" y2="460" />
        <line x1="900" y1="180" x2="1100" y2="120" />
        <line x1="700" y1="80" x2="850" y2="380" />
        <line x1="1050" y1="460" x2="1150" y2="280" />
        <line x1="1100" y1="120" x2="1150" y2="280" />
        <line x1="750" y1="480" x2="850" y2="380" />
        <line x1="700" y1="80" x2="1100" y2="120" />
      </g>
      <g fill="#E3C468">
        <circle cx="700" cy="80" r="3.5" />
        <circle cx="900" cy="180" r="4.5" />
        <circle cx="850" cy="380" r="3.5" />
        <circle cx="1050" cy="460" r="4.5" />
        <circle cx="1100" cy="120" r="3.5" />
        <circle cx="1150" cy="280" r="4" />
        <circle cx="750" cy="480" r="3" />
      </g>
    </svg>
  );
}

/** Shared navy radial gradient used by the hero and the page banners. */
export const navyGradient =
  "bg-[radial-gradient(ellipse_at_75%_20%,var(--color-navy-700)_0%,var(--color-navy-900)_55%,var(--color-navy-950)_100%)]";
