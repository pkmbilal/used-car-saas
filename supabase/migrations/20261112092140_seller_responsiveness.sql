-- Responsive seller badge: how quickly a seller answers offers and rental
-- requests, from the responded_at timestamps those flows already record.
--
-- Returns aggregates only (no buyers, amounts or dates), so anyone may call it.
-- Rules must match lib/responsiveness.ts:
--   * window: requests received in the last 90 days
--   * skipped: still pending and under 24 hours old (no fair chance yet), and
--     requests the buyer withdrew/cancelled before any answer
--   * answered: responded_at is set; everything else counts as missed

create function public.seller_response_stats(p_seller_ids uuid[])
returns table (seller_id uuid, total int, answered int, median_minutes int)
language sql
stable
security definer
set search_path = ''
as $$
  with ids as (
    -- At most 50 sellers per call.
    select distinct unnest(p_seller_ids[1:50]) as id
  ),
  requests as (
    select o.seller_id as seller_id, o.status, o.created_at, o.responded_at
    from public.listing_offers o
    where o.seller_id in (select id from ids)
      and o.created_at > now() - interval '90 days'
    union all
    select r.owner_id, r.status, r.created_at, r.responded_at
    from public.rental_requests r
    where r.owner_id in (select id from ids)
      and r.created_at > now() - interval '90 days'
  ),
  counted as (
    select * from requests q
    where q.responded_at is not null
       or (q.status not in ('withdrawn', 'cancelled')
           and not (q.status = 'pending' and q.created_at > now() - interval '24 hours'))
  )
  select
    c.seller_id,
    count(*)::int,
    count(c.responded_at)::int,
    round(
      percentile_cont(0.5) within group (
        order by extract(epoch from (c.responded_at - c.created_at)) / 60
      ) filter (where c.responded_at is not null)
    )::int
  from counted c
  group by c.seller_id;
$$;

revoke execute on function public.seller_response_stats(uuid[]) from public;
grant execute on function public.seller_response_stats(uuid[]) to anon, authenticated;
