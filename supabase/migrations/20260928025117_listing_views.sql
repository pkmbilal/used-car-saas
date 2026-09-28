-- Phase 2: view counter per listing.
--
-- Counts live in their own table rather than a column on listings, so a view
-- doesn't bump listings.updated_at and sellers can't edit their own count via
-- the "update own listings" policy. Writes only go through
-- increment_listing_view(); there are no insert/update policies.

create table public.listing_view_counts (
  listing_id uuid primary key references public.listings (id) on delete cascade,
  views int not null default 0 check (views >= 0)
);

alter table public.listing_view_counts enable row level security;

create policy "Sellers can read their own listing views"
  on public.listing_view_counts for select
  to authenticated
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and l.seller_id = (select auth.uid())
    )
  );

-- Counts one view of an active listing. The seller's own views are ignored.
create function public.increment_listing_view(p_listing_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.listing_view_counts (listing_id, views)
  select l.id, 1
  from public.listings l
  where l.id = p_listing_id
    and l.status = 'active'
    and l.seller_id is distinct from (select auth.uid())
  on conflict (listing_id)
    do update set views = public.listing_view_counts.views + 1;
$$;

revoke execute on function public.increment_listing_view(uuid) from public;
grant execute on function public.increment_listing_view(uuid) to anon, authenticated;
