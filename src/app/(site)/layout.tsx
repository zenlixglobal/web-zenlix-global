import { AnalyticsTracker } from "@/components/analytics/analytics-tracker";
import { MotionProvider } from "@/components/motion/motion-provider";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

/**
 * Marketing shell. The header is fixed, so every page here opens with a navy
 * hero/banner that carries its own top padding to sit clear of it.
 *
 * Analytics is mounted here rather than in the root layout so /admin is never
 * tracked — the team browsing their own enquiries is not traffic.
 */
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MotionProvider>
      {/* Anything that starts at `opacity: 0` waits on JavaScript to reveal
          it. If that JavaScript never arrives the page must still be readable,
          so this overrides the inline styles Motion sets. A stylesheet rule
          marked `!important` outranks an inline style, which is the only way
          to win against them. */}
      <noscript>
        <style>{`[data-motion]{opacity:1!important;transform:none!important}`}</style>
      </noscript>

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-100 focus:bg-gold-500 focus:px-4 focus:py-2 focus:font-semibold focus:text-navy-900"
      >
        Skip to content
      </a>
      <AnalyticsTracker />
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </MotionProvider>
  );
}
