-- Make an Offer: a buyer sends a private price offer on an active listing; the
-- seller accepts, declines or counters once, and the buyer accepts or
-- declines the counter. Once accepted, each side can read the other's phone
-- (offer_contact) to continue on WhatsApp.
--
-- Rows are private to the two parties. All writes go through the security
-- definer functions below. Limits must match lib/offers.ts.

-- ---------------------------------------------------------------------------
-- listing_offers
-- ---------------------------------------------------------------------------

create table public.listing_offers (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  -- Copied from the listing so RLS and the seller's inbox need no join.
  seller_id uuid not null references public.profiles (id) on delete cascade,
  amount int not null check (amount > 0),
  note text check (char_length(note) <= 500),
  counter_amount int check (counter_amount > 0),
  status text not null default 'pending'
    check (status in ('pending', 'countered', 'accepted', 'declined', 'withdrawn', 'expired')),
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (buyer_id <> seller_id)
);

create index listing_offers_seller_idx on public.listing_offers (seller_id, created_at desc);
create index listing_offers_buyer_idx on public.listing_offers (buyer_id, created_at desc);
create index listing_offers_listing_idx on public.listing_offers (listing_id);

-- One open offer per buyer per listing; a declined buyer may offer again.
create unique index listing_offers_one_open
  on public.listing_offers (listing_id, buyer_id)
  where status in ('pending', 'countered');

create trigger listing_offers_set_updated_at
  before update on public.listing_offers
  for each row execute function public.set_updated_at();

alter table public.listing_offers enable row level security;

create policy "Buyers and sellers can read their own offers"
  on public.listing_offers for select
  to authenticated
  using (buyer_id = (select auth.uid()) or seller_id = (select auth.uid()));

revoke all on public.listing_offers from anon;
revoke insert, update, delete on public.listing_offers from authenticated;

-- ---------------------------------------------------------------------------
-- make_offer: buyers send an offer
-- ---------------------------------------------------------------------------

