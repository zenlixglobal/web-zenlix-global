-- ============================================================================
-- Zenlix Global — admin roles, per-feature permissions, and the audit trail
--
-- Run after 0003_insights.sql. Turns `admin_users` from a flat allow-list into
-- a team table with per-feature access, and moves the "who may do what"
-- decision into the database so it holds for every caller — the app, the SQL
-- editor, or a future script — instead of only for the code paths that
-- remember to check.
--
-- Two layers:
--
--   ROLE decides the hierarchy — who may edit whom — and supplies a default
--   set of features:
--     owner  (3) — everything, always; may manage anyone, including owners.
--     admin  (2) — every feature by default; may manage editors and viewers.
--     editor (1) — enquiries and insights.
--     viewer (0) — read-only.
--
--   CAPABILITIES decide the features themselves, one row per person per
--   feature in `admin_user_permissions`. An override beats the role default,
--   so an editor can be given analytics, or have insights taken away, without
--   inventing a new role.
--
-- `admin_can(capability)` resolves the two and is what every policy below asks.
-- Rules enforced by trigger, because RLS cannot express them:
--   1. You may only act on someone you outrank, and only grant a role you
--      outrank. (Owners are exempt: they outrank everyone, including owners.)
--   2. You cannot grant a capability you do not hold yourself.
--   3. Nobody changes their own role, permissions, or status, and the last
--      active owner cannot be demoted, disabled, or deleted.
--   4. Owners cannot have capabilities revoked — that is the escape hatch that
--      keeps a project from being locked out of its own settings.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'admin_role') then
    create type public.admin_role as enum ('owner', 'admin', 'editor', 'viewer');
  end if;

  if not exists (select 1 from pg_type where typname = 'admin_capability') then
    create type public.admin_capability as enum (
      'submissions:read',
      'submissions:write',
      'submissions:delete',
      'analytics:read',
      'insights:read',
      'insights:write',
      'insights:delete',
      'users:read',
      'users:manage',
      'audit:read'
    );
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Columns
--
-- `email` stays a denormalised copy of auth.users.email: the admin list has to
-- render without a service-role lookup, and RLS cannot reach into auth.users.
-- It is refreshed whenever the app writes a row.
-- ---------------------------------------------------------------------------
alter table public.admin_users
  add column if not exists role        public.admin_role not null default 'viewer',
  add column if not exists full_name   text check (char_length(full_name) between 1 and 120),
  add column if not exists disabled_at timestamptz,
  add column if not exists invited_by  uuid references auth.users (id) on delete set null,
  add column if not exists updated_at  timestamptz not null default now();

-- Everyone who was on the allow-list before this migration had unrestricted
-- access, so they become owners — but only on the first run, when no owner
-- exists yet. Re-running must never silently promote a demoted account.
update public.admin_users
   set role = 'owner'
 where not exists (
   select 1 from public.admin_users where role = 'owner'
 );

create index if not exists admin_users_role_idx
  on public.admin_users (role);

-- ---------------------------------------------------------------------------
-- Rank helpers
--
-- SECURITY DEFINER so they can read `admin_users` without the caller having
-- access to it — the same reason `is_admin()` is defined that way. Without it
-- a policy on `admin_users` that consults `admin_users` would recurse.
-- ---------------------------------------------------------------------------
-- STRICT matters here: `current_admin_role()` returns null for a signed-in
-- non-admin, and without it that null would fall through the CASE to 0 — the
-- same rank as a viewer, quietly handing every viewer-level capability to
-- anyone with a Supabase login. Null in, null out, and the callers coalesce.
create or replace function public.admin_role_rank(p_role public.admin_role)
returns int
language sql
immutable
strict
as $$
  select case p_role
    when 'owner'  then 3
    when 'admin'  then 2
    when 'editor' then 1
    when 'viewer' then 0
  end;
$$;

/** The caller's role, or null if they are not an active admin. */
create or replace function public.current_admin_role()
returns public.admin_role
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select role
    from public.admin_users
   where user_id = auth.uid()
     and disabled_at is null;
$$;

-- Redefined: a disabled account is no longer an admin anywhere in the schema.
-- Every policy written in 0001–0003 picks this up without being touched.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
      from public.admin_users
     where user_id = auth.uid()
       and disabled_at is null
  );
$$;

/** True when the caller's role is at least `p_min`. */
create or replace function public.admin_has_rank(p_min public.admin_role)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    public.admin_role_rank(public.current_admin_role())
      >= public.admin_role_rank(p_min),
    false
  );
