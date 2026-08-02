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
