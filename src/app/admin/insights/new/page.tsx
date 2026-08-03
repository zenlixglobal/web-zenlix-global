import type { Metadata } from "next";
import Link from "next/link";

import { AdminShell } from "@/components/admin/admin-shell";
import { InsightForm } from "@/components/admin/insight-form";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "New article" };

export const dynamic = "force-dynamic";

export default async function NewInsightPage() {
  const user = await requireAdmin();

  return (
    <AdminShell user={user}>
      <div className="mb-6">
        <Link
          href="/admin/insights"
          className="text-[13px] text-slate-muted underline-offset-4 hover:text-navy-900 hover:underline"
        >
          <span aria-hidden>&larr;</span> Insights
        </Link>
        <h1 className="mt-2 text-2xl sm:text-3xl">New article</h1>
        <p className="mt-1 text-sm text-slate-muted">
          Saved as a draft unless you tick Published.
        </p>
      </div>

      <div className="max-w-4xl">
        <InsightForm />
      </div>
    </AdminShell>
  );
}