$$;

-- ---------------------------------------------------------------------------
-- Per-feature permissions
--
-- Sparse on purpose: a row exists only where someone was explicitly given or
-- denied a feature. Everything else falls through to the role default, so
-- changing what "Editor" means updates every editor who hasn't been
-- individually adjusted.
-- ---------------------------------------------------------------------------
create table if not exists public.admin_user_permissions (
  user_id    uuid not null
               references public.admin_users (user_id) on delete cascade,
  capability public.admin_capability not null,
  granted    boolean not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  primary key (user_id, capability)
);

create index if not exists admin_user_permissions_user_idx
  on public.admin_user_permissions (user_id);

/** The features a role hands out before any per-person adjustment. */
create or replace function public.role_has_capability(
  p_role       public.admin_role,
  p_capability public.admin_capability
)
returns boolean
language sql
immutable
strict
as $$
  select case p_role
    when 'owner'  then true
    when 'admin'  then true
    when 'editor' then p_capability in (
      'submissions:read', 'submissions:write',
      'analytics:read',
      'insights:read', 'insights:write'
    )
    when 'viewer' then p_capability in (
      'submissions:read', 'analytics:read', 'insights:read'
    )
  end;
$$;

/**
 * Capabilities that would each imply `p_capability`.
 *
 * Holding "delete enquiries" without "view enquiries" is not a coherent
 * permission, so the check below treats the wider grant as covering the
 * narrower one. Resolved here rather than written into the table, so it holds
 * however the rows got there.
 */
create or replace function public.capability_implied_by(
  p_capability public.admin_capability
)
returns public.admin_capability[]
language sql
immutable
strict
as $$
  select case p_capability
    when 'submissions:read'  then array['submissions:write', 'submissions:delete']
    when 'submissions:write' then array['submissions:delete']
    when 'insights:read'     then array['insights:write', 'insights:delete']
    when 'insights:write'    then array['insights:delete']
    when 'users:read'        then array['users:manage', 'audit:read']
    -- Managing people includes seeing the log of what was done to them.
    when 'audit:read'        then array['users:manage']
    else array[]::text[]
  end::public.admin_capability[];
$$;

/**
 * Does the caller hold `p_capability`?
 *
 * The single question every policy in this schema asks. Owners short-circuit
 * to true: an owner who could lose `users:manage` is a project that can lock
 * itself out of its own settings.
 */
create or replace function public.admin_can(p_capability public.admin_capability)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with me as (
    select role
      from public.admin_users
     where user_id = auth.uid()
       and disabled_at is null
  )
  select coalesce(
    (
      select case
        when me.role = 'owner' then true
        else exists (
          -- The capability itself, or anything that implies it.
          select 1
            from unnest(
              array[p_capability] || public.capability_implied_by(p_capability)
            ) as needed(capability)
           where coalesce(
             (
               select p.granted
                 from public.admin_user_permissions p
                where p.user_id = auth.uid()
                  and p.capability = needed.capability
             ),
             public.role_has_capability(me.role, needed.capability)
           )
        )
      end
      from me
    ),
    false
  );
$$;

/**
 * True when the caller may create, modify, or remove a user holding `p_target`.
 *
 * Two independent questions, both of which must pass: `users:manage` says you
 * may manage people at all — and it is revocable per person — while rank says
 * which ones. Owners may act on anyone; everyone else strictly below their own
 * rank, which stops an admin promoting themselves by proxy or demoting an
 * owner.
 *
 * Defined here, after `admin_can()`, because Postgres validates the body of a
 * `language sql` function when it is created — a forward reference would fail.
 */
create or replace function public.can_manage_admin(p_target public.admin_role)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    public.admin_can('users:manage')
      and (
        public.current_admin_role() = 'owner'
        or public.admin_role_rank(p_target)
             < public.admin_role_rank(public.current_admin_role())
      ),
    false
  );
$$;

/**
 * `can_manage_admin()` by user id rather than role.
 *
 * SECURITY DEFINER so the lookup of the target's role is not itself subject to
 * RLS on `admin_users` — a policy expression that has to pass another table's
 * policies to evaluate is a subtle way to get a rule that works for some
 * callers and silently fails for others. An unknown id resolves to null, which
 * `can_manage_admin()` coalesces to false.
 */
