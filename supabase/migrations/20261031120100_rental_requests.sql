-- Rental requests: a renter asks for dates on an active rental listing; the
-- owner accepts or declines. Accepted requests block their dates (no two
-- accepted bookings of one car may overlap). Once accepted, each side can read
-- the other's phone (rental_contact) to arrange handover and payment.
--
-- Rows are private to the two parties. All writes go through the security
-- definer functions below. Limits must match lib/rentals.ts.

create extension if not exists btree_gist with schema extensions;

-- ---------------------------------------------------------------------------
-- rental_quote: the price of `days` days, using the cheapest mix of the
-- listing's monthly (30-day), weekly and daily rates. Mirrors quoteRental()
-- in lib/rentals.ts.
-- ---------------------------------------------------------------------------

create function public.rental_quote(
  p_daily numeric, p_weekly numeric, p_monthly numeric, p_days int
)
returns numeric
language plpgsql
immutable
set search_path = ''
as $$
declare
  -- Days left after whole months (all of them when there is no monthly rate).
  rest int := case when p_monthly is null then p_days else p_days % 30 end;
  rest_cost numeric;
begin
  if p_weekly is null then
    rest_cost := rest * p_daily;
  else
    rest_cost := (rest / 7) * p_weekly + least((rest % 7) * p_daily, p_weekly);
  end if;

  if p_monthly is null then
    return rest_cost;
  end if;
  return (p_days / 30) * p_monthly + least(rest_cost, p_monthly);
end;
$$;

-- ---------------------------------------------------------------------------
-- rental_requests
-- ---------------------------------------------------------------------------

create table public.rental_requests (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  renter_id uuid not null references public.profiles (id) on delete cascade,
  -- Copied from the listing so RLS and the owner's inbox need no join.
  owner_id uuid not null references public.profiles (id) on delete cascade,
  start_date date not null,
  end_date date not null,
  -- Inclusive day count and the price quoted when the request was sent.
  days int not null check (days between 1 and 365),
  quoted_total numeric(12, 2) not null check (quoted_total > 0),
  note text check (char_length(note) <= 500),
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'cancelled', 'expired')),
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (renter_id <> owner_id),
  check (end_date >= start_date),
  -- No two accepted bookings of one car may overlap.
  constraint rental_requests_no_overlap exclude using gist (
    listing_id with =,
    daterange(start_date, end_date, '[]') with &&
  ) where (status = 'accepted')
);

create index rental_requests_owner_idx on public.rental_requests (owner_id, created_at desc);
create index rental_requests_renter_idx on public.rental_requests (renter_id, created_at desc);
create index rental_requests_listing_idx on public.rental_requests (listing_id, start_date);

-- One open request per renter per listing; a declined renter may ask again.
create unique index rental_requests_one_open
  on public.rental_requests (listing_id, renter_id)
  where status = 'pending';

create trigger rental_requests_set_updated_at
  before update on public.rental_requests
  for each row execute function public.set_updated_at();

alter table public.rental_requests enable row level security;

create policy "Renters and owners can read their own rental requests"
  on public.rental_requests for select
  to authenticated
  using (renter_id = (select auth.uid()) or owner_id = (select auth.uid()));

revoke all on public.rental_requests from anon;
revoke insert, update, delete on public.rental_requests from authenticated;

-- ---------------------------------------------------------------------------
-- request_rental: renters ask for dates
-- ---------------------------------------------------------------------------

