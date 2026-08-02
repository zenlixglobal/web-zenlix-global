import type { Metadata } from "next";
import { DownloadIcon, SearchIcon } from "lucide-react";

import { AdminShell } from "@/components/admin/admin-shell";
import { FilterLink } from "@/components/admin/filter-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatNumber } from "@/lib/analytics/format";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { NewsletterSubscriber } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Subscribers" };

// Subscriber emails are personal data — never cache this page.
export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

const FILTERS = {
  active: "Active",
  unsubscribed: "Unsubscribed",
  all: "All",
} as const;

type FilterKey = keyof typeof FILTERS;

function isFilter(value: string | undefined): value is FilterKey {
  return value !== undefined && value in FILTERS;
}

/**
 * The audience behind the footer's "Industry Insights" signup — every address
 * captured by `newsletter_subscribers`.
 *
 * Read-only by design: `0001_init.sql` grants admins SELECT on this table and
 * nothing else, so the page offers export rather than editing. Removing an
 * address is a deliberate, auditable act that belongs in SQL, not behind a
 * button that a mis-click can fire.
 */
export default async function SubscribersPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; q?: string; page?: string }>;
}) {
  const user = await requireAdmin();
  const { filter, q, page } = await searchParams;

  const activeFilter: FilterKey = isFilter(filter) ? filter : "active";
  const search = (q ?? "").trim().slice(0, 200);
  const pageIndex = Math.max(0, Number.parseInt(page ?? "0", 10) || 0);

  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("newsletter_subscribers")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(pageIndex * PAGE_SIZE, pageIndex * PAGE_SIZE + PAGE_SIZE - 1);

  if (activeFilter === "active") query = query.is("unsubscribed_at", null);
  if (activeFilter === "unsubscribed") query = query.not("unsubscribed_at", "is", null);
  // `%` and `_` are PostgREST wildcards; escape so a literal search stays literal.
  if (search) query = query.ilike("email", `%${search.replace(/[%_]/g, "\\$&")}%`);

  const [list, stats] = await Promise.all([
    query,
    fetchSubscriberStats(supabase),
  ]);

  const subscribers = (list.data ?? []) as NewsletterSubscriber[];
  const matched = list.count ?? 0;

  const hasNextPage = (pageIndex + 1) * PAGE_SIZE < matched;
  const buildHref = (overrides: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams();
    const next = { filter: activeFilter, q: search, page: pageIndex, ...overrides };
    if (next.filter && next.filter !== "active") params.set("filter", String(next.filter));
    if (next.q) params.set("q", String(next.q));
    if (next.page) params.set("page", String(next.page));
    const qs = params.toString();
    return qs ? `/admin/subscribers?${qs}` : "/admin/subscribers";
  };

  return (
    <AdminShell user={user}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl">Subscribers</h1>
          <p className="mt-1 text-sm text-slate-muted">
            Industry Insights — hiring trends, salary guides, and top-talent alerts.
          </p>
        </div>

        <Button asChild variant="outline" size="lg" className="gap-2">
          <a href={`/api/admin/subscribers/export?filter=${activeFilter}`} download>
            <DownloadIcon className="size-4" />
            Export CSV
          </a>
        </Button>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Active subscribers" value={stats.active} emphasis />
        <Stat label="Joined in last 30 days" value={stats.recent} />
        <Stat label="Unsubscribed" value={stats.unsubscribed} />
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <nav className="flex flex-wrap gap-2" aria-label="Filter subscribers">
          {(Object.keys(FILTERS) as FilterKey[]).map((key) => (
            <FilterLink
              key={key}
              active={activeFilter === key}
              href={buildHref({ filter: key, page: 0 })}
            >
              {FILTERS[key]}
            </FilterLink>
          ))}
        </nav>

        {/* A plain GET form: the search term lands in the URL, so a filtered
            view is shareable and survives a refresh. */}
        <form action="/admin/subscribers" className="flex items-center gap-2">
          {activeFilter !== "active" ? (
            <input type="hidden" name="filter" value={activeFilter} />
          ) : null}
          <div className="relative">
            <SearchIcon
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-slate-muted"
            />
            <Input
              type="search"
              name="q"
              defaultValue={search}
              placeholder="Search email…"
              aria-label="Search subscribers by email"
              className="h-9 w-56 pl-8"
            />
          </div>
          <Button type="submit" variant="outline" size="lg">
            Search
          </Button>
        </form>
      </div>

      {list.error ? (
        <p className="border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Could not load subscribers: {list.error.message}
        </p>
      ) : subscribers.length === 0 ? (
        <p className="border border-line bg-white px-4 py-10 text-center text-sm text-slate-muted">
          {search
            ? `No subscribers match “${search}”.`
            : "No subscribers yet. Signups from the site footer appear here."}
        </p>
      ) : (
        <>
          <div className="overflow-x-auto border border-line bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Subscribed</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscribers.map((subscriber) => (
                  <TableRow key={subscriber.id}>
                    <TableCell className="font-medium text-navy-900">
                      <a
                        href={`mailto:${subscriber.email}`}
                        className="underline-offset-4 hover:underline"
                      >
                        {subscriber.email}
                      </a>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-slate-muted">
                      {formatDate(subscriber.created_at)}
                    </TableCell>
                    <TableCell>
                      {subscriber.unsubscribed_at ? (
                        <Badge
                          variant="outline"
                          className="border-line bg-muted font-mono text-[11px] text-slate-muted uppercase"
                          title={`Unsubscribed ${formatDate(subscriber.unsubscribed_at)}`}
                        >
                          Unsubscribed
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-emerald-600/30 bg-emerald-600/10 font-mono text-[11px] text-emerald-800 uppercase"
                        >
                          Active
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex items-center justify-between gap-4 text-sm text-slate-muted">
            <span>
              Showing {formatNumber(pageIndex * PAGE_SIZE + 1)}–
              {formatNumber(pageIndex * PAGE_SIZE + subscribers.length)} of{" "}
              {formatNumber(matched)}
            </span>
            <div className="flex gap-2">
              {pageIndex > 0 ? (
                <FilterLink active={false} href={buildHref({ page: pageIndex - 1 })}>
                  Previous
                </FilterLink>
              ) : null}
              {hasNextPage ? (
                <FilterLink active={false} href={buildHref({ page: pageIndex + 1 })}>
                  Next
                </FilterLink>
              ) : null}
            </div>
          </div>
        </>
      )}
    </AdminShell>
  );
}

/**
 * Counted in the database with `head: true`, so no rows cross the wire — the
 * old version pulled every subscriber back just to length-check three arrays.
 *
 * Lives outside the component because it reads the clock, which a component
 * body may not do.
 */
async function fetchSubscriberStats(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
) {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const table = () =>
    supabase.from("newsletter_subscribers").select("id", {
      count: "exact",
      head: true,
    });

  const [active, unsubscribed, recent] = await Promise.all([
    table().is("unsubscribed_at", null),
    table().not("unsubscribed_at", "is", null),
    table().gte("created_at", since),
  ]);

  return {
    active: active.count ?? 0,
    unsubscribed: unsubscribed.count ?? 0,
    recent: recent.count ?? 0,
  };
}

function Stat({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: number;
  emphasis?: boolean;
}) {
  return (
    <div
      className={cn(
        "border border-line bg-white px-4 py-3.5",
        emphasis && "border-navy-900/25 bg-navy-900/3",
      )}
    >
      <p className="font-mono text-[11px] tracking-[0.06em] text-slate-muted uppercase">
        {label}
      </p>
      <p className="mt-2 font-heading text-2xl leading-none font-semibold text-navy-900">
        {formatNumber(value)}
      </p>
    </div>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/London",
  }).format(new Date(value));
}