create or replace function public.can_manage_user(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.can_manage_admin(
    (select role from public.admin_users where user_id = p_user_id)
  );
$$;

revoke all on function public.can_manage_user(uuid) from public;
grant execute on function public.can_manage_user(uuid) to authenticated;

revoke all on function public.admin_role_rank(public.admin_role)  from public;
revoke all on function public.current_admin_role()                from public;
revoke all on function public.admin_has_rank(public.admin_role)   from public;
revoke all on function public.can_manage_admin(public.admin_role) from public;
revoke all on function public.admin_can(public.admin_capability)  from public;
revoke all on function public.role_has_capability(public.admin_role, public.admin_capability) from public;
revoke all on function public.capability_implied_by(public.admin_capability) from public;

grant execute on function public.admin_role_rank(public.admin_role)  to authenticated;
grant execute on function public.current_admin_role()                to authenticated;
grant execute on function public.admin_has_rank(public.admin_role)   to authenticated;
grant execute on function public.can_manage_admin(public.admin_role) to authenticated;
grant execute on function public.admin_can(public.admin_capability)  to authenticated;
grant execute on function public.role_has_capability(public.admin_role, public.admin_capability) to authenticated;
grant execute on function public.capability_implied_by(public.admin_capability) to authenticated;

-- ---------------------------------------------------------------------------
-- Invariants
--
-- These run as triggers rather than in the server actions because a role table
-- that can be edited from the Supabase SQL editor is only as safe as its
-- weakest caller. `auth.uid() is null` means a service-role or psql session:
-- the actor checks are skipped there (there is no actor to rank), but the
-- last-owner guard below still applies.
-- ---------------------------------------------------------------------------
create or replace function public.admin_users_guard()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'DELETE' then
    if auth.uid() is not null then
      if old.user_id = auth.uid() then
        raise exception 'You cannot remove your own admin access.'
          using errcode = 'check_violation';
      end if;

      if not public.can_manage_admin(old.role) then
        raise exception 'You do not outrank this user.'
          using errcode = 'insufficient_privilege';
      end if;
    end if;

    return old;
  end if;

  new.updated_at := now();

  if tg_op = 'INSERT' then
    if auth.uid() is not null and not public.can_manage_admin(new.role) then
      raise exception 'You cannot grant a role you do not outrank.'
        using errcode = 'insufficient_privilege';
    end if;

    return new;
  end if;

  -- UPDATE. The user_id is the row's identity and its foreign key into
  -- auth.users; repointing it would hand someone else's login this row.
  if new.user_id <> old.user_id then
    raise exception 'The user_id of an admin row cannot be changed.'
      using errcode = 'check_violation';
  end if;

  -- The email is a mirror of auth.users, and it is what the team list and the
  -- audit trail identify people by. Self-service edits would let a viewer
  -- relabel themselves as someone else.
  if new.email is distinct from old.email
     and auth.uid() is not null
     and not public.can_manage_admin(old.role) then
    raise exception 'The sign-in email is changed in Supabase Auth, not here.'
      using errcode = 'insufficient_privilege';
  end if;

  if new.role is distinct from old.role
     or new.disabled_at is distinct from old.disabled_at then

    if auth.uid() is not null then
      if old.user_id = auth.uid() then
        raise exception 'You cannot change your own role or status.'
          using errcode = 'check_violation';
      end if;

      -- Both sides are checked: the role being taken away and the one being
      -- granted. Checking only `new` would let an admin demote an owner.
      if not public.can_manage_admin(old.role)
         or not public.can_manage_admin(new.role) then
        raise exception 'You do not outrank this user.'
          using errcode = 'insufficient_privilege';
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists admin_users_guard on public.admin_users;
create trigger admin_users_guard
  before insert or update or delete on public.admin_users
  for each row execute function public.admin_users_guard();

/**
 * The project must never be left without a way in.
 *
 * Statement-level and AFTER, so a multi-row update is judged on its final
 * state rather than row by row.
 */
create or replace function public.admin_users_require_owner()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1
      from public.admin_users
     where role = 'owner'
       and disabled_at is null
  ) then
    raise exception 'There must always be at least one active owner.'
      using errcode = 'check_violation';
  end if;

  return null;
end;
$$;

drop trigger if exists admin_users_require_owner on public.admin_users;
create trigger admin_users_require_owner
  after update or delete on public.admin_users
  for each statement execute function public.admin_users_require_owner();

/**
 * The same invariants, for the per-feature overrides.
 *
 * The escalation rule is the one that matters: you cannot grant a capability
 * you do not hold yourself. Without it, `users:manage` would be a bootstrap
 * into every other feature — an editor given the team page could simply tick
 * their own way to `submissions:delete`.
 */
