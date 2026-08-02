-- ============================================================================
-- Zenlix Global — first-party web analytics
--
-- Run after 0001_init.sql. Adds cookie-free traffic analytics plus the live
-- "who's on the site right now" view used by /admin/analytics.
--
-- Design notes
--   * Visitors are identified by `visitor_hash`, a salted SHA-256 of
--     (ip + user-agent + UTC date) computed in the app. It is rotated daily and
--     is never reversible, so no raw IP or cookie is stored. "Visitors" over a
--     multi-day range therefore means "sum of daily uniques", the same
--     definition Plausible/Fathom use.
--   * All writes go through `analytics_track()` with the service-role key.
--     The tables have no INSERT policy, so the browser can never write here
--     directly, and every field is length-capped inside the function.
--   * All reads go through SECURITY INVOKER functions, so the admin RLS
--     policies below — not the function — decide who sees the data.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Sessions — one row per visit. Also doubles as the live-visitor table:
-- `last_seen_at` is bumped by a heartbeat every 15s while a tab is visible.
-- ---------------------------------------------------------------------------
create table if not exists public.analytics_sessions (
  id              uuid primary key,
  started_at      timestamptz not null default now(),
  last_seen_at    timestamptz not null default now(),
  visitor_hash    text        not null,
  entry_path      text        not null,
  current_path    text        not null,
  page_view_count integer     not null default 0,
  event_count     integer     not null default 0,
  referrer_host   text,
  referrer_url    text,
  utm_source      text,
  utm_medium      text,
  utm_campaign    text,
  utm_term        text,
  utm_content     text,
  country         text,
  device_type     text        not null default 'unknown',
  browser         text,
  os              text,
  screen_width    integer,
  -- Set when the visitor submits the contact form, which is what makes a
  -- session a conversion.
  converted_at    timestamptz
);

-- The live query ("last_seen_at within N seconds") runs every 10s, so it gets
-- its own descending index.
create index if not exists analytics_sessions_last_seen_idx
  on public.analytics_sessions (last_seen_at desc);
create index if not exists analytics_sessions_started_idx
  on public.analytics_sessions (started_at desc);
create index if not exists analytics_sessions_visitor_idx
  on public.analytics_sessions (visitor_hash, started_at desc);

-- ---------------------------------------------------------------------------
-- Page views — one row per rendered route.
-- `duration_ms` is filled in later, when the visitor leaves that page.
-- ---------------------------------------------------------------------------
create table if not exists public.analytics_page_views (
  id            bigint generated always as identity primary key,
  session_id    uuid        not null
                  references public.analytics_sessions (id) on delete cascade,
  created_at    timestamptz not null default now(),
  path          text        not null,
  title         text,
  referrer_host text,
  duration_ms   integer
);

create index if not exists analytics_page_views_created_idx
  on public.analytics_page_views (created_at desc);
create index if not exists analytics_page_views_path_idx
  on public.analytics_page_views (path, created_at desc);
-- Partial index: the "close the previous page view" update only ever looks at
-- rows whose duration is still unknown.
create index if not exists analytics_page_views_open_idx
  on public.analytics_page_views (session_id, created_at desc)
  where duration_ms is null;

-- ---------------------------------------------------------------------------
-- Events — named interactions (contact_submitted, newsletter_subscribed, …).
-- ---------------------------------------------------------------------------
create table if not exists public.analytics_events (
  id         bigint generated always as identity primary key,
  session_id uuid        not null
               references public.analytics_sessions (id) on delete cascade,
  created_at timestamptz not null default now(),
  name       text        not null,
  path       text,
  props      jsonb       not null default '{}'::jsonb
);

create index if not exists analytics_events_name_idx
  on public.analytics_events (name, created_at desc);
create index if not exists analytics_events_session_idx
  on public.analytics_events (session_id);

-- ---------------------------------------------------------------------------
-- RLS — admins read, nobody writes. Writes arrive via the service-role key,
-- which bypasses RLS, so the absence of an INSERT policy is deliberate.
-- ---------------------------------------------------------------------------
alter table public.analytics_sessions   enable row level security;
alter table public.analytics_page_views enable row level security;
alter table public.analytics_events     enable row level security;

drop policy if exists "admins read analytics sessions"   on public.analytics_sessions;
drop policy if exists "admins read analytics page views" on public.analytics_page_views;
drop policy if exists "admins read analytics events"     on public.analytics_events;

create policy "admins read analytics sessions"
  on public.analytics_sessions for select
  to authenticated
  using (public.is_admin());

