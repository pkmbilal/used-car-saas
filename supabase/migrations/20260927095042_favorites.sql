-- Phase 2: favorites / saved listings (per user, private).

create table public.favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  listing_id uuid not null references public.listings (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

create index favorites_listing_id_idx on public.favorites (listing_id);

alter table public.favorites enable row level security;

create policy "Users can read their own favorites"
  on public.favorites for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can add their own favorites"
  on public.favorites for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can remove their own favorites"
  on public.favorites for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- Rows are toggled by insert/delete; there is nothing to update.
revoke update on public.favorites from anon, authenticated;
