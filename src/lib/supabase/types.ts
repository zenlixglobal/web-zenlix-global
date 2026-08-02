/**
 * Hand-maintained schema types, mirroring supabase/migrations/0001_init.sql.
 *
 * If you change the SQL, regenerate instead:
 *   npx supabase gen types typescript --project-id <ref> > src/lib/supabase/types.ts
 */

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

export type NewsletterSubscriber = {
  id: string;
  created_at: string;
  email: string;
  unsubscribed_at: string | null;
};

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
      newsletter_subscribers: {
        Row: NewsletterSubscriber;
        Insert: Pick<NewsletterSubscriber, "email">;
        Update: Partial<NewsletterSubscriber>;
        Relationships: NoRelationships;
      };
      admin_users: {
        Row: { user_id: string; email: string; created_at: string };
        Insert: { user_id: string; email: string };
        Update: Partial<{ user_id: string; email: string }>;
        Relationships: NoRelationships;
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
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