create or replace function public.admin_permissions_guard()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id    uuid;
  v_capability public.admin_capability;
  v_role       public.admin_role;
begin
  if tg_op = 'DELETE' then
    v_user_id    := old.user_id;
    v_capability := old.capability;
  else
    v_user_id    := new.user_id;
    v_capability := new.capability;
    new.updated_at := now();
  end if;

  select role into v_role
    from public.admin_users
   where user_id = v_user_id;

  -- Owners hold everything unconditionally, so an override row on one is
  -- either a no-op or a false promise. Refuse it rather than store a lie.
  if v_role = 'owner' then
    raise exception 'Owners always have every feature; adjust their role instead.'
      using errcode = 'check_violation';
  end if;

  -- A service-role or psql session has no actor to rank; the checks below are
  -- about *who* is asking, so they do not apply there.
  if auth.uid() is null then
    return case tg_op when 'DELETE' then old else new end;
  end if;

  if v_user_id = auth.uid() then
    raise exception 'You cannot change your own permissions.'
      using errcode = 'check_violation';
  end if;

  if not public.can_manage_admin(v_role) then
    raise exception 'You do not outrank this user.'
      using errcode = 'insufficient_privilege';
  end if;

  -- Only granting is restricted. Taking a feature away is always allowed to
  -- someone who outranks the target, whether or not they hold it themselves.
  if tg_op <> 'DELETE' and new.granted
     and not public.admin_can(v_capability) then
    raise exception 'You cannot grant a feature you do not have yourself.'
      using errcode = 'insufficient_privilege';
  end if;

  return case tg_op when 'DELETE' then old else new end;
end;
$$;

drop trigger if exists admin_permissions_guard on public.admin_user_permissions;
create trigger admin_permissions_guard
  before insert or update or delete on public.admin_user_permissions
  for each row execute function public.admin_permissions_guard();

-- ---------------------------------------------------------------------------
-- RLS
--
-- Four policies, deliberately split:
--   * every admin may read the team list (names and roles, no secrets);
--   * every admin may edit their own row — the profile page;
--   * managers may add and remove rows for users they outrank.
-- The self-update policy is what makes the trigger above load-bearing: it lets
-- a viewer write to their own row, and only the trigger stops them writing a
-- new role into it.
-- ---------------------------------------------------------------------------
drop policy if exists "admins read the allow-list"       on public.admin_users;
drop policy if exists "admins read the team"             on public.admin_users;
drop policy if exists "admins update their own profile"  on public.admin_users;
drop policy if exists "managers add admins"              on public.admin_users;
drop policy if exists "managers update admins"           on public.admin_users;
drop policy if exists "managers remove admins"           on public.admin_users;

-- Own row always: `getAdminUser()` reads it on every request to discover the
-- caller's own role, and someone without `users:read` still has a profile.
create policy "admins read the team"
  on public.admin_users for select
  to authenticated
  using (
    (user_id = auth.uid() and public.is_admin())
    or public.admin_can('users:read')
  );

create policy "admins update their own profile"
  on public.admin_users for update
  to authenticated
  using (user_id = auth.uid() and public.is_admin())
  with check (user_id = auth.uid());

create policy "managers add admins"
  on public.admin_users for insert
  to authenticated
  with check (public.can_manage_admin(role));

create policy "managers update admins"
  on public.admin_users for update
  to authenticated
  using (public.can_manage_admin(role))
  with check (public.can_manage_admin(role));

create policy "managers remove admins"
  on public.admin_users for delete
  to authenticated
  using (public.can_manage_admin(role));

revoke all on public.admin_users from anon, authenticated;
grant select, insert, update, delete on public.admin_users to authenticated;

-- ---------------------------------------------------------------------------
-- RLS — per-feature overrides
--
-- Reading your own row is allowed so the app can resolve your effective
-- capabilities without `users:read`. Writing is managers-only, and the trigger
-- above adds the rules RLS cannot state.
-- ---------------------------------------------------------------------------
alter table public.admin_user_permissions enable row level security;

drop policy if exists "admins read their own permissions" on public.admin_user_permissions;
drop policy if exists "managers read permissions"         on public.admin_user_permissions;
drop policy if exists "managers write permissions"        on public.admin_user_permissions;

create policy "admins read their own permissions"
  on public.admin_user_permissions for select
  to authenticated
  using (user_id = auth.uid() and public.is_admin());

create policy "managers read permissions"
  on public.admin_user_permissions for select
  to authenticated
  using (public.admin_can('users:read'));