create function public.request_rental(
  p_listing_id uuid, p_start date, p_end date, p_note text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  listing public.listings;
  day_count int;
  request_id uuid;
begin
  if caller is null then
    raise exception 'not_signed_in' using errcode = 'P0001';
  end if;

  if not exists (
    select 1 from public.profiles p
    where p.id = caller and p.suspended_at is null
  ) then
    raise exception 'account_suspended' using errcode = 'P0001';
  end if;

  select * into listing
  from public.listings l
  where l.id = p_listing_id and l.status = 'active';

  if listing.id is null then
    raise exception 'listing_not_active' using errcode = 'P0001';
  end if;
  if listing.listing_type <> 'rent' then
    raise exception 'not_rent_listing' using errcode = 'P0001';
  end if;
  if listing.seller_id = caller then
    raise exception 'own_listing' using errcode = 'P0001';
  end if;

  if not exists (select 1 from public.profiles p where p.id = caller and p.has_phone) then
    raise exception 'phone_required' using errcode = 'P0001';
  end if;

  -- Saudi time: "today" is the renter's calendar day.
  if p_start is null or p_end is null or p_end < p_start
    or p_start < (now() at time zone 'Asia/Riyadh')::date
    or p_start > (now() at time zone 'Asia/Riyadh')::date + 365
  then
    raise exception 'invalid_dates' using errcode = 'P0001';
  end if;

  day_count := p_end - p_start + 1;
  if day_count > 365 then
    raise exception 'invalid_dates' using errcode = 'P0001';
  end if;
  if day_count < coalesce(listing.min_rental_days, 1) then
    raise exception 'min_days_not_met' using errcode = 'P0001';
  end if;

  if exists (
    select 1 from public.rental_requests r
    where r.listing_id = p_listing_id
      and r.status = 'accepted'
      and daterange(r.start_date, r.end_date, '[]') && daterange(p_start, p_end, '[]')
  ) then
    raise exception 'dates_unavailable' using errcode = 'P0001';
  end if;

  if char_length(p_note) > 500 then
    raise exception 'note_too_long' using errcode = 'P0001';
  end if;

  if (
    select count(*) from public.rental_requests r
    where r.renter_id = caller and r.created_at > now() - interval '1 day'
  ) >= 20 then
    raise exception 'request_rate_limited' using errcode = 'P0001';
  end if;

  insert into public.rental_requests (
    listing_id, renter_id, owner_id, start_date, end_date, days, quoted_total, note
  )
  values (
    p_listing_id, caller, listing.seller_id, p_start, p_end, day_count,
    public.rental_quote(listing.price, listing.weekly_price, listing.monthly_price, day_count),
    nullif(btrim(p_note), '')
  )
  returning id into request_id;

  return request_id;
exception
  -- Two requests at once: the partial unique index catches the second.
  when unique_violation then
    raise exception 'request_already_open' using errcode = 'P0001';
end;
$$;

revoke execute on function public.request_rental(uuid, date, date, text) from public, anon;
grant execute on function public.request_rental(uuid, date, date, text) to authenticated;

-- ---------------------------------------------------------------------------
-- owner_respond_rental: accept / decline a pending request
-- ---------------------------------------------------------------------------

create function public.owner_respond_rental(p_request_id uuid, p_action text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  request public.rental_requests;
begin
  select * into request
  from public.rental_requests r
  where r.id = p_request_id and r.owner_id = caller
  for update;

  if request.id is null or request.status <> 'pending' then
    raise exception 'request_not_open' using errcode = 'P0001';
  end if;

  if p_action = 'accept' then
    update public.rental_requests
    set status = 'accepted', responded_at = now()
    where id = request.id;
  elsif p_action = 'decline' then
    update public.rental_requests
    set status = 'declined', responded_at = now()
    where id = request.id;
  else
    raise exception 'invalid_action' using errcode = 'P0001';
  end if;
exception
  -- Accepting dates that overlap another accepted booking.
  when exclusion_violation then
    raise exception 'dates_unavailable' using errcode = 'P0001';
end;
$$;

revoke execute on function public.owner_respond_rental(uuid, text) from public, anon;
grant execute on function public.owner_respond_rental(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- renter_cancel_rental: withdraw a pending request or cancel an accepted one
-- ---------------------------------------------------------------------------

create function public.renter_cancel_rental(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
begin
  update public.rental_requests
  set status = 'cancelled'
  where id = p_request_id
    and renter_id = caller
    and status in ('pending', 'accepted');

  if not found then
    raise exception 'request_not_open' using errcode = 'P0001';
  end if;
end;
$$;

revoke execute on function public.renter_cancel_rental(uuid) from public, anon;
grant execute on function public.renter_cancel_rental(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- rental_contact: the other party's phone, only after acceptance
-- ---------------------------------------------------------------------------

create function public.rental_contact(p_request_id uuid)
returns table (full_name text, phone text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  other uuid;
begin
  select case when r.renter_id = caller then r.owner_id else r.renter_id end into other
  from public.rental_requests r
  where r.id = p_request_id
    and r.status = 'accepted'
    and (r.renter_id = caller or r.owner_id = caller);

  if other is null then
    raise exception 'request_not_accepted' using errcode = 'P0001';
  end if;

  return query
  select p.full_name, p.phone from public.profiles p where p.id = other;
end;
$$;

revoke execute on function public.rental_contact(uuid) from public, anon;
grant execute on function public.rental_contact(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- rental_booked_ranges: accepted, not-yet-ended date ranges of an active
-- rental listing, with no identities, so anyone can see which days are taken.
-- ---------------------------------------------------------------------------

create function public.rental_booked_ranges(p_listing_id uuid)
returns table (start_date date, end_date date)
language sql
stable
security definer
set search_path = ''
as $$
  select r.start_date, r.end_date
  from public.rental_requests r
  join public.listings l on l.id = r.listing_id
  where r.listing_id = p_listing_id
    and r.status = 'accepted'
    and l.status = 'active'
    and r.end_date >= (now() at time zone 'Asia/Riyadh')::date
  order by r.start_date;
$$;

revoke execute on function public.rental_booked_ranges(uuid) from public;
grant execute on function public.rental_booked_ranges(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Expire open requests when a listing stops being active; expire open offers
-- and requests when a listing switches between sale and rent.
-- ---------------------------------------------------------------------------

create function public.expire_rental_requests()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.rental_requests
  set status = 'expired'
  where listing_id = new.id and status = 'pending';
  return null;
end;
$$;

create trigger listings_expire_rental_requests
  after update of status on public.listings
  for each row
  when (old.status = 'active' and new.status <> 'active')
  execute function public.expire_rental_requests();

create function public.expire_on_listing_type_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.listing_offers
  set status = 'expired'
  where listing_id = new.id and status in ('pending', 'countered');
  update public.rental_requests
  set status = 'expired'
  where listing_id = new.id and status = 'pending';
  return null;
end;
$$;

create trigger listings_expire_on_type_change
  after update of listing_type on public.listings
  for each row
  when (old.listing_type is distinct from new.listing_type)
  execute function public.expire_on_listing_type_change();

revoke execute on function public.expire_rental_requests() from public, anon, authenticated;
revoke execute on function public.expire_on_listing_type_change() from public, anon, authenticated;
revoke execute on function public.rental_quote(numeric, numeric, numeric, int) from public, anon;
grant execute on function public.rental_quote(numeric, numeric, numeric, int) to authenticated;
