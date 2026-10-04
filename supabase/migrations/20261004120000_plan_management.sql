-- Phase 3: plan expiry, plan/featured history and self-serve featuring.
--
-- Plans are still granted by an admin until billing lands, but every change
-- now goes through set_plan so it carries an expiry and leaves a history row.
-- Billing will call set_plan after a successful payment. Expired plans are
-- downgraded to free by an hourly pg_cron job.
--
-- Pro/Showroom sellers can spend their monthly featured allowance themselves
-- (feature_own_listing). Every featured grant, admin or self-serve, is logged
-- in featured_grants; featured_usage keeps counting allowance slots.

-- ---------------------------------------------------------------------------
-- profiles: plan expiry
-- ---------------------------------------------------------------------------

-- Null means the plan does not expire. Not in the "grant update" list from the
-- init migration, so users cannot change it.
alter table public.profiles
  add column plan_expires_at timestamptz;

create index profiles_plan_expires_at_idx
  on public.profiles (plan_expires_at)
  where plan_expires_at is not null;

-- ---------------------------------------------------------------------------
-- plan_changes
-- ---------------------------------------------------------------------------

create table public.plan_changes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  from_plan text not null,
  to_plan text not null,
  expires_at timestamptz,
  changed_by uuid references public.profiles (id) on delete set null, -- null = system
  source text not null check (source in ('admin', 'dealer_application', 'expiry')),
  note text check (char_length(note) <= 300),
  created_at timestamptz not null default now()
);

create index plan_changes_user_idx on public.plan_changes (user_id, created_at desc);
create index plan_changes_created_at_idx on public.plan_changes (created_at desc);

alter table public.plan_changes enable row level security;

create policy "Users can read their own plan changes"
  on public.plan_changes for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Only set_plan/expire_plans (security definer) and the service role write here.
revoke all on public.plan_changes from anon;
revoke insert, update, delete on public.plan_changes from authenticated;

-- ---------------------------------------------------------------------------
-- set_plan: the only way plans change
-- ---------------------------------------------------------------------------

create or replace function public.set_plan(
  p_user uuid,
  p_plan text,
  p_expires_at timestamptz,
  p_changed_by uuid,
  p_source text,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_plan text;
  new_expires_at timestamptz := case when p_plan = 'free' then null else p_expires_at end;
begin
  select p.plan into old_plan
  from public.profiles p
  where p.id = p_user
  for update;

  if old_plan is null then
    raise exception 'profile_not_found' using errcode = 'P0001';
  end if;

  update public.profiles
  set plan = p_plan, plan_expires_at = new_expires_at
  where id = p_user;

  insert into public.plan_changes (user_id, from_plan, to_plan, expires_at, changed_by, source, note)
  values (p_user, old_plan, p_plan, new_expires_at, p_changed_by, p_source, nullif(trim(p_note), ''));
end;
$$;

revoke execute on function public.set_plan(uuid, text, timestamptz, uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.set_plan(uuid, text, timestamptz, uuid, text, text)
  to service_role;

-- ---------------------------------------------------------------------------
-- expire_plans: hourly downgrade to free
-- ---------------------------------------------------------------------------

create or replace function public.expire_plans()
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  expired record;
  expired_count int := 0;
begin
  for expired in
    select p.id from public.profiles p
    where p.plan <> 'free' and p.plan_expires_at <= now()
    for update skip locked
  loop
    perform public.set_plan(expired.id, 'free', null, null, 'expiry', null);
    expired_count := expired_count + 1;
  end loop;
  return expired_count;
end;
$$;

revoke execute on function public.expire_plans() from public, anon, authenticated;
grant execute on function public.expire_plans() to service_role;

create extension if not exists pg_cron;

select cron.schedule('expire-plans', '0 * * * *', 'select public.expire_plans()');

-- ---------------------------------------------------------------------------
-- featured_grants
-- ---------------------------------------------------------------------------

create table public.featured_grants (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings (id) on delete set null,
  seller_id uuid not null references public.profiles (id) on delete cascade,
  days int not null check (days > 0),
  featured_until timestamptz not null,
  granted_by uuid references public.profiles (id) on delete set null,
  self_serve boolean not null default false,
  created_at timestamptz not null default now()
);

create index featured_grants_created_at_idx on public.featured_grants (created_at desc);
create index featured_grants_seller_idx on public.featured_grants (seller_id, created_at desc);

alter table public.featured_grants enable row level security;

create policy "Sellers can read their own featured grants"
  on public.featured_grants for select
  to authenticated
  using (seller_id = (select auth.uid()));

-- Only feature_listing (security definer) and the service role write here.
revoke all on public.featured_grants from anon;
revoke insert, update, delete on public.featured_grants from authenticated;

-- ---------------------------------------------------------------------------
-- feature_listing: now logs every grant
-- ---------------------------------------------------------------------------

-- Same as in the featured_allowance migration, plus the featured_grants row.
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

  insert into public.featured_grants (listing_id, seller_id, days, featured_until, granted_by, self_serve)
  values (p_listing_id, listing_seller, p_days, new_featured_until, p_admin, coalesce(p_admin = listing_seller, false));

  return new_featured_until;
end;
$$;

revoke execute on function public.feature_listing(uuid, int, uuid) from public, anon, authenticated;
grant execute on function public.feature_listing(uuid, int, uuid) to service_role;

-- ---------------------------------------------------------------------------
-- feature_own_listing: sellers spend their plan's allowance
-- ---------------------------------------------------------------------------

-- A fixed 7 days per slot. Each listing can be self-featured once a month:
-- re-featuring the same listing doesn't use another slot, so without this
-- check a seller could extend one listing indefinitely.
create or replace function public.feature_own_listing(p_listing_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  listing_seller uuid;
  allowance int;
begin
  select l.seller_id into listing_seller
  from public.listings l
  where l.id = p_listing_id;

  if caller is null or listing_seller is distinct from caller then
    raise exception 'listing_not_found' using errcode = 'P0001';
  end if;

  select public.plan_monthly_featured_allowance(p.plan) into allowance
  from public.profiles p
  where p.id = caller and p.suspended_at is null;

  if allowance is null then
    raise exception 'featured_not_included' using errcode = 'P0001';
  end if;

  if exists (
    select 1 from public.featured_usage u
    where u.listing_id = p_listing_id and u.month = public.current_quota_month()
  ) then
    raise exception 'featured_already_used' using errcode = 'P0001';
  end if;

  return public.feature_listing(p_listing_id, 7, caller);
end;
$$;

revoke execute on function public.feature_own_listing(uuid) from public, anon;
grant execute on function public.feature_own_listing(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- listing_quota_status: add plan expiry
-- ---------------------------------------------------------------------------

drop function public.listing_quota_status();

create function public.listing_quota_status()
returns table (
  plan text,
  plan_expires_at timestamptz,
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
    p.plan_expires_at,
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
