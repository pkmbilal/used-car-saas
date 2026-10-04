-- Phase 3: monthly featured-listing allowance by plan.
--
--   dealer_pro ("Pro") 3/month · showroom 10/month
--
-- Other plans have no allowance to enforce: admins can still feature their
-- listings as a paid one-off. Featuring the same listing again in a month
-- (e.g. extending it) does not use another slot. Months follow Asia/Riyadh
-- time, like listing quotas.

-- Null means no allowance is enforced.
create or replace function public.plan_monthly_featured_allowance(plan text)
returns int
language sql
immutable
set search_path = ''
as $$
  select case plan
    when 'dealer_pro' then 3
    when 'showroom' then 10
    else null
  end;
$$;

-- ---------------------------------------------------------------------------
-- featured_usage
-- ---------------------------------------------------------------------------

create table public.featured_usage (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles (id) on delete cascade,
  listing_id uuid references public.listings (id) on delete set null,
  month date not null,
  granted_at timestamptz not null default now(),
  granted_by uuid references public.profiles (id) on delete set null,
  unique (listing_id, month)
);

create index featured_usage_seller_month_idx on public.featured_usage (seller_id, month);

alter table public.featured_usage enable row level security;

create policy "Sellers can read their own featured usage"
  on public.featured_usage for select
  to authenticated
  using (seller_id = (select auth.uid()));

-- Only feature_listing (security definer) and the service role write here.
revoke all on public.featured_usage from anon;
revoke insert, update, delete on public.featured_usage from authenticated;

-- ---------------------------------------------------------------------------
-- feature_listing: used by the admin panel through the service role
-- ---------------------------------------------------------------------------

-- Checks the allowance, records the usage and extends featured_until in one
-- transaction. Re-featuring a listing that is still featured extends it.
create or replace function public.feature_listing(p_listing_id uuid, p_days int, p_admin uuid)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  listing_seller uuid;
  listing_status text;
  listing_featured_until timestamptz;
  allowance int;
  quota_month date := public.current_quota_month();
  new_featured_until timestamptz;
begin
  select l.seller_id, l.status, l.featured_until
    into listing_seller, listing_status, listing_featured_until
  from public.listings l
  where l.id = p_listing_id
  for update;

  if listing_seller is null or listing_status <> 'active' then
    raise exception 'listing_not_active' using errcode = 'P0001';
  end if;

  -- Lock the seller's profile so concurrent grants are counted one by one.
  select public.plan_monthly_featured_allowance(p.plan) into allowance
  from public.profiles p
  where p.id = listing_seller
  for update;

  if allowance is not null
    and not exists (
      select 1 from public.featured_usage u
      where u.listing_id = p_listing_id and u.month = quota_month
    )
    and (
      select count(*) from public.featured_usage u
      where u.seller_id = listing_seller and u.month = quota_month
    ) >= allowance
  then
    raise exception 'featured_allowance_exceeded' using errcode = 'P0001';
  end if;

  insert into public.featured_usage (seller_id, listing_id, month, granted_by)
  values (listing_seller, p_listing_id, quota_month, p_admin)
  on conflict (listing_id, month) do nothing;

  new_featured_until := greatest(now(), coalesce(listing_featured_until, now()))
    + make_interval(days => p_days);

  update public.listings
  set featured_until = new_featured_until
  where id = p_listing_id;

  return new_featured_until;
end;
$$;

revoke execute on function public.feature_listing(uuid, int, uuid) from public, anon, authenticated;
grant execute on function public.feature_listing(uuid, int, uuid) to service_role;

-- ---------------------------------------------------------------------------
-- listing_quota_status: add featured usage
-- ---------------------------------------------------------------------------

drop function public.listing_quota_status();

create function public.listing_quota_status()
returns table (
  plan text,
  used int,
  monthly_limit int,
  featured_used int,
  featured_allowance int
)
language sql
stable
set search_path = ''
as $$
  select
    p.plan,
    coalesce(u.used, 0),
    public.plan_monthly_listing_limit(p.plan),
    (
      select count(*)::int from public.featured_usage f
      where f.seller_id = p.id and f.month = public.current_quota_month()
    ),
    public.plan_monthly_featured_allowance(p.plan)
  from public.profiles p
  left join public.listing_quota_usage u
    on u.seller_id = p.id and u.month = public.current_quota_month()
  where p.id = (select auth.uid());
$$;

revoke execute on function public.listing_quota_status() from public, anon;
grant execute on function public.listing_quota_status() to authenticated;
