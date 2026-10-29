-- Phase 3: refresh to top.
--
-- "Newest" orders live listings by bumped_at. A listing's first publish sets
-- it, and sellers can refresh it later (bump_own_listing) to move the listing
-- back to the top. Each plan sets a wait between refreshes of the same listing
-- and a monthly cap (months follow Asia/Riyadh time, like listing quotas):
--
--   free 7 days, 2/month · dealer 3 days, 10/month
--   dealer_pro 1 day, 30/month · showroom 1 day, unlimited
--
-- Relisting a sold listing doesn't refresh it, so marking sold and relisting
-- can't be used to skip the limits.

-- ---------------------------------------------------------------------------
-- listings.bumped_at
-- ---------------------------------------------------------------------------

alter table public.listings add column bumped_at timestamptz;

-- User triggers off for the backfill so updated_at and the guards stay put.
alter table public.listings disable trigger user;
update public.listings set bumped_at = coalesce(first_published_at, created_at);
alter table public.listings enable trigger user;

alter table public.listings
  alter column bumped_at set default now(),
  alter column bumped_at set not null;

create index listings_active_bumped_at_idx
  on public.listings (bumped_at desc)
  where status = 'active';

-- The "Sellers can update their own listings" policy covers every column, so
-- sellers can't set bumped_at directly: only a first publish or
-- bump_own_listing (security definer) moves it.
create or replace function public.guard_listing_bumped()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'active' and (tg_op = 'INSERT' or old.first_published_at is null) then
    new.bumped_at := now();
  elsif current_user in ('anon', 'authenticated') then
    new.bumped_at := case when tg_op = 'INSERT' then now() else old.bumped_at end;
  end if;
  return new;
end;
$$;

create trigger listings_guard_bumped
  before insert or update on public.listings
  for each row execute function public.guard_listing_bumped();

-- ---------------------------------------------------------------------------
-- Plan rules
-- ---------------------------------------------------------------------------

create or replace function public.plan_bump_cooldown_hours(plan text)
returns int
language sql
immutable
set search_path = ''
as $$
  select case plan
    when 'free' then 168
    when 'dealer' then 72
    else 24
  end;
$$;

-- Null means unlimited.
create or replace function public.plan_monthly_bump_limit(plan text)
returns int
language sql
immutable
set search_path = ''
as $$
  select case plan
    when 'free' then 2
    when 'dealer' then 10
    when 'dealer_pro' then 30
    else null
  end;
$$;

-- ---------------------------------------------------------------------------
-- listing_bumps: one row per refresh, for the monthly cap
-- ---------------------------------------------------------------------------

create table public.listing_bumps (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles (id) on delete cascade,
  listing_id uuid references public.listings (id) on delete set null,
  month date not null,
  created_at timestamptz not null default now()
);

create index listing_bumps_seller_month_idx on public.listing_bumps (seller_id, month);
create index listing_bumps_listing_idx on public.listing_bumps (listing_id);

alter table public.listing_bumps enable row level security;

create policy "Sellers can read their own bumps"
  on public.listing_bumps for select
  to authenticated
  using (seller_id = (select auth.uid()));

-- Only bump_own_listing (security definer) and the service role write here.
revoke all on public.listing_bumps from anon;
revoke insert, update, delete on public.listing_bumps from authenticated;

-- ---------------------------------------------------------------------------
-- bump_own_listing
-- ---------------------------------------------------------------------------

create or replace function public.bump_own_listing(p_listing_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  listing_seller uuid;
  listing_status text;
  listing_bumped_at timestamptz;
  seller_plan text;
  bump_limit int;
  quota_month date := public.current_quota_month();
begin
  select l.seller_id, l.status, l.bumped_at
    into listing_seller, listing_status, listing_bumped_at
  from public.listings l
  where l.id = p_listing_id
  for update;

  if caller is null or listing_seller is distinct from caller then
    raise exception 'listing_not_found' using errcode = 'P0001';
  end if;

  -- Lock the profile so concurrent refreshes are counted one by one.
  -- Suspended sellers' listings are hidden, so there's nothing to refresh.
  select p.plan into seller_plan
  from public.profiles p
  where p.id = caller and p.suspended_at is null
  for update;

  if listing_status <> 'active' or seller_plan is null then
    raise exception 'listing_not_active' using errcode = 'P0001';
  end if;

  if listing_bumped_at > now() - make_interval(hours => public.plan_bump_cooldown_hours(seller_plan)) then
    raise exception 'bump_too_soon' using errcode = 'P0001';
  end if;

  bump_limit := public.plan_monthly_bump_limit(seller_plan);
  if bump_limit is not null and (
    select count(*) from public.listing_bumps b
    where b.seller_id = caller and b.month = quota_month
  ) >= bump_limit then
    raise exception 'bump_limit_reached' using errcode = 'P0001';
  end if;

  insert into public.listing_bumps (seller_id, listing_id, month)
  values (caller, p_listing_id, quota_month);

  update public.listings
  set bumped_at = now()
  where id = p_listing_id;

  return now();
end;
$$;

revoke execute on function public.bump_own_listing(uuid) from public, anon;
grant execute on function public.bump_own_listing(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- bump_status: the signed-in seller's refreshes this month and plan rules
-- ---------------------------------------------------------------------------

create or replace function public.bump_status()
returns table (
  used int,
  monthly_limit int,
  cooldown_hours int
)
language sql
stable
set search_path = ''
as $$
  select
    (
      select count(*)::int from public.listing_bumps b
      where b.seller_id = p.id and b.month = public.current_quota_month()
    ),
    public.plan_monthly_bump_limit(p.plan),
    public.plan_bump_cooldown_hours(p.plan)
  from public.profiles p
  where p.id = (select auth.uid());
$$;

revoke execute on function public.bump_status() from public, anon;
grant execute on function public.bump_status() to authenticated;
