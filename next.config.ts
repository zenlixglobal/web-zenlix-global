import type { NextConfig } from "next";

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
