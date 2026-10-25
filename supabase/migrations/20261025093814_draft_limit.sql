-- Drafts don't use the monthly quota, but each can hold photos in R2, so cap
-- how many never-published drafts a seller holds at once. Also stops sellers
-- marking a never-published listing sold, which skipped both limits.

-- Open drafts allowed per plan. Must match DRAFT_LIMIT in lib/plans.ts.
create function public.plan_draft_limit(plan text)
returns int
language sql
immutable
set search_path = ''
as $$
  select case plan
    when 'free' then 5
    when 'dealer' then 50
    when 'dealer_pro' then 200
    when 'showroom' then 500
    else 5
  end;
$$;

-- Only never-published drafts count: unpublishing a live listing is always
-- allowed, and its photos are already bounded by the publish quota.
create function public.enforce_draft_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_role text := current_setting('request.jwt.claims', true)::jsonb ->> 'role';
  seller_limit int;
  open_drafts int;
begin
  -- Requests without an API role (service role, SQL editor) are exempt.
  if coalesce(request_role, '') not in ('anon', 'authenticated') then
    return new;
  end if;

  if new.status = 'sold'
    and (tg_op = 'INSERT' or (old.status <> 'sold' and old.first_published_at is null)) then
    raise exception 'listing_not_published' using errcode = 'P0001';
  end if;

  if tg_op <> 'INSERT' or new.status <> 'draft' then
    return new;
  end if;

  -- Locking the profile counts concurrent inserts one by one. Row-level
  -- BEFORE triggers see earlier rows of the same insert, so a CSV import is
  -- counted row by row and rolls back as a whole.
  select public.plan_draft_limit(p.plan) into seller_limit
  from public.profiles p
  where p.id = new.seller_id
  for update;

  select count(*) into open_drafts
  from public.listings l
  where l.seller_id = new.seller_id
    and l.status = 'draft'
    and l.first_published_at is null;

  if open_drafts >= seller_limit then
    raise exception 'draft_limit_exceeded' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

revoke execute on function public.enforce_draft_limit() from public, anon, authenticated;

create trigger listings_enforce_draft_limit
  before insert or update on public.listings
  for each row execute function public.enforce_draft_limit();
