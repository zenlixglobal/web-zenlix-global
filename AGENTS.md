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

## Admin roles and permissions

Two layers, defined in `0004_admin_roles.sql` and mirrored in `src/lib/permissions.ts`.

**Role** (`admin_users.role`) is the hierarchy — **owner** > **admin** > **editor** > **viewer** — and supplies a *default* feature set. **Capabilities** are the features themselves, individually grantable per person in `admin_user_permissions`. `admin_can(capability)` resolves the two and is the question every RLS policy asks; `resolveCapabilities()` is the TypeScript twin, resolved once per request into `AdminUser.capabilities`.

**Access levels** (`ACCESS_AREAS`) are the third piece, and UI-only: four areas (Enquiries, Insights, Analytics, Team), each an ordered ladder where every rung contains the one below. They exist so a person's access is one dropdown per area instead of ten checkboxes. Because the ladders are nested and exhaustive, the selects can express every state the capability model can hold and none of the incoherent ones — which is why `users:manage` implies `audit:read` (otherwise Team is two independent switches, not a ladder). **A capability not on any rung is unreachable from the UI**, so adding one means editing `ACCESS_AREAS` too.

- **`permissions.ts` is not the boundary** — RLS and the triggers in `0004` are. Anything added there has to hold in SQL too, or it is decoration. It is deliberately importable from client components; a list of feature names holds no secrets.
- **A sparse override table.** A row exists only where someone was explicitly granted or denied a feature; absent means "follow the role", so changing what Editor means updates every un-adjusted editor. Choosing a level that already matches the role deletes the rows rather than writing them, which is what keeps that person tracking the preset.
- **Changing someone's role wipes their overrides**, because the role is presented as a preset ("Start from"). Without that, picking Viewer could leave a granted `insights:write` behind from when they were an Editor.
- **Implications are resolved, not stored**: `insights:delete` ⊃ `insights:write` ⊃ `insights:read`, `users:manage` ⊃ `users:read`. Both `capability_implied_by()` and the `IMPLIES` map must agree.
- **Two escalation rules**: you may only act on someone you outrank (`can_manage_admin`/`can_manage_user`), and **you cannot grant a capability you do not hold**. Without the second, `users:manage` is a bootstrap into every other feature. Revoking is deliberately unrestricted.
- **Owners are absolute.** `admin_can()` short-circuits to true for them and `admin_permissions_guard` refuses to store an override on one — that is the escape hatch that stops a project locking itself out of its own settings.
- Nobody changes their own role, permissions, or status, and the last active owner cannot be demoted, disabled, or deleted. Triggers refuse it however the write arrives — including from the SQL editor.
- Server Actions call `authorize(capability)` (returns a message); pages call `requireCapability()` (redirects to `/admin?denied=1`). `requireAdmin()` alone only means "is on the team".
- Suspending sets `disabled_at`; `is_admin()` ignores those rows. Removing deletes the `admin_users` row and deliberately leaves the Supabase Auth login alone.
- A signed-in user who is *not* on the team is the one loop risk: `requireAdmin()` sends them to `/admin/login?denied=1` and `proxy.ts` skips its "already signed in" bounce when that param is present. Don't remove one without the other.
- New accounts are created with the service-role client, but the `admin_users` insert that grants access uses the **session** client on purpose — that is what subjects the grant to the caller's own rank.
- `admin_audit_log` is append-only by construction (no update/delete policy) and the insert policy pins `actor_id` to `auth.uid()`. Write to it with `recordAudit()`, which never throws.
- `0004` **re-points the policies from 0001–0003** at `admin_can()`. They were written against `is_admin()`, which is true for a viewer as much as an owner — leaving them would make the per-feature toggles cosmetic. If you add a table, gate it on a capability, not on `is_admin()`.

## Analytics

First-party, cookie-free, and self-hosted in Supabase (`0002_analytics.sql`). There is no third-party script.

- **Ingest**: `AnalyticsTracker` (mounted in the `(site)` layout only — `/admin` is never tracked) beacons to `/api/analytics/collect`, which calls the `analytics_track()` RPC with the **service-role** client. Everything a visitor sends is attacker-controlled: validate in `src/lib/analytics/schema.ts`, and derive anything sensitive (country, device, visitor identity) server-side.
- **Identity** is `visitor_hash` — a salted SHA-256 of ip + UA + *UTC date*, rotated daily. Never store a raw IP or set a tracking cookie; that property is what keeps the site consent-banner-free. Consequence: "visitors" over a multi-day range means the sum of daily uniques.
- **Reads** go through SECURITY INVOKER RPCs (`analytics_overview`, `analytics_timeseries`, `analytics_breakdown`, `analytics_live`) called with the **session** client, so the admin RLS policies are the access boundary. Aggregate in SQL, not in TypeScript.
- **Live visitors** = sessions whose heartbeat is younger than `LIVE_WINDOW_SECONDS`. The dashboard polls `/api/admin/analytics/live`; don't convert it to SSE without accounting for the held-open serverless function.
- **Chart colours** are the `--color-chart-*` tokens in `globals.css`. They were snapped to steps that pass the colourblind/contrast checks against a white surface — re-run the validation before changing a hex, and assign slots in order.
- Day/week buckets are cut in `ANALYTICS_TIMEZONE`, so `formatBucket()` takes an explicit timezone. Never let it default to the ambient one: the traffic chart is a client component and the server would label the columns in UTC.
