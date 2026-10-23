-- Launch checklist: keep seller phone numbers private, and charge the
-- monthly listing quota when a listing is first published (not on insert).

-- ---------------------------------------------------------------------------
-- profiles.phone: no longer publicly readable
-- ---------------------------------------------------------------------------

-- Lets pages show a contact button without reading the number itself.
alter table public.profiles
  add column has_phone boolean generated always as (phone is not null and btrim(phone) <> '') stored;

-- Column grants: every column except phone stays public. Policies elsewhere
-- read role, suspended_at and is_admin, which are still granted.
revoke select on public.profiles from anon, authenticated;
grant select (
  id, full_name, city, role, is_admin, suspended_at, email_verified_at,
  id_verified_at, plan, plan_expires_at, business_name, about, logo_key,
  showroom_address, created_at, has_phone
) on public.profiles to anon, authenticated;

-- The signed-in user's own full profile, phone included (lib/auth.ts).
create function public.get_own_profile()
returns setof public.profiles
language sql
stable
security definer
set search_path = ''
as $$
  select * from public.profiles where id = (select auth.uid());
$$;

revoke execute on function public.get_own_profile() from public, anon;
grant execute on function public.get_own_profile() to authenticated;

-- ---------------------------------------------------------------------------
-- contact_reveals: click-to-reveal phone numbers, rate-limited per IP
-- ---------------------------------------------------------------------------

-- Written only by reveal_seller_phone(), which the server calls with the
-- service-role client. IPs are stored hashed and pruned after two days.
create table public.contact_reveals (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  seller_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.contact_reveals enable row level security;
-- No policies: nothing but the service role reads or writes this table.
revoke all on public.contact_reveals from anon, authenticated;

create index contact_reveals_ip_hash_created_at_idx on public.contact_reveals (ip_hash, created_at);
create index contact_reveals_seller_id_idx on public.contact_reveals (seller_id);

-- Returns the seller's phone and logs the reveal, or null when the seller is
-- suspended, has no phone, or has nothing public (no active listing and no
-- dealer plan). Raises contact_rate_limited after 30 reveals an hour per IP.
-- Service role only: the caller supplies the IP hash, so it must be trusted.
create function public.reveal_seller_phone(p_seller_id uuid, p_ip_hash text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  recent int;
  seller_phone text;
begin
  select count(*) into recent
  from public.contact_reveals r
  where r.ip_hash = p_ip_hash
    and r.created_at > now() - interval '1 hour';
  if recent >= 30 then
    raise exception 'contact_rate_limited' using errcode = 'P0001';
  end if;

  select p.phone into seller_phone
  from public.profiles p
  where p.id = p_seller_id
    and p.has_phone
    and p.suspended_at is null
    and (
      p.plan <> 'free'
      or exists (select 1 from public.listings l where l.seller_id = p.id and l.status = 'active')
    );
  if seller_phone is null then
    return null;
  end if;

  insert into public.contact_reveals (ip_hash, seller_id) values (p_ip_hash, p_seller_id);
  return seller_phone;
end;
$$;

revoke execute on function public.reveal_seller_phone(uuid, text) from public, anon, authenticated;
grant execute on function public.reveal_seller_phone(uuid, text) to service_role;

select cron.schedule(
  'prune-contact-reveals',
  '15 3 * * *',
  $$delete from public.contact_reveals where created_at < now() - interval '2 days'$$
);

-- ---------------------------------------------------------------------------
-- Listing quota: charged on first publish
-- ---------------------------------------------------------------------------

alter table public.listings add column first_published_at timestamptz;

-- Anything past draft has been live at some point.
update public.listings set first_published_at = created_at where status <> 'draft';

-- Runs on every insert/update (not just "update of status") so sellers can't
-- set first_published_at themselves to skip the charge. Drafts are free;
-- relisting or republishing an already-charged listing is free.
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
    raise exception 'listing_quota_exceeded' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger listings_enforce_quota on public.listings;
create trigger listings_enforce_quota
  before insert or update on public.listings
  for each row execute function public.enforce_listing_quota();

-- This month's usage counted drafts; recount it as listings first published
-- this month (never higher than before, so nobody loses a slot).
update public.listing_quota_usage u
set used = least(u.used, (
  select count(*)::int
  from public.listings l
  where l.seller_id = u.seller_id
    and date_trunc('month', l.first_published_at at time zone 'Asia/Riyadh')::date = u.month
))
where u.month = public.current_quota_month();
