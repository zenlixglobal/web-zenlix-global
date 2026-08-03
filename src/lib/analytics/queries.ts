import "server-only";

import {
  EMPTY_LIVE_SNAPSHOT,
  EMPTY_OVERVIEW,
  LIVE_WINDOW_SECONDS,
  type AnalyticsBreakdownRow,
  type AnalyticsLiveSnapshot,
  type AnalyticsOverview,
  type AnalyticsTimeseriesPoint,
  type BreakdownDimension,
} from "@/lib/analytics/types";
import type { ResolvedRange } from "@/lib/analytics/ranges";
import { reportingTimeZone } from "@/lib/analytics/ranges";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SubmissionStatus } from "@/lib/supabase/types";

/**
 * Read side of the analytics feature.
 *
 * Every query goes through the *session* client, so the admin RLS policies are
 * what grant access — the reporting functions themselves are SECURITY INVOKER.
 * A failure returns empty data and logs, rather than throwing: one broken panel
 * should not take the whole dashboard down.
 */

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export async function fetchOverview(
  supabase: SupabaseServerClient,
  range: ResolvedRange,
): Promise<AnalyticsOverview> {
  const { data, error } = await supabase.rpc("analytics_overview", {
    p_from: range.from,
    p_to: range.to,
  });

  if (error) {
    console.error("[analytics] overview failed", error);
    return EMPTY_OVERVIEW;
  }

  return { ...EMPTY_OVERVIEW, ...(data as AnalyticsOverview | null) };
}

export async function fetchTimeseries(
  supabase: SupabaseServerClient,
  range: ResolvedRange,
): Promise<AnalyticsTimeseriesPoint[]> {
  const { data, error } = await supabase.rpc("analytics_timeseries", {
    p_from: range.from,
    p_to: range.to,
    p_bucket: range.bucket,
    p_tz: reportingTimeZone(),
  });

  if (error) {
    console.error("[analytics] timeseries failed", error);
    return [];
  }

  return (data ?? []) as AnalyticsTimeseriesPoint[];
}

export async function fetchBreakdown(
  supabase: SupabaseServerClient,
  range: ResolvedRange,
  dimension: BreakdownDimension,
  limit = 8,
): Promise<AnalyticsBreakdownRow[]> {
  const { data, error } = await supabase.rpc("analytics_breakdown", {
    p_from: range.from,
    p_to: range.to,
    p_dimension: dimension,
    p_limit: limit,
  });

  if (error) {
    console.error(`[analytics] breakdown(${dimension}) failed`, error);
    return [];
  }

  return (data ?? []) as AnalyticsBreakdownRow[];
}

export async function fetchLiveSnapshot(
  supabase: SupabaseServerClient,
): Promise<AnalyticsLiveSnapshot> {
  const { data, error } = await supabase.rpc("analytics_live", {
    p_window_seconds: LIVE_WINDOW_SECONDS,
  });

  if (error) {
    console.error("[analytics] live failed", error);
    return EMPTY_LIVE_SNAPSHOT;
  }

  return { ...EMPTY_LIVE_SNAPSHOT, ...(data as AnalyticsLiveSnapshot | null) };
}

export type EnquiryReport = {
  /** Enquiries received inside the range, oldest first. */
  timestamps: string[];
  total: number;
  previousTotal: number;
  byStatus: Record<SubmissionStatus, number>;
  byInquiryType: AnalyticsBreakdownRow[];
};

const EMPTY_ENQUIRY_REPORT: EnquiryReport = {
  timestamps: [],
  total: 0,
  previousTotal: 0,
  byStatus: { new: 0, in_progress: 0, contacted: 0, archived: 0 },
  byInquiryType: [],
};

/**
 * Enquiry-side numbers, read straight from `contact_submissions` rather than
 * from the analytics tables.
 *
 * That is intentional: an enquiry from someone with Do Not Track on, or with
 * JavaScript blocked, still lands in the enquiries table but produces no
 * analytics session. This is the count that has to be right, so it comes from
 * the source of truth; `overview.conversions` is the (necessarily smaller)
 * *attributable* subset.
 *
 * Volumes here are orders of magnitude below page views, so one range scan and
 * an in-process fold beats maintaining another SQL function.
 */
export async function fetchEnquiryReport(
  supabase: SupabaseServerClient,
  range: ResolvedRange,
): Promise<EnquiryReport> {
  const previousFrom = new Date(
    new Date(range.from).getTime() -
      (new Date(range.to).getTime() - new Date(range.from).getTime()),
  ).toISOString();

  const submissions = await supabase
    .from("contact_submissions")
    .select("created_at, status, inquiry_type")
    .gte("created_at", previousFrom)
    .lt("created_at", range.to)
    .order("created_at", { ascending: true });

  if (submissions.error) {
    console.error("[analytics] enquiry report failed", submissions.error);
    return EMPTY_ENQUIRY_REPORT;
  }

  const report: EnquiryReport = {
    ...EMPTY_ENQUIRY_REPORT,
    timestamps: [],
    byStatus: { ...EMPTY_ENQUIRY_REPORT.byStatus },
  };

  const typeCounts = new Map<string, number>();

  for (const row of submissions.data ?? []) {
    if (row.created_at < range.from) {
      report.previousTotal += 1;
      continue;
    }

    report.total += 1;
    report.timestamps.push(row.created_at);
    report.byStatus[row.status] += 1;
    typeCounts.set(row.inquiry_type, (typeCounts.get(row.inquiry_type) ?? 0) + 1);
  }

  report.byInquiryType = [...typeCounts.entries()]
    .map(([label, visitors]) => ({ label, visitors, views: visitors }))
    .sort((a, b) => b.visitors - a.visitors || a.label.localeCompare(b.label))
    .slice(0, 8);

  return report;
}

/**
 * Buckets enquiry timestamps onto the buckets the traffic series already
 * returned, so both charts line up column-for-column without re-deriving the
 * (timezone- and DST-sensitive) bucket boundaries here.
 */
export function bucketEnquiries(
  timestamps: string[],
  buckets: AnalyticsTimeseriesPoint[],
): number[] {
  const counts = new Array<number>(buckets.length).fill(0);
  if (buckets.length === 0) return counts;

  const edges = buckets.map((point) => new Date(point.bucket).getTime());

  for (const timestamp of timestamps) {
    const at = new Date(timestamp).getTime();

    // Buckets are ordered, so walk back from the end to find the one that
    // contains this enquiry.
    for (let index = edges.length - 1; index >= 0; index -= 1) {
      if (at >= edges[index]!) {
        counts[index] += 1;
        break;
      }
    }
  }

  return counts;
}
