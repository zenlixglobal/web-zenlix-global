<!-- BEGIN:nextjs-agent-rules -->

# Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

<!-- END:nextjs-agent-rules -->

## This project

Marketing site + enquiry admin for Zenlix Global, ported from a three-page static HTML/CSS build.

- **Copy lives in `src/content/site.ts`**, not in components. Text still wrapped in `[square brackets]` is a placeholder awaiting real content.
- **Brand tokens live in `src/app/globals.css`** under `@theme` (navy / gold / cream). Restyle there, not with one-off hex values.
- `src/proxy.ts` is Next 16's replacement for `middleware.ts`. It refreshes the Supabase session and does an *optimistic* redirect only — real authorization is `requireAdmin()` in `src/lib/auth.ts` plus RLS in `supabase/migrations/`.
- Public form writes go through the **service-role** client (`src/lib/supabase/admin.ts`) because the tables have no anon insert policy. Admin reads go through the **session** client (`src/lib/supabase/server.ts`) so RLS applies.
- Schema changes must be made in `supabase/migrations/*.sql` **and** mirrored in `src/lib/supabase/types.ts`.

## Analytics

First-party, cookie-free, and self-hosted in Supabase (`0002_analytics.sql`). There is no third-party script.

- **Ingest**: `AnalyticsTracker` (mounted in the `(site)` layout only — `/admin` is never tracked) beacons to `/api/analytics/collect`, which calls the `analytics_track()` RPC with the **service-role** client. Everything a visitor sends is attacker-controlled: validate in `src/lib/analytics/schema.ts`, and derive anything sensitive (country, device, visitor identity) server-side.
- **Identity** is `visitor_hash` — a salted SHA-256 of ip + UA + *UTC date*, rotated daily. Never store a raw IP or set a tracking cookie; that property is what keeps the site consent-banner-free. Consequence: "visitors" over a multi-day range means the sum of daily uniques.
- **Reads** go through SECURITY INVOKER RPCs (`analytics_overview`, `analytics_timeseries`, `analytics_breakdown`, `analytics_live`) called with the **session** client, so the admin RLS policies are the access boundary. Aggregate in SQL, not in TypeScript.
- **Live visitors** = sessions whose heartbeat is younger than `LIVE_WINDOW_SECONDS`. The dashboard polls `/api/admin/analytics/live`; don't convert it to SSE without accounting for the held-open serverless function.
- **Chart colours** are the `--color-chart-*` tokens in `globals.css`. They were snapped to steps that pass the colourblind/contrast checks against a white surface — re-run the validation before changing a hex, and assign slots in order.
- Day/week buckets are cut in `ANALYTICS_TIMEZONE`, so `formatBucket()` takes an explicit timezone. Never let it default to the ambient one: the traffic chart is a client component and the server would label the columns in UTC.
