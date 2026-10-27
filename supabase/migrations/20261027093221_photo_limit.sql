-- Photos per listing depend on the seller's plan. Listings over the limit
-- after a downgrade keep their photos; only new ones are refused.

-- Must match PHOTO_LIMIT in lib/plans.ts.
create function public.plan_photo_limit(plan text)
returns int
language sql
immutable
set search_path = ''
as $$
  select case plan
    when 'free' then 5
    when 'dealer' then 10
    when 'dealer_pro' then 15
    when 'showroom' then 20
    else 5
  end;
$$;

create function public.enforce_photo_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_role text := current_setting('request.jwt.claims', true)::jsonb ->> 'role';
  seller_limit int;
  photo_count int;
begin
  -- Requests without an API role (service role, SQL editor) are exempt.
  if coalesce(request_role, '') not in ('anon', 'authenticated') then
    return new;
  end if;

  -- Locking the listing counts concurrent uploads to it one by one.
  select public.plan_photo_limit(p.plan) into seller_limit
  from public.listings l
  join public.profiles p on p.id = l.seller_id
  where l.id = new.listing_id
  for update of l;

  select count(*) into photo_count
  from public.listing_images i
  where i.listing_id = new.listing_id;

  if photo_count >= coalesce(seller_limit, public.plan_photo_limit('free')) then
    raise exception 'photo_limit_exceeded' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

revoke execute on function public.enforce_photo_limit() from public, anon, authenticated;

create trigger listing_images_enforce_photo_limit
  before insert on public.listing_images
  for each row execute function public.enforce_photo_limit();
