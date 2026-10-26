-- Phase 3: one-off add-ons any seller can buy without a dealer plan.
--
--   featured_boost  one listing featured for 7 days
--   extra_listings  a pack of publish credits beyond the monthly limit; credits
--                   don't expire and are spent only once the limit is used up
--
-- Billing isn't wired up, so a seller files a request (request_addon), pays
-- outside the site, and an admin approves it (approve_addon_request), which
-- applies the boost or credits. A gateway can later call the same function.
-- Prices live in lib/plans.ts (ADDON_PRICES).

-- ---------------------------------------------------------------------------
-- profiles: extra listing credits
-- ---------------------------------------------------------------------------

-- Profiles use column-level grants (see private_phone_publish_quota): this
-- column is granted to nobody, so sellers read it through
-- listing_quota_status and only security definer code changes it.
alter table public.profiles
  add column listing_credits int not null default 0 check (listing_credits >= 0);

-- ---------------------------------------------------------------------------
-- addon_requests
-- ---------------------------------------------------------------------------

create table public.addon_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('featured_boost', 'extra_listings')),
  listing_id uuid references public.listings (id) on delete cascade,
  quantity int not null check (quantity > 0),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reject_reason text check (char_length(reject_reason) <= 300),
  decided_by uuid references public.profiles (id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  check (
    (kind = 'featured_boost' and listing_id is not null and quantity = 1)
    or (kind = 'extra_listings' and listing_id is null and quantity in (1, 3, 5))
  )
);

create index addon_requests_user_idx on public.addon_requests (user_id, created_at desc);
create index addon_requests_pending_idx on public.addon_requests (created_at) where status = 'pending';

-- One open request at a time: per listing for boosts, per seller for credits.
create unique index addon_requests_one_pending_boost
  on public.addon_requests (listing_id)
  where status = 'pending' and kind = 'featured_boost';
create unique index addon_requests_one_pending_listings
  on public.addon_requests (user_id)
  where status = 'pending' and kind = 'extra_listings';

alter table public.addon_requests enable row level security;

create policy "Users can read their own add-on requests"
  on public.addon_requests for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Only request_addon and the service-role functions below write here.
revoke all on public.addon_requests from anon;
revoke insert, update, delete on public.addon_requests from authenticated;

-- ---------------------------------------------------------------------------
-- request_addon: sellers file a request
-- ---------------------------------------------------------------------------

-- Pack sizes must match EXTRA_LISTING_PACKS in lib/plans.ts. Boosting an
-- already featured listing is allowed: approval extends it by 7 days.
create function public.request_addon(p_kind text, p_listing_id uuid, p_quantity int)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  request_id uuid;
begin
  if caller is null or not exists (
    select 1 from public.profiles p
    where p.id = caller and p.role = 'seller' and p.suspended_at is null
  ) then
    raise exception 'not_a_seller' using errcode = 'P0001';
  end if;

  if p_kind = 'featured_boost' then
    if not exists (
      select 1 from public.listings l
      where l.id = p_listing_id and l.seller_id = caller and l.status = 'active'
    ) then
      raise exception 'listing_not_active' using errcode = 'P0001';
    end if;
    if exists (
      select 1 from public.addon_requests r
      where r.listing_id = p_listing_id and r.kind = 'featured_boost' and r.status = 'pending'
    ) then
      raise exception 'addon_already_pending' using errcode = 'P0001';
    end if;

    insert into public.addon_requests (user_id, kind, listing_id, quantity)
    values (caller, p_kind, p_listing_id, 1)
    returning id into request_id;
  elsif p_kind = 'extra_listings' then
    if p_quantity is null or p_quantity not in (1, 3, 5) then
      raise exception 'invalid_quantity' using errcode = 'P0001';
    end if;
    if exists (
      select 1 from public.addon_requests r
      where r.user_id = caller and r.kind = 'extra_listings' and r.status = 'pending'
    ) then
      raise exception 'addon_already_pending' using errcode = 'P0001';
    end if;

    insert into public.addon_requests (user_id, kind, quantity)
    values (caller, p_kind, p_quantity)
    returning id into request_id;
  else
    raise exception 'invalid_kind' using errcode = 'P0001';
  end if;

  return request_id;
exception
  -- Two requests at once: the partial unique index catches the second.
  when unique_violation then
    raise exception 'addon_already_pending' using errcode = 'P0001';
end;
$$;

revoke execute on function public.request_addon(text, uuid, int) from public, anon;
grant execute on function public.request_addon(text, uuid, int) to authenticated;

-- ---------------------------------------------------------------------------
-- approve_addon_request / reject_addon_request: admins decide
-- ---------------------------------------------------------------------------

