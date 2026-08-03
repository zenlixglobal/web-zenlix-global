import type { Metadata } from "next";

import { AdminShell } from "@/components/admin/admin-shell";
import { BarList } from "@/components/admin/analytics/bar-list";
import { EnquiryChart } from "@/components/admin/analytics/enquiry-chart";
import { LiveVisitors } from "@/components/admin/analytics/live-visitors";
import { EmptyState, Panel } from "@/components/admin/analytics/panel";
import { ShareBar } from "@/components/admin/analytics/share-bar";
import { StatTile } from "@/components/admin/analytics/stat-tile";
import { TrafficChart } from "@/components/admin/analytics/traffic-chart";
import { FilterLink } from "@/components/admin/filter-link";
import { inquiryLabel } from "@/content/site";
import {
  formatCompact,
  formatCountry,
  formatDuration,
  formatPercent,
} from "@/lib/analytics/format";
import {
  bucketEnquiries,
  fetchBreakdown,
  fetchEnquiryReport,
  fetchLiveSnapshot,
  fetchOverview,
  fetchTimeseries,
} from "@/lib/analytics/queries";
import {
  DEFAULT_RANGE,
  isRangeKey,
  RANGE_KEYS,
  RANGE_PRESETS,
  reportingTimeZone,
  resolveRange,
} from "@/lib/analytics/ranges";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Analytics" };

