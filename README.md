# Zenlix Global

Marketing site and enquiry admin for Zenlix Global, rebuilt from the original
static HTML/CSS on Next.js 16 (App Router), Tailwind CSS v4 and shadcn/ui.

- **Public site** — `/`, `/about`, `/contact`, `/privacy`, `/terms`
- **Admin** — `/admin`, gated by Supabase Auth, lists and triages contact
  enquiries

Contact submissions are saved to Supabase **and** emailed to the team.

---

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill it in — see below
npm run dev                  # http://localhost:3000
```

The site renders fine without any environment variables; only the contact form,
newsletter signup and `/admin` need them.

| Script          | Purpose                    |
| --------------- | -------------------------- |
| `npm run dev`   | Dev server (Turbopack)     |
| `npm run build` | Production build           |
| `npm start`     | Serve the production build |
| `npm run lint`  | ESLint                     |

---

## 1. Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql). It
   creates `contact_submissions`, `newsletter_subscribers` and `admin_users`,
   and turns on row-level security for all three.
3. Copy **Project Settings → API** values into `.env.local`:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```

   `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS. Keep it server-side — never rename
   it with a `NEXT_PUBLIC_` prefix.

### Creating an admin user

Signing in is not enough; the user must also be on the allow-list.

1. **Authentication → Users → Add user**, with an email and password.
2. Copy that user's UUID, then in the SQL editor:

   ```sql
   insert into public.admin_users (user_id, email)
   values ('<uuid>', 'you@zenlixglobal.com');
   ```

3. Sign in at `/admin/login`.

Anyone authenticated but *not* in `admin_users` is bounced back to the login
page, and RLS returns them no rows even if they hit the API directly.

## 2. Email setup (Gmail SMTP)

1. On the sending Google account, turn on 2-Step Verification, then create an
   App Password at
   [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
   The 16-character password it gives you is what SMTP authenticates with — the
   normal account password will be rejected.
2. Add to `.env.local`:

   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_USER=notifications@zenlixglobal.com
   SMTP_PASSWORD=abcd efgh ijkl mnop
   CONTACT_FROM_EMAIL="Zenlix Global <notifications@zenlixglobal.com>"
   CONTACT_TO_EMAIL=careers@zenlixglobal.com   # comma-separate for several
   ```

`CONTACT_FROM_EMAIL` must be `SMTP_USER` or an alias verified under Gmail →
Settings → Accounts → "Send mail as"; otherwise Gmail rewrites the From header
to the authenticated account. Note Gmail's relay caps sending at a few hundred
messages a day, which is ample for enquiries but not for bulk mail.

Leave `SMTP_USER` / `SMTP_PASSWORD` empty in development: submissions still save
to Supabase and the skipped email is logged to the console. Email is best-effort
by design — if the mail server is down the enquiry is still stored, and the admin
list flags any row that was never emailed.

---

## Editing content

**All site copy lives in [`src/content/site.ts`](src/content/site.ts)** — nav,
hero, services, testimonials, footer, contact details. Text still wrapped in
`[square brackets]` is a placeholder carried over from the original build.
Search that file for `[` to find everything still outstanding:

- phone number, email, office address
- the three hero stats
- client testimonials and the three insight articles
- founder story on `/about`
- `/privacy` and `/terms` — outlines only, have them reviewed by counsel

Brand colours and fonts live in the `@theme` block at the top of
[`src/app/globals.css`](src/app/globals.css). Change them there and the whole
site rebrands.

### Images

The hero, advantage and insight photos still point at Unsplash. Drop your own
into `public/`, update the `src` values in `src/content/site.ts`, then remove
the `images.remotePatterns` entry from `next.config.ts`.

### The logo

`public/zenlix-icon.png` is the supplied artwork: the gold monogram on a flat
navy plate. That plate is `rgb(19,42,73)` — a few shades off the site navy
`#0a1b33` — so using it directly showed a visible block behind the mark. The
derived assets have the plate keyed out and the edges un-mixed, so the mark
composites cleanly onto any background:

| File                       | Used by                              |
| -------------------------- | ------------------------------------ |
| `public/zenlix-mark.png`   | header, mobile drawer, footer, admin |
| `public/zenlix-mark-og.png`| social share card                    |
| `src/app/icon.png`         | favicon (on navy, for contrast)      |
| `src/app/apple-icon.png`   | iOS home screen                      |

If the logo ever changes, drop the new artwork at `public/zenlix-icon.png` and
regenerate all four:

```bash
pip install Pillow
python3 scripts/extract-logo.py
```

If you get a version with a genuinely transparent background, you can skip that
and just overwrite `public/zenlix-mark.png` directly.

---

## Project structure

```
src/
  app/
    (site)/              marketing pages — share the header/footer shell
    admin/               enquiry dashboard (never indexed, never cached)
    actions/contact.ts   public form Server Actions
    opengraph-image.tsx  social share card
    sitemap.ts robots.ts
  components/
    ui/                  shadcn primitives (yours to edit)
    site/ home/ contact/ admin/
  content/site.ts        ← all editable copy
  lib/
    auth.ts              requireAdmin() — the authorization boundary
    supabase/            browser / session / service-role clients
    email/               Gmail SMTP notifications
    rate-limit.ts validation/
  proxy.ts               Next 16's replacement for middleware.ts
supabase/migrations/     database schema + RLS
```

## Security notes

- The contact and newsletter tables have **no anonymous insert policy**. Public
  writes go through a Server Action using the service-role key, so validation,
  the honeypot and rate limiting all run before anything is stored.
- `requireAdmin()` is called in every admin page *and* every admin Server
  Action, because layouts don't re-run on client navigation and never run for
  actions.
- `src/proxy.ts` only does an optimistic cookie check for redirects. RLS is the
  real boundary.

## Deploying

Set every variable from `.env.example` in your host's dashboard, with
`NEXT_PUBLIC_SITE_URL` pointing at the live domain — it drives canonical URLs,
the sitemap, OG tags and the admin links inside notification emails. Then:

```bash
npm run build && npm start
```

### Note on rate limiting

`src/lib/rate-limit.ts` keeps its counters in memory, which is per-instance. On
a single long-lived server that's enough to stop casual form spam. If you deploy
serverless or scale horizontally, swap the store for Upstash Redis — the
function signature is already the right shape.
# web-zenlix-global
