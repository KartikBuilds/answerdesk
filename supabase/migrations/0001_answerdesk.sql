-- Answerdesk: help-center search and a usage budget, enforced in the database.

create schema if not exists extensions;
create extension if not exists vector with schema extensions;

-- Public help content, split into sections with a 384-dimension embedding each.
create table public.ad_chunks (
  id text primary key,
  slug text not null,
  title text not null,
  heading text not null,
  content text not null,
  embedding extensions.vector(384) not null
);

-- Daily request counts per visitor (a salted hash, never the raw IP) and site-wide.
create table public.ad_usage (
  day date not null,
  visitor text not null,
  requests integer not null default 0,
  primary key (day, visitor)
);

alter table public.ad_chunks enable row level security;
alter table public.ad_usage enable row level security;
-- No policies on purpose: both tables are reachable only through the functions below.
revoke all on public.ad_chunks, public.ad_usage from anon, authenticated;

-- Nearest help sections to a query embedding, by cosine similarity.
create or replace function public.ad_match(p_embedding extensions.vector(384), p_count int default 6)
returns table (slug text, title text, heading text, content text, similarity double precision)
language sql stable security definer set search_path = public, extensions as $$
  select c.slug, c.title, c.heading, c.content, 1 - (c.embedding <=> p_embedding) as similarity
  from public.ad_chunks c
  order by c.embedding <=> p_embedding
  limit least(greatest(p_count, 1), 10)
$$;

-- Takes one unit of the daily budget. Returns false when the visitor or the whole site is over its limit.
create or replace function public.ad_take_quota(p_visitor text, p_per_visitor int default 15, p_site int default 300)
returns boolean
language plpgsql volatile security definer set search_path = public as $$
declare
  today date := (now() at time zone 'utc')::date;
  mine int;
  site int;
begin
  if p_visitor !~ '^[a-f0-9]{64}$' then raise exception 'invalid visitor id' using errcode = 'P0001'; end if;
  p_per_visitor := least(p_per_visitor, 15);
  p_site := least(p_site, 300);

  insert into public.ad_usage as u (day, visitor, requests) values (today, '_site', 0)
    on conflict (day, visitor) do nothing;
  -- Row lock serialises concurrent requests so the site cap can't be overshot.
  select requests into site from public.ad_usage where day = today and visitor = '_site' for update;
  select requests into mine from public.ad_usage where day = today and visitor = p_visitor;
  if site >= p_site or coalesce(mine, 0) >= p_per_visitor then return false; end if;

  update public.ad_usage set requests = requests + 1 where day = today and visitor = '_site';
  insert into public.ad_usage (day, visitor, requests) values (today, p_visitor, 1)
    on conflict (day, visitor) do update set requests = public.ad_usage.requests + 1;
  delete from public.ad_usage where day < today - 7;
  return true;
end $$;

revoke all on function public.ad_match(extensions.vector, int) from public;
revoke all on function public.ad_take_quota(text, int, int) from public;
grant usage on schema extensions to anon, authenticated;
grant execute on function public.ad_match(extensions.vector, int) to anon, authenticated;
grant execute on function public.ad_take_quota(text, int, int) to anon, authenticated;
