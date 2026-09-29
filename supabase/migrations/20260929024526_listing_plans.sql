-- Phase 3: monthly listing limits by plan.
--
-- Plans are granted by an admin (service role) until billing lands:
--   free 3/month · dealer 30/month · dealer_pro unlimited
-- Every created listing (drafts included) uses a slot; deleting one does not
-- give it back, so the counter lives in its own table rather than counting
-- listings rows. Months follow Asia/Riyadh time.

-- ---------------------------------------------------------------------------
-- profiles: plan
-- ---------------------------------------------------------------------------

-- Not in the "grant update (full_name, phone, city)" list from the init
-- migration, so users cannot change it.
alter table public.profiles
  add column plan text not null default 'free'
    check (plan in ('free', 'dealer', 'dealer_pro'));

-- Single source of truth for the limits; null means unlimited.
create or replace function public.plan_monthly_listing_limit(plan text)
returns int
language sql
immutable
set search_path = ''
as $$
  select case plan
    when 'free' then 3
    when 'dealer' then 30
    else null
  end;
$$;

create or replace function public.current_quota_month()
returns date
language sql
stable
set search_path = ''
as $$
  select date_trunc('month', now() at time zone 'Asia/Riyadh')::date;
$$;

-- ---------------------------------------------------------------------------
-- listing_quota_usage
-- ---------------------------------------------------------------------------

create table public.listing_quota_usage (
  seller_id uuid not null references public.profiles (id) on delete cascade,
  month date not null,
  used int not null default 0 check (used >= 0),
  primary key (seller_id, month)
);

alter table public.listing_quota_usage enable row level security;

create policy "Sellers can read their own quota usage"
  on public.listing_quota_usage for select
  to authenticated
  using (seller_id = (select auth.uid()));

-- Only the quota trigger (security definer) and the service role write here.
revoke all on public.listing_quota_usage from anon;
revoke insert, update, delete on public.listing_quota_usage from authenticated;

-- ---------------------------------------------------------------------------
-- Enforcement
-- ---------------------------------------------------------------------------

-- Security definer so it can write the usage table, which means current_user
-- is the owner here; read the request's role from the JWT claims instead.
-- Requests without one (service role, SQL editor) are exempt.
create or replace function public.enforce_listing_quota()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_role text := current_setting('request.jwt.claims', true)::jsonb ->> 'role';
  seller_limit int;
  seller_used int;
begin
  if coalesce(request_role, '') not in ('anon', 'authenticated') then
    return new;
  end if;

  select public.plan_monthly_listing_limit(p.plan) into seller_limit
  from public.profiles p
  where p.id = new.seller_id;

  -- The upsert locks the row, so concurrent inserts are counted one by one.
  -- Raising below rolls the increment back with the insert.
  insert into public.listing_quota_usage as u (seller_id, month, used)
  values (new.seller_id, public.current_quota_month(), 1)
  on conflict (seller_id, month) do update set used = u.used + 1
  returning u.used into seller_used;

  if seller_limit is not null and seller_used > seller_limit then
    raise exception 'listing_quota_exceeded' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger listings_enforce_quota
  before insert on public.listings
  for each row execute function public.enforce_listing_quota();

-- The signed-in user's plan and this month's usage, for the dashboard.
create or replace function public.listing_quota_status()
returns table (plan text, used int, monthly_limit int)
language sql
stable
set search_path = ''
as $$
  select
    p.plan,
    coalesce(u.used, 0),
    public.plan_monthly_listing_limit(p.plan)
  from public.profiles p
  left join public.listing_quota_usage u
    on u.seller_id = p.id and u.month = public.current_quota_month()
  where p.id = (select auth.uid());
$$;

revoke execute on function public.listing_quota_status() from public, anon;
grant execute on function public.listing_quota_status() to authenticated;
