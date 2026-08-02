import { getAdminUser } from "@/lib/auth";
import { fetchLiveSnapshot } from "@/lib/analytics/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Snapshot of who is on the site right now, polled by the live widget.
 *
 * Polling rather than SSE on purpose: an event stream would pin a serverless
 * function open for as long as the dashboard tab is, which costs far more than
 * a 6 req/min JSON poll from the handful of people who can see this page. The
 * data is a 10-second-granular count either way.
 *
 * Authorised the same way as every other admin surface — `getAdminUser()` plus
 * RLS on the underlying tables, not the proxy redirect.
 */
export async function GET() {
  const user = await getAdminUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();
  const snapshot = await fetchLiveSnapshot(supabase);

  return Response.json(snapshot, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
