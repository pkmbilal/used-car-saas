-- Phase 2: saved searches with in-app alerts (per user, private).
--
-- filters holds the /listings query params (q, make, city, fuel_type,
-- min_price, max_price, min_year, max_year) and is re-validated by
-- parseListingFilters on read. "New" matches are active listings created
-- after last_seen_at, which resets whenever the user opens the search.

create table public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  filters jsonb not null check (jsonb_typeof(filters) = 'object'),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index saved_searches_user_id_created_at_idx
  on public.saved_searches (user_id, created_at desc);

alter table public.saved_searches enable row level security;

create policy "Users can read their own saved searches"
  on public.saved_searches for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can create their own saved searches"
  on public.saved_searches for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can update their own saved searches"
  on public.saved_searches for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users can delete their own saved searches"
  on public.saved_searches for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- Only the name and the "seen" marker change after creation.
revoke update on public.saved_searches from anon, authenticated;
grant update (name, last_seen_at) on public.saved_searches to authenticated;

-- Cap saved searches per user so the per-search "new" counts stay cheap.
create or replace function public.limit_saved_searches()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.saved_searches where user_id = new.user_id) >= 20 then
    raise exception 'You can save up to 20 searches' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger saved_searches_limit
  before insert on public.saved_searches
  for each row execute function public.limit_saved_searches();