create policy "admins read analytics page views"
  on public.analytics_page_views for select
  to authenticated
  using (public.is_admin());

create policy "admins read analytics events"
  on public.analytics_events for select
  to authenticated
  using (public.is_admin());

-- Table-level privileges, stated rather than inherited. Supabase's default
-- privileges would grant `anon` and `authenticated` full access to new public
-- tables; RLS would still hold the line, but there is no reason for the
-- anonymous role to hold a privilege it must never exercise.
revoke all on public.analytics_sessions   from anon, authenticated;
revoke all on public.analytics_page_views from anon, authenticated;
revoke all on public.analytics_events     from anon, authenticated;

grant select on public.analytics_sessions   to authenticated;
grant select on public.analytics_page_views to authenticated;
grant select on public.analytics_events     to authenticated;

-- ============================================================================
-- Ingest
-- ============================================================================

/**
 * Records one beacon from the browser. Everything a visit produces — the
 * session upsert, the page-view row, the event row, the "close the previous
 * page" duration write — happens here in one atomic round trip.
 *
 * SECURITY DEFINER + a service_role-only grant: the anon key must not be able
 * to reach this even if the RLS story above ever changes.
 *
 * `p_payload` keys: type, session_id, visitor_hash, path, title, referrer_host,
 * referrer_url, utm_source, utm_medium, utm_campaign, utm_term, utm_content,
 * country, device_type, browser, os, screen_width, duration_ms, event_name,
 * props.
 */
create or replace function public.analytics_track(p_payload jsonb)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_type     text    := p_payload ->> 'type';
  v_session  uuid;
  v_path     text    := left(coalesce(nullif(p_payload ->> 'path', ''), '/'), 512);
  v_is_view  boolean;
  v_is_event boolean;
  v_duration integer;
  v_event    text    := left(nullif(p_payload ->> 'event_name', ''), 64);
begin
  if v_type is null or v_type not in ('pageview', 'heartbeat', 'event', 'leave') then
    return;
  end if;

  -- A malformed session id is dropped rather than raised: this is a fire-and-
  -- forget beacon, and a 500 here would only retry-loop the browser.
  begin
    v_session := (p_payload ->> 'session_id')::uuid;
  exception when others then
    return;
  end;

  if v_session is null then
    return;
  end if;

  v_is_view  := v_type = 'pageview';
  v_is_event := v_type = 'event';

  -- Cap at one hour so a laptop that slept overnight can't skew time-on-page.
  v_duration := least(
    greatest(coalesce(nullif(p_payload ->> 'duration_ms', ''), '0')::integer, 0),
    3600000
  );

  insert into public.analytics_sessions as s (
    id, visitor_hash, entry_path, current_path,
    referrer_host, referrer_url,
    utm_source, utm_medium, utm_campaign, utm_term, utm_content,
    country, device_type, browser, os, screen_width,
    page_view_count, event_count
  )
  values (
    v_session,
    left(coalesce(nullif(p_payload ->> 'visitor_hash', ''), 'unknown'), 64),
    v_path,
    v_path,
    left(nullif(p_payload ->> 'referrer_host', ''), 255),
    left(nullif(p_payload ->> 'referrer_url', ''), 1024),
    left(nullif(p_payload ->> 'utm_source', ''), 128),
    left(nullif(p_payload ->> 'utm_medium', ''), 128),
    left(nullif(p_payload ->> 'utm_campaign', ''), 128),
    left(nullif(p_payload ->> 'utm_term', ''), 128),
    left(nullif(p_payload ->> 'utm_content', ''), 128),
    upper(left(nullif(p_payload ->> 'country', ''), 2)),
    left(coalesce(nullif(p_payload ->> 'device_type', ''), 'unknown'), 16),
    left(nullif(p_payload ->> 'browser', ''), 48),
    left(nullif(p_payload ->> 'os', ''), 48),
    nullif(p_payload ->> 'screen_width', '')::integer,
    case when v_is_view  then 1 else 0 end,
    case when v_is_event then 1 else 0 end
  )
  on conflict (id) do update set
    last_seen_at    = now(),
    current_path    = v_path,
    page_view_count = s.page_view_count + case when v_is_view  then 1 else 0 end,
    event_count     = s.event_count     + case when v_is_event then 1 else 0 end,
    -- Acquisition fields belong to the *first* hit of a session and are never
    -- overwritten; the environment fields only fill a gap.
    country      = coalesce(s.country, excluded.country),
    browser      = coalesce(s.browser, excluded.browser),
    os           = coalesce(s.os, excluded.os),
    screen_width = coalesce(s.screen_width, excluded.screen_width),
    device_type  = case
                     when s.device_type = 'unknown' then excluded.device_type
                     else s.device_type
                   end;

  -- Close the page the visitor just left. Must run before the insert below,
  -- otherwise a navigation would credit its duration to the page being opened.
  if v_duration > 0 then
    update public.analytics_page_views
       set duration_ms = v_duration
     where id = (
       select pv.id
         from public.analytics_page_views pv
        where pv.session_id = v_session
          and pv.duration_ms is null
        order by pv.created_at desc, pv.id desc
        limit 1
     );
  end if;

  if v_is_view then
    insert into public.analytics_page_views (session_id, path, title, referrer_host)
    values (
      v_session,
      v_path,
      left(nullif(p_payload ->> 'title', ''), 300),
      left(nullif(p_payload ->> 'referrer_host', ''), 255)
    );
  elsif v_is_event and v_event is not null then
    insert into public.analytics_events (session_id, name, path, props)
    values (
      v_session,
      v_event,
      v_path,
      coalesce(p_payload -> 'props', '{}'::jsonb)
    );

    if v_event = 'contact_submitted' then
      update public.analytics_sessions
         set converted_at = coalesce(converted_at, now())
       where id = v_session;
    end if;
  end if;
