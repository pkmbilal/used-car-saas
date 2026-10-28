-- Phase 3: seller insights for Pro and Showroom plans.
--
-- listing_view_counts only keeps running totals, so this adds one row per
-- listing per day (Riyadh time) for trends. The counter functions now write
-- both; history starts the day this migration is applied. Writes only go
-- through the counter functions; there are no insert/update policies.

create table public.listing_daily_stats (
  listing_id uuid not null references public.listings (id) on delete cascade,
  day date not null,
  views int not null default 0 check (views >= 0),
  calls int not null default 0 check (calls >= 0),
  whatsapps int not null default 0 check (whatsapps >= 0),
  primary key (listing_id, day)
);

alter table public.listing_daily_stats enable row level security;

create policy "Sellers can read their own daily listing stats"
  on public.listing_daily_stats for select
  to authenticated
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and l.seller_id = (select auth.uid())
    )
  );

-- Same rules as before (active listings only, the seller's own views ignored),
-- now also counting today's row.
create or replace function public.increment_listing_view(p_listing_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.listings l
    where l.id = p_listing_id
      and l.status = 'active'
      and l.seller_id is distinct from (select auth.uid())
  ) then
    return;
  end if;

  insert into public.listing_view_counts (listing_id, views)
  values (p_listing_id, 1)
  on conflict (listing_id)
    do update set views = public.listing_view_counts.views + 1;

  insert into public.listing_daily_stats (listing_id, day, views)
  values (p_listing_id, (now() at time zone 'Asia/Riyadh')::date, 1)
  on conflict (listing_id, day)
    do update set views = public.listing_daily_stats.views + 1;
end;
$$;

create or replace function public.increment_listing_contact(p_listing_id uuid, p_kind text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_calls int := (p_kind = 'call')::int;
  v_whatsapps int := (p_kind = 'whatsapp')::int;
begin
  if p_kind not in ('call', 'whatsapp') or not exists (
    select 1 from public.listings l
    where l.id = p_listing_id
      and l.status = 'active'
      and l.seller_id is distinct from (select auth.uid())
  ) then
    return;
  end if;

  insert into public.listing_view_counts (listing_id, calls, whatsapps)
  values (p_listing_id, v_calls, v_whatsapps)
  on conflict (listing_id)
    do update set
      calls = public.listing_view_counts.calls + excluded.calls,
      whatsapps = public.listing_view_counts.whatsapps + excluded.whatsapps;

  insert into public.listing_daily_stats (listing_id, day, calls, whatsapps)
  values (p_listing_id, (now() at time zone 'Asia/Riyadh')::date, v_calls, v_whatsapps)
  on conflict (listing_id, day)
    do update set
      calls = public.listing_daily_stats.calls + excluded.calls,
      whatsapps = public.listing_daily_stats.whatsapps + excluded.whatsapps;
end;
$$;

-- Longest insights range per plan, in days; 0 = no insights. Must match
-- INSIGHTS_DAYS in lib/plans.ts.
create function public.plan_insights_days(p_plan text)
returns int
language sql
immutable
set search_path = ''
as $$
  select case p_plan
    when 'dealer_pro' then 30
    when 'showroom' then 90
    else 0
  end;
$$;

-- The caller's range, capped by their plan: 0 when insights aren't included.
create function public.my_insights_days(p_days int)
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select least(greatest(p_days, 0), public.plan_insights_days(p.plan))
  from public.profiles p
  where p.id = (select auth.uid());
$$;

-- Daily totals across the caller's listings for the last 2 × p_days days
-- (this period and the one before, for comparison), oldest first, with
-- zero-filled days. Saves are favorites added that day that still exist;
-- offers are offers received that day. Empty unless the plan includes it.
create function public.seller_insights(p_days int)
returns table (day date, views int, calls int, whatsapps int, saves int, offers int)
language sql
stable
security definer
set search_path = ''
as $$
  with range as (
    select
      public.my_insights_days(p_days) as n,
      (now() at time zone 'Asia/Riyadh')::date as today
  ),
  bounds as (
    select today - (2 * n - 1) as first_day, today, n from range where n > 0
  ),
  days as (
    select generate_series(b.first_day, b.today, interval '1 day')::date as day
    from bounds b
  ),
  own as (
    select l.id from public.listings l where l.seller_id = (select auth.uid())
  ),
  stats as (
    select s.day, sum(s.views)::int as views, sum(s.calls)::int as calls, sum(s.whatsapps)::int as whatsapps
    from public.listing_daily_stats s
    where s.listing_id in (select id from own)
      and s.day >= (select first_day from bounds)
    group by s.day
  ),
  saved as (
    select (f.created_at at time zone 'Asia/Riyadh')::date as day, count(*)::int as n
    from public.favorites f
    where f.listing_id in (select id from own)
      and f.created_at >= (select first_day from bounds)::timestamp at time zone 'Asia/Riyadh'
    group by 1
  ),
  offered as (
    select (o.created_at at time zone 'Asia/Riyadh')::date as day, count(*)::int as n
    from public.listing_offers o
    where o.seller_id = (select auth.uid())
      and o.created_at >= (select first_day from bounds)::timestamp at time zone 'Asia/Riyadh'
    group by 1
  )
  select
    d.day,
    coalesce(s.views, 0),
    coalesce(s.calls, 0),
    coalesce(s.whatsapps, 0),
    coalesce(sv.n, 0),
    coalesce(o.n, 0)
  from days d
  left join stats s on s.day = d.day
  left join saved sv on sv.day = d.day
  left join offered o on o.day = d.day
  order by d.day;
$$;

revoke execute on function public.seller_insights(int) from public, anon;
grant execute on function public.seller_insights(int) to authenticated;

-- Per-listing totals over the last p_days days, plus how many buyers have
-- each listing saved right now (counts only, never who). Every listing the
-- caller owns gets a row. Empty unless the plan includes insights.
create function public.seller_listing_insights(p_days int)
returns table (listing_id uuid, views int, calls int, whatsapps int, saves int)
language sql
stable
security definer
set search_path = ''
as $$
  with bounds as (
    select (now() at time zone 'Asia/Riyadh')::date - (n - 1) as first_day
    from (select public.my_insights_days(p_days) as n) r
    where n > 0
  )
  select
    l.id,
    coalesce(s.views, 0),
    coalesce(s.calls, 0),
    coalesce(s.whatsapps, 0),
    coalesce(f.n, 0)
  from public.listings l
  cross join bounds b
  left join lateral (
    select sum(ds.views)::int as views, sum(ds.calls)::int as calls, sum(ds.whatsapps)::int as whatsapps
    from public.listing_daily_stats ds
    where ds.listing_id = l.id and ds.day >= b.first_day
  ) s on true
  left join lateral (
    select count(*)::int as n from public.favorites fv where fv.listing_id = l.id
  ) f on true
  where l.seller_id = (select auth.uid());
$$;

revoke execute on function public.seller_listing_insights(int) from public, anon;
grant execute on function public.seller_listing_insights(int) to authenticated;

revoke execute on function public.my_insights_days(int) from public, anon;
grant execute on function public.my_insights_days(int) to authenticated;
