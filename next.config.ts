import type { NextConfig } from "next";

/**
 * Fail a production deploy that would ship the wrong canonical host.
 *
 * NEXT_PUBLIC_SITE_URL is inlined at build time, and every canonical tag, OG
 * URL, sitemap <loc> and the robots.txt Sitemap line is derived from it. Left
 * pointing at localhost or the preview host, the live site tells search engines
 * to index a different origin — which is exactly how zenlixglobal.com came to
 * canonicalise to web-zenlix-global.vercel.app and stayed out of results.
 *
 * Scoped to Vercel Production on purpose: preview deploys legitimately run on
 * *.vercel.app, and a local `next build` legitimately runs on localhost.
 */
function assertProductionSiteUrl(): void {
  if (process.env.VERCEL_ENV !== "production") return;

  const context =
    "A Vercel Production build must use the public domain (e.g. " +
    "https://www.zenlixglobal.com): canonical tags, OG URLs, robots.txt and " +
    "every sitemap <loc> are built from this value.";

  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  if (!raw) {
    throw new Error(`NEXT_PUBLIC_SITE_URL is not set. ${context}`);
  }

  let hostname: string;
  try {
    hostname = new URL(raw).hostname;
  } catch {
    throw new Error(
      `NEXT_PUBLIC_SITE_URL is not a valid absolute URL (${raw}). ${context}`,
    );
  }

  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".vercel.app")
  ) {
    throw new Error(
      `NEXT_PUBLIC_SITE_URL points at ${hostname}. ${context}`,
    );
  }
}

assertProductionSiteUrl();

const nextConfig: NextConfig = {
  images: {
    // The placeholder photography still points at Unsplash. Once you swap in
    // your own artwork under /public, this entry can go.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },

  /**
   * Send the *.vercel.app deployment host to the real domain.
   *
   * Vercel keeps the generated preview host publicly reachable and serving the
   * same 200s as production, so Google indexed it as a second copy of the site
   * and ranked it alongside zenlixglobal.com. A 308 collapses the duplicate and
   * passes the accumulated signals to the canonical host.
   *
   * Production-only: preview deployments are *supposed* to answer on their own
   * .vercel.app URL, and redirecting those away would make them useless.
   */
  async redirects() {
    if (process.env.VERCEL_ENV !== "production") return [];

    const canonical = process.env.NEXT_PUBLIC_SITE_URL;
    if (!canonical) return [];

    return [
      {
        source: "/:path*",
        has: [{ type: "host" as const, value: ".*\\.vercel\\.app" }],
        destination: `${canonical}/:path*`,
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
      {
        // The admin area holds enquiry data — keep it out of shared caches
        // and out of search results.
        source: "/admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "no-store, max-age=0" },
        ],
      },
      {
        // Same reasoning for the admin-only JSON endpoints, which the rule
        // above does not match.
        source: "/api/admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "no-store, max-age=0" },
        ],
      },
      {
        // The site is also reachable on its Vercel domains — the project URL
        // and every preview deployment. Those serve a byte-identical copy of
        // production, so Google indexes them as duplicates ("Alternative page
        // with proper canonical tag", or worse "Duplicate without user-selected
        // canonical" when a preview build has no NEXT_PUBLIC_SITE_URL and its
        // canonical points at localhost). Only the custom domain should be
        // crawlable; the host match covers both without an env var to keep in
        // sync.
        source: "/:path*",
        has: [{ type: "host", value: "(?<vercelHost>.*\\.vercel\\.app)" }],
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