create policy "managers write permissions"
  on public.admin_user_permissions for all
  to authenticated
  using (public.can_manage_user(user_id))
  with check (public.can_manage_user(user_id));

revoke all on public.admin_user_permissions from anon, authenticated;
grant select, insert, update, delete on public.admin_user_permissions to authenticated;

-- ---------------------------------------------------------------------------
-- Audit trail
--
-- Append-only by construction: there is no update or delete policy, so a
-- signed-in admin cannot edit or erase what they did. Rows are written by the
-- session client, and the `actor_id = auth.uid()` check makes it impossible to
-- forge an entry attributed to someone else.
-- ---------------------------------------------------------------------------
create table if not exists public.admin_audit_log (
  id           bigint generated always as identity primary key,
  created_at   timestamptz not null default now(),
  actor_id     uuid references auth.users (id) on delete set null,
  actor_email  text,
  action       text not null check (char_length(action) between 1 and 60),
  target_id    uuid,
  target_label text check (char_length(target_label) <= 320),
  meta         jsonb not null default '{}'::jsonb
);

create index if not exists admin_audit_log_created_at_idx
  on public.admin_audit_log (created_at desc);

alter table public.admin_audit_log enable row level security;

drop policy if exists "managers read the audit log" on public.admin_audit_log;
drop policy if exists "admins append to the audit log" on public.admin_audit_log;

create policy "managers read the audit log"
  on public.admin_audit_log for select
  to authenticated
  using (public.admin_can('audit:read'));

create policy "admins append to the audit log"
  on public.admin_audit_log for insert
  to authenticated
  with check (public.is_admin() and actor_id = auth.uid());

revoke all on public.admin_audit_log from anon, authenticated;
grant select, insert on public.admin_audit_log to authenticated;

-- ---------------------------------------------------------------------------
-- Re-point the policies written in 0001–0003
--
-- They were authored against `is_admin()`, which answers "is on the team" —
-- true for a viewer as much as an owner. Now that features are individually
-- grantable, each policy has to name the feature it actually guards, or the
-- checkboxes in the admin would be decoration over a database that still lets
-- everyone do everything.
--
-- `is_admin()` itself is left in place: it is still the right question for
-- "may this person reach /admin at all".
-- ---------------------------------------------------------------------------

-- Enquiries (0001)
drop policy if exists "admins read submissions"   on public.contact_submissions;
drop policy if exists "admins update submissions" on public.contact_submissions;
drop policy if exists "admins delete submissions" on public.contact_submissions;

create policy "admins read submissions"
  on public.contact_submissions for select
  to authenticated
  using (public.admin_can('submissions:read'));

create policy "admins update submissions"
  on public.contact_submissions for update
  to authenticated
  using (public.admin_can('submissions:write'))
  with check (public.admin_can('submissions:write'));

create policy "admins delete submissions"
  on public.contact_submissions for delete
  to authenticated
  using (public.admin_can('submissions:delete'));

-- Analytics (0002)
drop policy if exists "admins read analytics sessions"   on public.analytics_sessions;
drop policy if exists "admins read analytics page views" on public.analytics_page_views;
drop policy if exists "admins read analytics events"     on public.analytics_events;

create policy "admins read analytics sessions"
  on public.analytics_sessions for select
  to authenticated
  using (public.admin_can('analytics:read'));

create policy "admins read analytics page views"
  on public.analytics_page_views for select
  to authenticated
  using (public.admin_can('analytics:read'));

create policy "admins read analytics events"
  on public.analytics_events for select
  to authenticated
  using (public.admin_can('analytics:read'));

-- Insights (0003). The single "admins write insights" FOR ALL policy is split
-- so that deleting an article can be withheld from someone who may write one.
drop policy if exists "admins read every insight" on public.insight_articles;
drop policy if exists "admins write insights"     on public.insight_articles;
drop policy if exists "admins create insights"    on public.insight_articles;
drop policy if exists "admins update insights"    on public.insight_articles;
drop policy if exists "admins delete insights"    on public.insight_articles;

create policy "admins read every insight"
  on public.insight_articles for select
  to authenticated
  using (public.admin_can('insights:read'));

create policy "admins create insights"
  on public.insight_articles for insert
  to authenticated
  with check (public.admin_can('insights:write'));

create policy "admins update insights"
  on public.insight_articles for update
  to authenticated
  using (public.admin_can('insights:write'))
  with check (public.admin_can('insights:write'));

create policy "admins delete insights"
  on public.insight_articles for delete
  to authenticated
  using (public.admin_can('insights:delete'));

notify pgrst, 'reload schema';
