import type { NextRequest } from "next/server";

import { getAdminUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Guard against an unbounded response if the list ever grows large. */
const MAX_ROWS = 50_000;

/**
 * Subscriber list as CSV, for importing into a mail platform.
 *
 * Admin-gated the same way as every other admin surface: `getAdminUser()` plus
 * RLS on the table, not the proxy redirect.
 */
export async function GET(request: NextRequest) {
  const user = await getAdminUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const filter = request.nextUrl.searchParams.get("filter") ?? "active";

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("newsletter_subscribers")
    .select("email, created_at, unsubscribed_at")
    .order("created_at", { ascending: false })
    .limit(MAX_ROWS);

  if (filter === "active") query = query.is("unsubscribed_at", null);
  if (filter === "unsubscribed") query = query.not("unsubscribed_at", "is", null);

  const { data, error } = await query;

  if (error) {
    console.error("[admin] subscriber export failed", error);
    return Response.json({ error: "Export failed" }, { status: 500 });
  }

  const rows = data ?? [];
  const csv = [
    "email,subscribed_at,unsubscribed_at,status",
    ...rows.map((row) =>
      [
        row.email,
        row.created_at,
        row.unsubscribed_at ?? "",
        row.unsubscribed_at ? "unsubscribed" : "active",
      ]
        .map(csvCell)
        .join(","),
    ),
  ].join("\r\n");

  const stamp = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="zenlix-subscribers-${filter}-${stamp}.csv"`,
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

/**
 * Quotes a CSV field, and neutralises formula injection.
 *
 * A value starting with `=`, `+`, `-` or `@` is executed as a formula when the
 * file is opened in Excel or Sheets. Email addresses are attacker-supplied via
 * a public form, so the leading apostrophe is not paranoia.
 */
function csvCell(value: string): string {
  const escaped = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${escaped.replace(/"/g, '""')}"`;
}
