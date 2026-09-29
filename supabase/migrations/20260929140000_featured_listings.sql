-- Phase 3: featured listings.
--
-- A listing is featured while featured_until is in the future. Admins grant
-- it (service role) until payments land; sellers cannot set it themselves.

alter table public.listings
  add column featured_until timestamptz;

create index listings_featured_until_idx
  on public.listings (featured_until desc)
  where status = 'active' and featured_until is not null;

-- The "Sellers can update their own listings" policy covers every column, so
-- block featured_until here. The service role (admin client) is exempt.
create or replace function public.guard_listing_featured()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  if (tg_op = 'INSERT' and new.featured_until is not null)
    or (tg_op = 'UPDATE' and new.featured_until is distinct from old.featured_until) then
    raise exception 'Only admins can feature listings' using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger listings_guard_featured
  before insert or update on public.listings
  for each row execute function public.guard_listing_featured();
