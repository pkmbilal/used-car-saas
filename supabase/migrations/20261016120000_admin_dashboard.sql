-- Aggregates for the admin dashboard. Computed in the database so the counts
-- stay exact past PostgREST's row limit. Service role only: the admin client
-- calls these after requireAdmin().

-- New listings and new users per day for the last p_days days (Riyadh time),
-- oldest first, with zero-filled days.
create function public.admin_daily_activity(p_days int)
returns table (day date, listings int, users int)
language sql
stable
set search_path = ''
as $$
  with bounds as (
    select (now() at time zone 'Asia/Riyadh')::date - (greatest(p_days, 1) - 1) as first_day
  ),
  days as (
    select generate_series(
      (select first_day from bounds),
      (now() at time zone 'Asia/Riyadh')::date,
      interval '1 day'
    )::date as day
  ),
  new_listings as (
    select (l.created_at at time zone 'Asia/Riyadh')::date as day, count(*)::int as n
    from public.listings l
    where l.created_at >= (select first_day from bounds)::timestamp at time zone 'Asia/Riyadh'
    group by 1
  ),
  new_users as (
    select (p.created_at at time zone 'Asia/Riyadh')::date as day, count(*)::int as n
    from public.profiles p
    where p.created_at >= (select first_day from bounds)::timestamp at time zone 'Asia/Riyadh'
    group by 1
  )
  select d.day, coalesce(nl.n, 0), coalesce(nu.n, 0)
  from days d
  left join new_listings nl on nl.day = d.day
  left join new_users nu on nu.day = d.day
  order by d.day;
$$;

revoke execute on function public.admin_daily_activity(int) from public, anon, authenticated;
grant execute on function public.admin_daily_activity(int) to service_role;

-- All-time views and contact clicks across every listing.
create function public.admin_engagement_totals()
returns table (views bigint, calls bigint, whatsapps bigint)
language sql
stable
set search_path = ''
as $$
  select
    coalesce(sum(c.views), 0)::bigint,
    coalesce(sum(c.calls), 0)::bigint,
    coalesce(sum(c.whatsapps), 0)::bigint
  from public.listing_view_counts c;
$$;

revoke execute on function public.admin_engagement_totals() from public, anon, authenticated;
grant execute on function public.admin_engagement_totals() to service_role;
