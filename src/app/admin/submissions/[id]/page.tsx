import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import { AdminShell } from "@/components/admin/admin-shell";
import { NotesForm } from "@/components/admin/notes-form";
import { StatusBadge } from "@/components/admin/status-badge";
import { StatusForm } from "@/components/admin/status-form";
import { inquiryLabel } from "@/content/site";
import { requireAdmin } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ContactSubmission } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdmin();
  // Viewers read the enquiry in full; the status dropdown and notes box are
  // the only things their role withholds.
  const canWrite = can(user, "submissions:write");
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("contact_submissions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const submission = data as ContactSubmission;
  const fullName = `${submission.first_name} ${submission.last_name}`;

  return (
    <AdminShell user={user}>
      <Link
        href="/admin"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-muted transition-colors hover:text-navy-900"
      >
        <ArrowLeftIcon className="size-4" />
        Back to enquiries
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl">{fullName}</h1>
          <p className="mt-1 text-sm text-slate-muted">
            {submission.company} · {inquiryLabel(submission.inquiry_type)} ·{" "}
            {formatDate(submission.created_at)}
          </p>
        </div>
        {canWrite ? (
          <StatusForm id={submission.id} status={submission.status} />
        ) : (
          <StatusBadge status={submission.status} />
        )}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="border border-line bg-white p-5 sm:p-7">
          <h2 className="font-mono text-xs tracking-[0.08em] text-gold-500 uppercase">
            Message
          </h2>
          <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-ink">
            {submission.message}
          </p>

          <h2 className="mt-8 font-mono text-xs tracking-[0.08em] text-gold-500 uppercase">
            Internal notes
          </h2>
          <div className="mt-3">
            {canWrite ? (
              <NotesForm id={submission.id} notes={submission.admin_notes} />
            ) : (
              <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-slate-muted">
                {submission.admin_notes || "No notes yet."}
              </p>
            )}
          </div>
        </div>

        <aside className="border border-line bg-white p-5 sm:p-6">
          <h2 className="mb-4 font-mono text-xs tracking-[0.08em] text-gold-500 uppercase">
            Contact
          </h2>
          <dl className="grid gap-4 text-sm">
            <Detail label="Email">
              <a
                href={`mailto:${submission.email}`}
                className="break-all text-navy-900 underline-offset-4 hover:underline"
              >
                {submission.email}
              </a>
            </Detail>
            <Detail label="Phone">
              <a
                href={`tel:${submission.phone.replace(/[^\d+]/g, "")}`}
                className="text-navy-900 underline-offset-4 hover:underline"
              >
                {submission.phone}
              </a>
            </Detail>
            <Detail label="Company">{submission.company}</Detail>
            <Detail label="Notification email">
              {submission.email_sent_at
                ? `Sent ${formatDate(submission.email_sent_at)}`
                : "Not sent. Check RESEND_API_KEY / CONTACT_TO_EMAIL"}
            </Detail>
            {submission.source_page ? (
              <Detail label="Submitted from">{submission.source_page}</Detail>
            ) : null}
          </dl>

          <a
            href={`mailto:${submission.email}?subject=${encodeURIComponent(
              `Re: your enquiry with Zenlix Global`,
            )}`}
            className="mt-6 inline-flex h-11 w-full items-center justify-center bg-gold-500 px-5 text-sm font-semibold text-navy-900 transition-colors hover:bg-gold-300"
          >
            Reply by email
          </a>
        </aside>
      </div>
    </AdminShell>
  );
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs text-slate-muted">{label}</dt>
      <dd className="mt-0.5 text-ink">{children}</dd>
    </div>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