end;
$$;

revoke all on function public.analytics_track(jsonb) from public;
grant execute on function public.analytics_track(jsonb) to service_role;

-- ============================================================================
-- Reporting
--
-- SECURITY INVOKER on purpose: these run as the signed-in admin, so the RLS
-- policies above are still the thing enforcing access. A non-admin who calls
-- them gets zeroes, not an error.
-- ============================================================================

/**
 * Headline numbers for [p_from, p_to), each alongside the same metric over the
 * immediately preceding window of equal length so the UI can show a delta.
 */
create or replace function public.analytics_overview(
  p_from timestamptz,
  p_to   timestamptz
)
returns jsonb
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  with bounds as (
    select p_from as cur_from,
           p_to   as cur_to,
           p_from - (p_to - p_from) as prev_from
  ),
  sess as (
    select
      count(distinct s.visitor_hash) filter (where s.started_at >= b.cur_from) as cur_visitors,
      count(distinct s.visitor_hash) filter (where s.started_at <  b.cur_from) as prev_visitors,
      count(s.id) filter (where s.started_at >= b.cur_from)                    as cur_sessions,
      count(s.id) filter (where s.started_at <  b.cur_from)                    as prev_sessions,
      count(s.id) filter (where s.started_at >= b.cur_from
                            and s.page_view_count = 1)                         as cur_bounces,
      count(s.id) filter (where s.started_at <  b.cur_from
                            and s.page_view_count = 1)                         as prev_bounces,
      count(s.id) filter (where s.started_at >= b.cur_from
                            and s.page_view_count >= 1)                        as cur_landed,
      count(s.id) filter (where s.started_at <  b.cur_from
                            and s.page_view_count >= 1)                        as prev_landed,
      count(s.id) filter (where s.started_at >= b.cur_from
                            and s.converted_at is not null)                    as cur_conversions,
      count(s.id) filter (where s.started_at <  b.cur_from
                            and s.converted_at is not null)                    as prev_conversions,
      coalesce(avg(extract(epoch from (s.last_seen_at - s.started_at)))
                 filter (where s.started_at >= b.cur_from), 0)                 as cur_avg_seconds,
      coalesce(avg(extract(epoch from (s.last_seen_at - s.started_at)))
                 filter (where s.started_at <  b.cur_from), 0)                 as prev_avg_seconds
    from bounds b
    left join public.analytics_sessions s
      on s.started_at >= b.prev_from
     and s.started_at <  b.cur_to
  ),
  views as (
    select
      count(pv.id) filter (where pv.created_at >= b.cur_from) as cur_page_views,
      count(pv.id) filter (where pv.created_at <  b.cur_from) as prev_page_views
    from bounds b
    left join public.analytics_page_views pv
      on pv.created_at >= b.prev_from
     and pv.created_at <  b.cur_to
  )
  select jsonb_build_object(
    'visitors',          sess.cur_visitors,
    'prev_visitors',     sess.prev_visitors,
    'sessions',          sess.cur_sessions,
    'prev_sessions',     sess.prev_sessions,
    'page_views',        views.cur_page_views,
    'prev_page_views',   views.prev_page_views,
    'avg_seconds',       round(sess.cur_avg_seconds)::int,
    'prev_avg_seconds',  round(sess.prev_avg_seconds)::int,
    'bounce_rate',       case when sess.cur_landed  > 0
                              then round(sess.cur_bounces::numeric  * 100 / sess.cur_landed, 1)
                              else 0 end,
    'prev_bounce_rate',  case when sess.prev_landed > 0
                              then round(sess.prev_bounces::numeric * 100 / sess.prev_landed, 1)
                              else 0 end,
    'conversions',       sess.cur_conversions,
    'prev_conversions',  sess.prev_conversions,
    'conversion_rate',   case when sess.cur_sessions  > 0
                              then round(sess.cur_conversions::numeric  * 100 / sess.cur_sessions, 1)
                              else 0 end,
    'prev_conversion_rate', case when sess.prev_sessions > 0
                              then round(sess.prev_conversions::numeric * 100 / sess.prev_sessions, 1)
                              else 0 end
  )
  from sess, views;
