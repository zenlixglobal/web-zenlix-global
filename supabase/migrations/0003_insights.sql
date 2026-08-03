-- ============================================================================
-- Zenlix Global — Insights articles
--
-- Run after 0002_analytics.sql. Backs /admin/insights and the public
-- /insights/[slug] pages.
--
-- Unlike every other table in this project, this one is *meant* to be read by
-- the public — but only the published rows. That distinction lives in the RLS
-- policies below, which is why the marketing pages can read it with the anon
-- key and still never leak a draft.
-- ============================================================================

create table if not exists public.insight_articles (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  -- The URL segment. Unique because it is the public identity of the article.
  slug         text not null unique
                 check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length(slug) between 3 and 120),
  title        text not null check (char_length(title)    between 3 and 200),
  category     text not null check (char_length(category) between 2 and 60),
  excerpt      text not null check (char_length(excerpt)  between 10 and 400),
  body         text not null check (char_length(body)     between 10 and 60000),
  image_url    text check (char_length(image_url) <= 1000),
  image_alt    text check (char_length(image_alt) <= 300),
  author       text check (char_length(author) <= 120),
  published    boolean not null default false,
  -- Stamped the first time an article goes live and preserved afterwards, so
  -- unpublishing and republishing doesn't reshuffle the homepage order.
  published_at timestamptz
);

-- The public list query: published rows, newest first.
create index if not exists insight_articles_published_idx
  on public.insight_articles (published_at desc)
  where published;

create index if not exists insight_articles_updated_idx
  on public.insight_articles (updated_at desc);

-- ---------------------------------------------------------------------------
-- updated_at / published_at bookkeeping
--
-- In a trigger rather than the application so it holds however the row is
-- written — server action, SQL editor, or a future import script.
-- ---------------------------------------------------------------------------
create or replace function public.insight_articles_touch()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();

  if new.published and new.published_at is null then
    new.published_at := now();
  end if;

  return new;
end;
$$;

drop trigger if exists insight_articles_touch on public.insight_articles;
create trigger insight_articles_touch
  before insert or update on public.insight_articles
  for each row execute function public.insight_articles_touch();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.insight_articles enable row level security;

drop policy if exists "anyone reads published insights" on public.insight_articles;
drop policy if exists "admins read every insight"       on public.insight_articles;
drop policy if exists "admins write insights"           on public.insight_articles;

-- Visitors — including signed-out ones — see published articles only. A draft
-- is invisible even if someone guesses its slug.
create policy "anyone reads published insights"
  on public.insight_articles for select
  to anon, authenticated
  using (published);

create policy "admins read every insight"
  on public.insight_articles for select
  to authenticated
  using (public.is_admin());

create policy "admins write insights"
  on public.insight_articles for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

revoke all on public.insight_articles from anon, authenticated;
grant select on public.insight_articles to anon;
grant select, insert, update, delete on public.insight_articles to authenticated;

notify pgrst, 'reload schema';
