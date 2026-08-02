-- ============================================================================
-- Zenlix Global — initial schema
--
-- Run this in the Supabase SQL editor (or `supabase db push`) before using
-- the contact form or the admin area.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Admin allow-list
--
-- Being able to sign in is not enough to read enquiries: the user's id must
-- also appear here. Add a row after creating the user in Authentication →
-- Users:
--   insert into public.admin_users (user_id, email)
--   values ('<uuid-from-auth-users>', 'you@zenlixglobal.com');
-- ---------------------------------------------------------------------------
create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

-- SECURITY DEFINER so the policies below can consult the allow-list without
-- the caller needing read access to it (which would otherwise recurse).
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.admin_users where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create policy "admins read the allow-list"
  on public.admin_users for select
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Contact submissions
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'submission_status') then
    create type public.submission_status as enum (
      'new', 'in_progress', 'contacted', 'archived'
    );
  end if;
end
$$;

create table if not exists public.contact_submissions (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  first_name    text not null check (char_length(first_name) between 1 and 100),
  last_name     text not null check (char_length(last_name)  between 1 and 100),
  email         text not null check (char_length(email)      between 3 and 320),
  phone         text not null check (char_length(phone)      between 5 and 40),
  company       text not null check (char_length(company)    between 1 and 200),
  inquiry_type  text not null,
  message       text not null check (char_length(message)    between 10 and 5000),
  status        public.submission_status not null default 'new',
  admin_notes   text,
  source_page   text,
  user_agent    text,
  email_sent_at timestamptz
);

create index if not exists contact_submissions_created_at_idx
  on public.contact_submissions (created_at desc);
create index if not exists contact_submissions_status_idx
  on public.contact_submissions (status);

alter table public.contact_submissions enable row level security;

-- No anon INSERT policy on purpose. Public writes go through the server
-- action using the service-role key, which lets us rate-limit and validate
-- server-side rather than exposing the table to the browser.
create policy "admins read submissions"
  on public.contact_submissions for select
  to authenticated
  using (public.is_admin());

create policy "admins update submissions"
  on public.contact_submissions for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins delete submissions"
  on public.contact_submissions for delete
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Newsletter
-- ---------------------------------------------------------------------------
create table if not exists public.newsletter_subscribers (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  email           text not null unique check (char_length(email) between 3 and 320),
  unsubscribed_at timestamptz
);

alter table public.newsletter_subscribers enable row level security;

create policy "admins read subscribers"
  on public.newsletter_subscribers for select
  to authenticated
  using (public.is_admin());