$$;

/**
 * Gap-filled traffic series. `p_bucket` is 'hour' | 'day' | 'week'.
 *
 * Bucketing happens in `p_tz` local time so "yesterday" means what the admin
 * thinks it means. Across a DST boundary the doubled local hour merges into a
 * single bucket and the skipped one comes back empty — the generated series and
 * the GROUP BY use the same expression, so they always agree.
 */
create or replace function public.analytics_timeseries(
  p_from   timestamptz,
  p_to     timestamptz,
  p_bucket text default 'day',
  p_tz     text default 'UTC'
)
returns table (
  bucket      timestamptz,
  visitors    integer,
  sessions    integer,
  page_views  integer,
  conversions integer
)
language plpgsql
stable
security invoker
set search_path = public, pg_temp
as $$
begin
  if p_bucket not in ('hour', 'day', 'week') then
    raise exception 'analytics_timeseries: unsupported bucket %', p_bucket
      using errcode = 'invalid_parameter_value';
  end if;

  return query
  with grid as (
    select generate_series(
             date_trunc(p_bucket, p_from at time zone p_tz),
             date_trunc(p_bucket, (p_to - interval '1 microsecond') at time zone p_tz),
             ('1 ' || p_bucket)::interval
           ) as local_bucket
  ),
  sess as (
    select date_trunc(p_bucket, s.started_at at time zone p_tz) as local_bucket,
           count(distinct s.visitor_hash)                       as visitors,
           count(*)                                             as sessions,
           count(*) filter (where s.converted_at is not null)    as conversions
      from public.analytics_sessions s
     where s.started_at >= p_from
       and s.started_at <  p_to
     group by 1
  ),
  views as (
    select date_trunc(p_bucket, pv.created_at at time zone p_tz) as local_bucket,
           count(*)                                              as page_views
      from public.analytics_page_views pv
     where pv.created_at >= p_from
       and pv.created_at <  p_to
     group by 1
  )
  select (g.local_bucket at time zone p_tz)::timestamptz,
         coalesce(sess.visitors, 0)::integer,
         coalesce(sess.sessions, 0)::integer,
         coalesce(views.page_views, 0)::integer,
         coalesce(sess.conversions, 0)::integer
    from grid g
    left join sess  on sess.local_bucket  = g.local_bucket
    left join views on views.local_bucket = g.local_bucket
   order by 1;
end;
$$;

/**
 * Top values for one dimension. Kept as a single function so every bar list in
 * the dashboard is guaranteed to count the same way.
 */
create or replace function public.analytics_breakdown(
  p_from      timestamptz,
  p_to        timestamptz,
  p_dimension text,
  p_limit     integer default 8
)
returns table (
  label    text,
  visitors integer,
  views    integer
)
language plpgsql
stable
security invoker
set search_path = public, pg_temp
as $$
declare
  v_limit integer := least(greatest(coalesce(p_limit, 8), 1), 100);