-- A paid boost is extra to any plan allowance, so it doesn't go through
-- feature_listing (which counts featured_usage slots); it extends
-- featured_until the same way and logs the featured_grants row itself.
create function public.approve_addon_request(p_request uuid, p_admin uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  request record;
  listing_status text;
  listing_featured_until timestamptz;
  new_featured_until timestamptz;
begin
  select r.* into request
  from public.addon_requests r
  where r.id = p_request
  for update;

  if request.id is null or request.status <> 'pending' then
    raise exception 'request_not_pending' using errcode = 'P0001';
  end if;

  if request.kind = 'featured_boost' then
    select l.status, l.featured_until into listing_status, listing_featured_until
    from public.listings l
    where l.id = request.listing_id
    for update;

    if listing_status is distinct from 'active' then
      raise exception 'listing_not_active' using errcode = 'P0001';
    end if;

    new_featured_until := greatest(now(), coalesce(listing_featured_until, now())) + interval '7 days';

    update public.listings
    set featured_until = new_featured_until
    where id = request.listing_id;

    insert into public.featured_grants (listing_id, seller_id, days, featured_until, granted_by, self_serve)
    values (request.listing_id, request.user_id, 7, new_featured_until, p_admin, false);
  else
    update public.profiles
    set listing_credits = listing_credits + request.quantity
    where id = request.user_id;
  end if;

  update public.addon_requests
  set status = 'approved', decided_by = p_admin, decided_at = now()
  where id = p_request;
end;
$$;

revoke execute on function public.approve_addon_request(uuid, uuid) from public, anon, authenticated;
grant execute on function public.approve_addon_request(uuid, uuid) to service_role;

create function public.reject_addon_request(p_request uuid, p_admin uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_user uuid;
  request_listing uuid;
begin
  update public.addon_requests
  set status = 'rejected', reject_reason = nullif(trim(p_reason), ''), decided_by = p_admin, decided_at = now()
  where id = p_request and status = 'pending'
  returning user_id, listing_id into request_user, request_listing;

  if request_user is null then
    raise exception 'request_not_pending' using errcode = 'P0001';
  end if;

  insert into public.admin_actions (admin_id, action, user_id, listing_id, reason)
  values (p_admin, 'addon_rejected', request_user, request_listing, nullif(trim(p_reason), ''));
end;
$$;

revoke execute on function public.reject_addon_request(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.reject_addon_request(uuid, uuid, text) to service_role;

-- ---------------------------------------------------------------------------
-- admin_actions: log rejected add-ons
-- ---------------------------------------------------------------------------

alter table public.admin_actions drop constraint admin_actions_action_check;
alter table public.admin_actions
  add constraint admin_actions_action_check check (action in (
    'listing_removed',
    'listing_restored',
    'reports_dismissed',
    'listing_unfeatured',
    'user_suspended',
    'user_unsuspended',
    'id_approved',
    'id_rejected',
    'id_revoked',
    'dealer_approved',
    'dealer_rejected',
    'listing_auto_hidden',
    'addon_rejected'
  ));

-- ---------------------------------------------------------------------------
-- plan_payments: payments for add-ons too
-- ---------------------------------------------------------------------------

alter table public.plan_payments
  add column addon_request_id uuid references public.addon_requests (id) on delete set null;

-- ---------------------------------------------------------------------------
-- enforce_listing_quota: spend a credit once the monthly limit is used up
-- ---------------------------------------------------------------------------

-- Same as in private_phone_publish_quota, plus the credit fallback.
create or replace function public.enforce_listing_quota()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_role text := current_setting('request.jwt.claims', true)::jsonb ->> 'role';
  charge boolean;
  seller_limit int;
  seller_credits int;
  seller_used int;
begin
  if tg_op = 'INSERT' then
    charge := new.status = 'active';
    new.first_published_at := null;
  else
    charge := new.status = 'active' and old.first_published_at is null;
    new.first_published_at := old.first_published_at;
  end if;

  if not charge then
    return new;
  end if;
  new.first_published_at := now();

  -- Requests without an API role (service role, SQL editor) are exempt.
  if coalesce(request_role, '') not in ('anon', 'authenticated') then
    return new;
  end if;

  select public.plan_monthly_listing_limit(p.plan) into seller_limit
  from public.profiles p
  where p.id = new.seller_id;

  -- The upsert locks the row, so concurrent publishes are counted one by one.
  -- Raising below rolls the increment back with the publish.
  insert into public.listing_quota_usage as u (seller_id, month, used)
  values (new.seller_id, public.current_quota_month(), 1)
  on conflict (seller_id, month) do update set used = u.used + 1
  returning u.used into seller_used;

  if seller_limit is not null and seller_used > seller_limit then
    -- Past the limit: each publish spends one credit.
    update public.profiles
    set listing_credits = listing_credits - 1
    where id = new.seller_id and listing_credits > 0
    returning listing_credits into seller_credits;

    if seller_credits is null then
      raise exception 'listing_quota_exceeded' using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

revoke execute on function public.enforce_listing_quota() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- listing_quota_status: add listing credits
-- ---------------------------------------------------------------------------

drop function public.listing_quota_status();

-- Now security definer: listing_credits isn't granted to authenticated. Still
-- only ever returns the caller's own row.
create function public.listing_quota_status()
returns table (
  plan text,
  plan_expires_at timestamptz,
  used int,
  monthly_limit int,
  featured_used int,
  featured_allowance int,
  listing_credits int
)
language sql
stable
security definer
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
    public.plan_monthly_featured_allowance(p.plan),
    p.listing_credits
  from public.profiles p
  left join public.listing_quota_usage u
    on u.seller_id = p.id and u.month = public.current_quota_month()
  where p.id = (select auth.uid());
$$;

revoke execute on function public.listing_quota_status() from public, anon;
grant execute on function public.listing_quota_status() to authenticated;
