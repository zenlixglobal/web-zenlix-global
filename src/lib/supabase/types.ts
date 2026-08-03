/**
 * Hand-maintained schema types, mirroring supabase/migrations/0001_init.sql.
 *
 * If you change the SQL, regenerate instead:
 *   npx supabase gen types typescript --project-id <ref> > src/lib/supabase/types.ts
 */

import type {
  AnalyticsBreakdownRow,
  AnalyticsLiveSnapshot,
  AnalyticsOverview,
  AnalyticsTimeseriesPoint,
  BreakdownDimension,
  TimeBucket,
} from "@/lib/analytics/types";

export const SUBMISSION_STATUSES = [
  "new",
  "in_progress",
  "contacted",
  "archived",
] as const;

export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export type ContactSubmission = {
  id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company: string;
  inquiry_type: string;
  message: string;
  status: SubmissionStatus;
  admin_notes: string | null;
  source_page: string | null;
  user_agent: string | null;
  email_sent_at: string | null;
};

/** Mirrors supabase/migrations/0002_analytics.sql. */
export type AnalyticsSession = {
  id: string;
  started_at: string;
  last_seen_at: string;
  visitor_hash: string;
  entry_path: string;
  current_path: string;
  page_view_count: number;
  event_count: number;
  referrer_host: string | null;
  referrer_url: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  country: string | null;
  device_type: string;
  browser: string | null;
  os: string | null;
  screen_width: number | null;
  converted_at: string | null;
};

export type AnalyticsPageView = {
  id: number;
  session_id: string;
  created_at: string;
  path: string;
  title: string | null;
  referrer_host: string | null;
  duration_ms: number | null;
};

export type AnalyticsEvent = {
  id: number;
  session_id: string;
  created_at: string;
  name: string;
  path: string | null;
  props: Record<string, unknown>;
};

/** Mirrors supabase/migrations/0003_insights.sql. */
export type InsightArticle = {
  id: string;
  created_at: string;
  updated_at: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  body: string;
  image_url: string | null;
  image_alt: string | null;
  author: string | null;
  published: boolean;
  published_at: string | null;
};

/** Fields the admin form owns; the rest are set by the database. */
export type InsightArticleInput = Pick<
  InsightArticle,
  | "slug"
  | "title"
  | "category"
  | "excerpt"
  | "body"
  | "image_url"
  | "image_alt"
  | "author"
  | "published"
>;

/** None of these tables have foreign-key joins the client needs to traverse. */
type NoRelationships = [];

export type Database = {
  public: {
    Tables: {
      contact_submissions: {
        Row: ContactSubmission;
        Insert: Omit<
          ContactSubmission,
          "id" | "created_at" | "status" | "admin_notes" | "email_sent_at"
        > &
          Partial<
            Pick<ContactSubmission, "status" | "admin_notes" | "email_sent_at">
          >;
        Update: Partial<ContactSubmission>;
        Relationships: NoRelationships;
      };
      admin_users: {
        Row: { user_id: string; email: string; created_at: string };
        Insert: { user_id: string; email: string };
        Update: Partial<{ user_id: string; email: string }>;
        Relationships: NoRelationships;
      };
      // Analytics rows are only ever written by `analytics_track()`, so the
      // Insert/Update shapes are deliberately `never`.
      analytics_sessions: {
        Row: AnalyticsSession;
        Insert: never;
        Update: never;
        Relationships: NoRelationships;
      };
      analytics_page_views: {
        Row: AnalyticsPageView;
        Insert: never;
        Update: never;
        Relationships: NoRelationships;
      };
      analytics_events: {
        Row: AnalyticsEvent;
        Insert: never;
        Update: never;
        Relationships: NoRelationships;
      };
      insight_articles: {
        Row: InsightArticle;
        Insert: InsightArticleInput;
        Update: Partial<InsightArticleInput>;
        Relationships: NoRelationships;
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      analytics_track: {
        Args: { p_payload: Record<string, unknown> };
        Returns: undefined;
      };
      analytics_overview: {
        Args: { p_from: string; p_to: string };
        Returns: AnalyticsOverview;
      };
      analytics_timeseries: {
        Args: {
          p_from: string;
          p_to: string;
          p_bucket: TimeBucket;
          p_tz: string;
        };
        Returns: AnalyticsTimeseriesPoint[];
      };
      analytics_breakdown: {
        Args: {
          p_from: string;
          p_to: string;
          p_dimension: BreakdownDimension;
          p_limit: number;
        };
        Returns: AnalyticsBreakdownRow[];
      };
      analytics_live: {
        Args: { p_window_seconds: number };
        Returns: AnalyticsLiveSnapshot;
      };
      analytics_prune: { Args: { p_keep_days: number }; Returns: number };
    };
    Enums: {
      submission_status: SubmissionStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};

export const STATUS_LABELS: Record<SubmissionStatus, string> = {
  new: "New",
  in_progress: "In progress",
  contacted: "Contacted",
  archived: "Archived",
};
