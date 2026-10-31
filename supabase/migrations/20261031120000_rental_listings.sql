-- Rental listings: a listing is either for sale or for rent. Rentals reuse
-- everything sale listings have (photos, quota, boosts, moderation); `price`
-- holds the daily rate. Rental-only columns must stay null on sale listings.
-- Limits must match lib/listings.ts (parseRentalFields).

alter table public.listings
  add column listing_type text not null default 'sale'
    check (listing_type in ('sale', 'rent')),
  add column weekly_price numeric(12, 2) check (weekly_price > 0),
  add column monthly_price numeric(12, 2) check (monthly_price > 0),
  add column min_rental_days int check (min_rental_days between 1 and 90),
  add column deposit numeric(12, 2) check (deposit >= 0),
  add column daily_km_limit int check (daily_km_limit between 1 and 10000);

alter table public.listings
  add constraint listings_rental_fields_only_on_rent check (
    listing_type = 'rent'
    or (
      weekly_price is null
      and monthly_price is null
      and min_rental_days is null
      and deposit is null
      and daily_km_limit is null
    )
  );

create index listings_type_status_bumped_idx
  on public.listings (listing_type, status, bumped_at desc);

-- ---------------------------------------------------------------------------
-- Offers are for sale listings only.
-- ---------------------------------------------------------------------------

create or replace function public.make_offer(p_listing_id uuid, p_amount int, p_note text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  listing_seller uuid;
  listing_price numeric;
  listing_kind text;
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

  select l.seller_id, l.price, l.listing_type into listing_seller, listing_price, listing_kind
  from public.listings l
  where l.id = p_listing_id and l.status = 'active';

  if listing_seller is null then
    raise exception 'listing_not_active' using errcode = 'P0001';
  end if;
  if listing_kind = 'rent' then
    raise exception 'rent_listing' using errcode = 'P0001';
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
  when unique_violation then
    raise exception 'offer_already_open' using errcode = 'P0001';
end;
$$;

revoke execute on function public.make_offer(uuid, int, text) from public, anon;
grant execute on function public.make_offer(uuid, int, text) to authenticated;