begin
  if p_dimension = 'page' then
    return query
      select pv.path::text,
             count(distinct s.visitor_hash)::integer,
             count(*)::integer
        from public.analytics_page_views pv
        join public.analytics_sessions s on s.id = pv.session_id
       where pv.created_at >= p_from
         and pv.created_at <  p_to
       group by pv.path
       order by 3 desc, 1
       limit v_limit;
    return;
  end if;

  if p_dimension not in (
    'referrer', 'country', 'device', 'browser', 'os',
    'entry_page', 'utm_source', 'utm_campaign'
  ) then
    raise exception 'analytics_breakdown: unsupported dimension %', p_dimension
      using errcode = 'invalid_parameter_value';
  end if;

  return query
    select (case p_dimension
              when 'referrer'     then coalesce(s.referrer_host, 'Direct / none')
              when 'country'      then coalesce(s.country, 'Unknown')
              when 'device'       then s.device_type
              when 'browser'      then coalesce(s.browser, 'Unknown')
              when 'os'           then coalesce(s.os, 'Unknown')
              when 'entry_page'   then s.entry_path
              when 'utm_source'   then coalesce(s.utm_source, 'None')
              when 'utm_campaign' then coalesce(s.utm_campaign, 'None')
            end)::text,
           count(distinct s.visitor_hash)::integer,
           coalesce(sum(s.page_view_count), 0)::integer
      from public.analytics_sessions s
     where s.started_at >= p_from
       and s.started_at <  p_to
     group by 1
     order by 2 desc, 3 desc, 1
     limit v_limit;
end;
$$;

/**
 * Who is on the site right now. A session counts as live while its heartbeat
 * is younger than `p_window_seconds` (the browser beats every 15s, so 300s
 * tolerates a couple of dropped beacons without dropping the visitor).
 */
create or replace function public.analytics_live(
  p_window_seconds integer default 300
)
returns jsonb
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  with live as (
    select *
      from public.analytics_sessions
     where last_seen_at >= now() - make_interval(
             secs => least(greatest(coalesce(p_window_seconds, 300), 30), 3600)
           )
  )
  select jsonb_build_object(
    'visitors', (select count(distinct visitor_hash) from live),
    'sessions', (select count(*) from live),
    'pages', coalesce((
      select jsonb_agg(x order by x.visitors desc, x.label)
        from (
          select current_path                    as label,
                 count(distinct visitor_hash)::int as visitors
            from live
           group by 1
           order by 2 desc, 1
           limit 8
        ) x
    ), '[]'::jsonb),
    'countries', coalesce((
      select jsonb_agg(x order by x.visitors desc, x.label)
        from (
          select coalesce(country, 'Unknown')      as label,
                 count(distinct visitor_hash)::int as visitors
            from live
           group by 1
           order by 2 desc, 1
           limit 8
        ) x
    ), '[]'::jsonb),
    'devices', coalesce((
      select jsonb_agg(x order by x.visitors desc, x.label)
        from (
          select device_type                      as label,
                 count(distinct visitor_hash)::int as visitors
            from live
           group by 1
        ) x
    ), '[]'::jsonb),
    'recent', coalesce((
      select jsonb_agg(x order by x.last_seen_at desc)
        from (
          select id,
                 current_path,
                 coalesce(country, 'Unknown') as country,
                 device_type,
                 coalesce(browser, 'Unknown') as browser,
                 coalesce(referrer_host, 'Direct / none') as referrer_host,
                 page_view_count,
                 started_at,
                 last_seen_at,
                 converted_at is not null as converted
            from live
           order by last_seen_at desc
           limit 20
        ) x
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.analytics_overview(timestamptz, timestamptz)                     from public;
revoke all on function public.analytics_timeseries(timestamptz, timestamptz, text, text)       from public;
revoke all on function public.analytics_breakdown(timestamptz, timestamptz, text, integer)     from public;
revoke all on function public.analytics_live(integer)                                          from public;

grant execute on function public.analytics_overview(timestamptz, timestamptz)                 to authenticated;
grant execute on function public.analytics_timeseries(timestamptz, timestamptz, text, text)   to authenticated;
grant execute on function public.analytics_breakdown(timestamptz, timestamptz, text, integer) to authenticated;
grant execute on function public.analytics_live(integer)                                      to authenticated;

-- ============================================================================
-- Retention
--
-- Analytics rows are the fastest-growing thing in this database and nothing in
-- the dashboard looks back further than a year. Deleting a session cascades to
-- its page views and events.
-- ============================================================================
create or replace function public.analytics_prune(p_keep_days integer default 400)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_deleted integer;
begin
  delete from public.analytics_sessions
   where started_at < now() - make_interval(days => greatest(coalesce(p_keep_days, 400), 7));
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke all on function public.analytics_prune(integer) from public;
grant execute on function public.analytics_prune(integer) to service_role;

-- Schedule it. Requires the pg_cron extension (Database → Extensions in the
-- Supabase dashboard); uncomment once enabled.
--
--   select cron.schedule(
--     'analytics-prune',
--     '17 3 * * *',
--     $cron$ select public.analytics_prune(400); $cron$
--   );

-- PostgREST caches the list of callable functions. Without this, every RPC
-- above returns PGRST202 ("could not find function") until the API restarts.
notify pgrst, 'reload schema';
