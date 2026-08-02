import Link from "next/link";
import { MailWarningIcon } from "lucide-react";

import { AdminShell } from "@/components/admin/admin-shell";
import { StatusBadge } from "@/components/admin/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { inquiryLabel } from "@/content/site";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  STATUS_LABELS,
  SUBMISSION_STATUSES,
  type ContactSubmission,
  type SubmissionStatus,
} from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

// Enquiry data must never be served from a static or shared cache.
export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

function isStatus(value: string | undefined): value is SubmissionStatus {
  return (
    value !== undefined &&
    (SUBMISSION_STATUSES as readonly string[]).includes(value)
  );
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requireAdmin();
  const { status } = await searchParams;
  const activeStatus = isStatus(status) ? status : undefined;

  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("contact_submissions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (activeStatus) query = query.eq("status", activeStatus);

  const { data, error } = await query;
  const submissions = (data ?? []) as ContactSubmission[];

  return (
    <AdminShell user={user}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl">Enquiries</h1>
          <p className="mt-1 text-sm text-slate-muted">
            {activeStatus
              ? `Showing ${STATUS_LABELS[activeStatus].toLowerCase()} enquiries`
              : "Most recent submissions from the contact form"}
            {submissions.length === PAGE_SIZE ? ` (latest ${PAGE_SIZE})` : ""}
          </p>
        </div>
      </div>

      <nav className="mb-5 flex flex-wrap gap-2" aria-label="Filter by status">
        <FilterLink active={!activeStatus} href="/admin">
          All
        </FilterLink>
        {SUBMISSION_STATUSES.map((value) => (
          <FilterLink
            key={value}
            active={activeStatus === value}
            href={`/admin?status=${value}`}
          >
            {STATUS_LABELS[value]}
          </FilterLink>
        ))}
      </nav>

      {error ? (
        <p className="border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Could not load enquiries: {error.message}
        </p>
      ) : submissions.length === 0 ? (
        <p className="border border-line bg-white px-4 py-10 text-center text-sm text-slate-muted">
          No enquiries yet.
        </p>
      ) : (
        <>
          {/* Table on desktop… */}
          <div className="hidden overflow-x-auto border border-line bg-white md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Received</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Inquiry</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell className="whitespace-nowrap text-slate-muted">
                      {formatDate(submission.created_at)}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/submissions/${submission.id}`}
                        className="font-medium text-navy-900 underline-offset-4 hover:underline"
                      >
                        {submission.first_name} {submission.last_name}
                      </Link>
                      <span className="block text-xs text-slate-muted">
                        {submission.email}
                      </span>
                    </TableCell>
                    <TableCell>{submission.company}</TableCell>
                    <TableCell className="text-slate-muted">
                      {inquiryLabel(submission.inquiry_type)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={submission.status} />
                        {submission.email_sent_at ? null : (
                          <span
                            title="No notification email was sent for this enquiry"
                            className="text-gold-500"
                          >
                            <MailWarningIcon className="size-4" />
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* …stacked cards on phones. */}
          <ul className="grid gap-3 md:hidden">
            {submissions.map((submission) => (
              <li key={submission.id}>
                <Link
                  href={`/admin/submissions/${submission.id}`}
                  className="block border border-line bg-white p-4 transition-colors hover:border-gold-500"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-medium text-navy-900">
                      {submission.first_name} {submission.last_name}
                    </span>
                    <StatusBadge status={submission.status} />
                  </div>
                  <p className="mt-1 text-sm text-slate-muted">
                    {submission.company}
                  </p>
                  <p className="mt-2 text-xs text-slate-muted">
                    {inquiryLabel(submission.inquiry_type)} ·{" "}
                    {formatDate(submission.created_at)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </AdminShell>
  );
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "border px-3 py-1.5 text-sm transition-colors",
        active
          ? "border-navy-900 bg-navy-900 text-white"
          : "border-line bg-white text-slate-muted hover:border-navy-900 hover:text-navy-900",
      )}
    >
      {children}
    </Link>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