// Traffic data is per-request and admin-only; it must never be cached.
export const dynamic = "force-dynamic";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const user = await requireAdmin();
  const { range: rangeParam } = await searchParams;

  const range = resolveRange(isRangeKey(rangeParam) ? rangeParam : DEFAULT_RANGE);
  const timeZone = reportingTimeZone();
  const supabase = await createSupabaseServerClient();

  // One round trip each, all in flight together — the page is only as slow as
  // its slowest query rather than the sum of nine.
  const [
    live,
    overview,
    timeseries,
    enquiries,
    topPages,
    referrers,
    countries,
    devices,
    browsers,
    campaigns,
    entryPages,
  ] = await Promise.all([
    fetchLiveSnapshot(supabase),
    fetchOverview(supabase, range),
    fetchTimeseries(supabase, range),
    fetchEnquiryReport(supabase, range),
    fetchBreakdown(supabase, range, "page"),
    fetchBreakdown(supabase, range, "referrer"),
    fetchBreakdown(supabase, range, "country"),
    fetchBreakdown(supabase, range, "device", 6),
    fetchBreakdown(supabase, range, "browser", 6),
    fetchBreakdown(supabase, range, "utm_campaign", 6),
    fetchBreakdown(supabase, range, "entry_page", 6),
  ]);

  const enquiryCounts = bucketEnquiries(enquiries.timestamps, timeseries);
  const visitorTrend = timeseries.map((point) => point.visitors);

  // Campaign tags are optional; an all-"None" list is noise, not a panel.
  const hasCampaigns = campaigns.some((row) => row.label !== "None");

  return (
    <AdminShell user={user} liveVisitors={live.visitors}>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl">Analytics</h1>
        <p className="mt-1 text-sm text-slate-muted">
          Traffic, sources and enquiry conversion over {range.phrase}.
        </p>
      </div>

      {/* Live is deliberately above the filter row: it is always "now" and is
          not scoped by the range selector below. */}
      <section className="mb-8" aria-label="Live visitors">
        <LiveVisitors initial={live} />
      </section>

      {/* One filter row, above everything it scopes. */}
      <nav
        className="mb-5 flex flex-wrap items-center gap-2"
        aria-label="Select a date range"
      >
        <span className="mr-1 font-mono text-[11px] tracking-[0.06em] text-slate-muted uppercase">
          Last
        </span>
        {RANGE_KEYS.map((key) => (
          <FilterLink
            key={key}
            active={range.key === key}
            href={key === DEFAULT_RANGE ? "/admin/analytics" : `/admin/analytics?range=${key}`}
          >
            {RANGE_PRESETS[key].label}
          </FilterLink>
        ))}
      </nav>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Visitors"
          value={formatCompact(overview.visitors)}
          current={overview.visitors}
          previous={overview.prev_visitors}
          trend={visitorTrend}
        />
        <StatTile
          label="Page views"
          value={formatCompact(overview.page_views)}
          current={overview.page_views}
          previous={overview.prev_page_views}
        />
        <StatTile
          label="Avg. visit"
          value={formatDuration(overview.avg_seconds)}
          current={overview.avg_seconds}
          previous={overview.prev_avg_seconds}
        />
        <StatTile
          label="Bounce rate"
          value={formatPercent(overview.bounce_rate)}
          current={overview.bounce_rate}
          previous={overview.prev_bounce_rate}
          goodDirection="down"
        />
        <StatTile
          label="Enquiries"
          value={formatCompact(enquiries.total)}
          current={enquiries.total}
          previous={enquiries.previousTotal}
          emphasis
        />
        <StatTile
          label="Conversion rate"
          value={formatPercent(overview.conversion_rate)}
          current={overview.conversion_rate}
          previous={overview.prev_conversion_rate}
          hint="of tracked sessions"
          emphasis
        />
        <StatTile
          label="Sessions"
          value={formatCompact(overview.sessions)}
          current={overview.sessions}
          previous={overview.prev_sessions}
        />
        <StatTile
          label="Newsletter signups"
          value={formatCompact(enquiries.newsletterSignups)}
          current={enquiries.newsletterSignups}
          previous={enquiries.previousNewsletterSignups}
        />
      </div>

      <div className="mb-6 grid gap-3 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Panel
          title="Traffic"
          description={`Visitors and page views per ${range.bucket}`}
        >
          {timeseries.length === 0 ? (
            <EmptyState>
              No traffic recorded yet. Data starts arriving as soon as someone
              visits the site.
            </EmptyState>
          ) : (
            <TrafficChart
              points={timeseries}
              bucket={range.bucket}
              timeZone={timeZone}
            />
          )}
        </Panel>

        <Panel
          title="Enquiries"
          description={`${enquiries.total} received over ${range.phrase}`}
        >
          <EnquiryChart
            points={timeseries}
            counts={enquiryCounts}
            bucket={range.bucket}
            timeZone={timeZone}
          />
        </Panel>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Panel title="Top pages" description="By page views">
          <BarList rows={topPages} emptyLabel="No page views in this range." />
        </Panel>

        <Panel title="Traffic sources" description="Referring site">
          <BarList
            rows={referrers}
            emptyLabel="No sessions in this range."
          />
        </Panel>

        <Panel title="Countries" description="By visitors">
          <BarList
            rows={countries}
            emptyLabel="No locations recorded."
            formatLabel={formatCountry}
          />
        </Panel>

        <Panel title="Devices" description="Share of visitors">
          <ShareBar rows={devices} emptyLabel="No sessions in this range." />
        </Panel>

        <Panel title="Browsers" description="By visitors">
          <BarList rows={browsers} emptyLabel="No sessions in this range." />
        </Panel>

        <Panel title="Landing pages" description="Where visits start">
          <BarList rows={entryPages} emptyLabel="No sessions in this range." />
        </Panel>

        <Panel title="Enquiry types" description="What people ask about">
          <BarList
            rows={enquiries.byInquiryType}
            emptyLabel="No enquiries in this range."
            valueLabel="enquiries"
            formatLabel={inquiryLabel}
          />
        </Panel>

        <Panel title="Enquiry pipeline" description="Current status of this range's enquiries">
          <BarList
            rows={[
              { label: "New", visitors: enquiries.byStatus.new, views: 0 },
              { label: "In progress", visitors: enquiries.byStatus.in_progress, views: 0 },
              { label: "Contacted", visitors: enquiries.byStatus.contacted, views: 0 },
              { label: "Archived", visitors: enquiries.byStatus.archived, views: 0 },
            ].filter((row) => row.visitors > 0)}
            emptyLabel="No enquiries in this range."
            valueLabel="enquiries"
          />
        </Panel>

        {hasCampaigns ? (
          <Panel title="Campaigns" description="From utm_campaign tags">
            <BarList rows={campaigns} emptyLabel="No tagged campaigns." />
          </Panel>
        ) : null}
      </div>

      <p className="mt-6 text-xs text-slate-muted">
        Visitors are counted with a daily-rotating, non-reversible hash, with no
        cookies and no cross-day tracking, so a multi-day range totals daily
        uniques. Enquiry counts come from the enquiries table itself, which is
        why they can exceed tracked conversions when a visitor has Do Not Track
        enabled.
      </p>
    </AdminShell>
  );
}
