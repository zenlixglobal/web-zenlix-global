/**
 * Environment access.
 *
 * Reads are lazy and never happen at module scope, so a missing variable is a
 * clear runtime error on the one request that needs it rather than a build
 * failure or — worse — a silently broken form in production.
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. See .env.example.`,
    );
  }
  return value;
}

export const env = {
  /** Public Supabase project URL. */
  supabaseUrl: () =>
    required(
      "NEXT_PUBLIC_SUPABASE_URL",
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    ),
  /** Public (anon) Supabase key — safe to expose, gated by RLS. */
  supabaseAnonKey: () =>
    required(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
  /** Server-only service-role key. NEVER import this into a client component. */
  supabaseServiceRoleKey: () =>
    required(
      "SUPABASE_SERVICE_ROLE_KEY",
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    ),

  /** SMTP host. Defaults to Gmail. */
  smtpHost: () => process.env.SMTP_HOST ?? "smtp.gmail.com",
  /** SMTP port. 465 is implicit TLS, 587 is STARTTLS. */
  smtpPort: () => Number(process.env.SMTP_PORT ?? 465),
  /** Full Gmail address the app authenticates as. */
  smtpUser: () => process.env.SMTP_USER,
  /** Gmail App Password (not the account password). */
  smtpPassword: () => process.env.SMTP_PASSWORD,
  /**
   * Sender header, e.g. "Zenlix Global <notifications@zenlixglobal.com>".
   *
   * Gmail rewrites this to the authenticated account unless the address is a
   * verified "Send mail as" alias, so it falls back to SMTP_USER.
   */
  contactFromEmail: () =>
    process.env.CONTACT_FROM_EMAIL ?? process.env.SMTP_USER ?? "",
  /** Comma-separated inbox(es) that receive new enquiries. */
  contactToEmails: () =>
    (process.env.CONTACT_TO_EMAIL ?? "")
      .split(",")
      .map((address) => address.trim())
      .filter(Boolean),
  /**
   * Comma-separated inbox(es) copied on the visitor's acknowledgement.
   *
   * Visible to the visitor — it is a Cc, not a Bcc — so only put addresses here
   * that are already published on the site.
   */
  contactCcEmails: () =>
    (process.env.CONTACT_CC_EMAIL ?? "")
      .split(",")
      .map((address) => address.trim())
      .filter(Boolean),

  siteUrl: () => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;

/** True when Supabase is configured; lets pages degrade instead of crashing. */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/** True when outbound email is configured. */
export function isEmailConfigured(): boolean {
  return Boolean(
    process.env.SMTP_USER &&
      process.env.SMTP_PASSWORD &&
      env.contactToEmails().length,
  );
}