-- Offers must be between half the asking price and the asking price. The
-- buyer needs a phone so the seller can reach them once they accept.
create function public.make_offer(p_listing_id uuid, p_amount int, p_note text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  listing_seller uuid;
  listing_price numeric;
  offer_id uuid;
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

  select l.seller_id, l.price into listing_seller, listing_price
  from public.listings l
  where l.id = p_listing_id and l.status = 'active';

  if listing_seller is null then
    raise exception 'listing_not_active' using errcode = 'P0001';
  end if;
  if listing_seller = caller then
    raise exception 'own_listing' using errcode = 'P0001';
  end if;

  if not exists (select 1 from public.profiles p where p.id = caller and p.has_phone) then
    raise exception 'phone_required' using errcode = 'P0001';
  end if;

  if p_amount is null or p_amount < ceil(listing_price / 2) then
    raise exception 'offer_too_low' using errcode = 'P0001';
  end if;
  if p_amount >= listing_price then
    raise exception 'offer_too_high' using errcode = 'P0001';
  end if;
  if char_length(p_note) > 500 then
    raise exception 'note_too_long' using errcode = 'P0001';
  end if;

  if (
    select count(*) from public.listing_offers o
    where o.buyer_id = caller and o.created_at > now() - interval '1 day'
  ) >= 20 then
    raise exception 'offer_rate_limited' using errcode = 'P0001';
  end if;

  insert into public.listing_offers (listing_id, buyer_id, seller_id, amount, note)
  values (p_listing_id, caller, listing_seller, p_amount, nullif(btrim(p_note), ''))
  returning id into offer_id;

  return offer_id;
exception
  -- Two offers at once: the partial unique index catches the second.
  when unique_violation then
    raise exception 'offer_already_open' using errcode = 'P0001';
end;
$$;

revoke execute on function public.make_offer(uuid, int, text) from public, anon;
grant execute on function public.make_offer(uuid, int, text) to authenticated;

-- ---------------------------------------------------------------------------
-- seller_respond_offer: accept / decline / counter a pending offer
-- ---------------------------------------------------------------------------

-- A counter sits between the buyer's offer and the asking price.
create function public.seller_respond_offer(p_offer_id uuid, p_action text, p_counter int)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  offer public.listing_offers;
  listing_price numeric;
begin
  select * into offer
  from public.listing_offers o
  where o.id = p_offer_id and o.seller_id = caller
  for update;

  if offer.id is null or offer.status <> 'pending' then
    raise exception 'offer_not_open' using errcode = 'P0001';
  end if;

  if p_action = 'accept' then
    update public.listing_offers
    set status = 'accepted', responded_at = now()
    where id = offer.id;
  elsif p_action = 'decline' then
    update public.listing_offers
    set status = 'declined', responded_at = now()
    where id = offer.id;
  elsif p_action = 'counter' then
    select l.price into listing_price from public.listings l where l.id = offer.listing_id;
    if p_counter is null or p_counter <= offer.amount or p_counter > listing_price then
      raise exception 'invalid_counter' using errcode = 'P0001';
    end if;
    update public.listing_offers
    set status = 'countered', counter_amount = p_counter, responded_at = now()
    where id = offer.id;
  else
    raise exception 'invalid_action' using errcode = 'P0001';
  end if;
end;
$$;

revoke execute on function public.seller_respond_offer(uuid, text, int) from public, anon;
grant execute on function public.seller_respond_offer(uuid, text, int) to authenticated;

-- ---------------------------------------------------------------------------
-- buyer_respond_offer: accept / decline a counter, or withdraw
-- ---------------------------------------------------------------------------

-- Accepting a counter makes it the agreed amount.
create function public.buyer_respond_offer(p_offer_id uuid, p_action text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  offer public.listing_offers;
begin
  select * into offer
  from public.listing_offers o
  where o.id = p_offer_id and o.buyer_id = caller
  for update;

  if offer.id is null then
    raise exception 'offer_not_open' using errcode = 'P0001';
  end if;

  if p_action = 'accept' and offer.status = 'countered' then
    update public.listing_offers
    set status = 'accepted', amount = offer.counter_amount
    where id = offer.id;
  elsif p_action = 'decline' and offer.status = 'countered' then
    update public.listing_offers set status = 'declined' where id = offer.id;
  elsif p_action = 'withdraw' and offer.status in ('pending', 'countered') then
    update public.listing_offers set status = 'withdrawn' where id = offer.id;
  else
    raise exception 'offer_not_open' using errcode = 'P0001';
  end if;
end;
$$;

revoke execute on function public.buyer_respond_offer(uuid, text) from public, anon;
grant execute on function public.buyer_respond_offer(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- offer_contact: the other party's phone, only after acceptance
-- ---------------------------------------------------------------------------

-- Phones are otherwise private (see private_phone_publish_quota).
create function public.offer_contact(p_offer_id uuid)
returns table (full_name text, phone text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  other uuid;
begin
  select case when o.buyer_id = caller then o.seller_id else o.buyer_id end into other
  from public.listing_offers o
  where o.id = p_offer_id
    and o.status = 'accepted'
    and (o.buyer_id = caller or o.seller_id = caller);

  if other is null then
    raise exception 'offer_not_accepted' using errcode = 'P0001';
  end if;

  return query
  select p.full_name, p.phone from public.profiles p where p.id = other;
end;
$$;

revoke execute on function public.offer_contact(uuid) from public, anon;
grant execute on function public.offer_contact(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Expire open offers when a listing stops being active
-- ---------------------------------------------------------------------------

create function public.expire_listing_offers()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.listing_offers
  set status = 'expired'
  where listing_id = new.id and status in ('pending', 'countered');
  return null;
end;
$$;

create trigger listings_expire_offers
  after update of status on public.listings
  for each row
  when (old.status = 'active' and new.status <> 'active')
  execute function public.expire_listing_offers();

revoke execute on function public.expire_listing_offers() from public, anon, authenticated;
