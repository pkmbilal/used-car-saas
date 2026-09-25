-- Phase 1 core schema: profiles, listings, listing_images.
-- Every table ships with RLS enabled and its policies in this migration.

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  city text,
  role text not null default 'buyer' check (role in ('buyer', 'seller')),
  created_at timestamptz not null default now() -- "member since"
);

alter table public.profiles enable row level security;

create policy "Profiles are publicly readable"
  on public.profiles for select
  to anon, authenticated
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Users may edit their contact details but not their role. Role changes go
-- through the service-role client (admin.ts) or a dedicated server action.
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (full_name, phone, city) on public.profiles to authenticated;

-- Create a profile row for every new auth user (email OTP or Google).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- listings
-- ---------------------------------------------------------------------------

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles (id) on delete cascade,
  make text not null,
  model text not null,
  year int not null check (year between 1950 and 2100),
  mileage int not null check (mileage >= 0),
  price numeric(12, 2) not null check (price > 0), -- SAR
  condition text not null check (condition in ('excellent', 'good', 'fair')),
  city text not null,
  fuel_type text not null check (fuel_type in ('petrol', 'diesel', 'hybrid', 'electric')),
  status text not null default 'active' check (status in ('draft', 'active', 'sold')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index listings_status_created_at_idx on public.listings (status, created_at desc);
create index listings_status_price_idx on public.listings (status, price);
create index listings_make_idx on public.listings (make);
create index listings_city_idx on public.listings (city);
create index listings_seller_id_idx on public.listings (seller_id);

create trigger listings_set_updated_at
  before update on public.listings
  for each row execute function public.set_updated_at();

alter table public.listings enable row level security;

create policy "Active listings are public; sellers see their own"
  on public.listings for select
  to anon, authenticated
  using (status = 'active' or seller_id = (select auth.uid()));

create policy "Sellers can create their own listings"
  on public.listings for insert
  to authenticated
  with check (
    seller_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'seller'
    )
  );

create policy "Sellers can update their own listings"
  on public.listings for update
  to authenticated
  using (seller_id = (select auth.uid()))
  with check (seller_id = (select auth.uid()));

create policy "Sellers can delete their own listings"
  on public.listings for delete
  to authenticated
  using (seller_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- listing_images (files live in Cloudflare R2; we store the object key only)
-- ---------------------------------------------------------------------------

create table public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  r2_key text not null,
  position int not null default 0,
  created_at timestamptz not null default now(),
  unique (listing_id, position)
);

alter table public.listing_images enable row level security;

create policy "Images follow their listing's visibility"
  on public.listing_images for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id
        and (l.status = 'active' or l.seller_id = (select auth.uid()))
    )
  );

create policy "Sellers can add images to their own listings"
  on public.listing_images for insert
  to authenticated
  with check (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and l.seller_id = (select auth.uid())
    )
  );

create policy "Sellers can update images on their own listings"
  on public.listing_images for update
  to authenticated
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and l.seller_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and l.seller_id = (select auth.uid())
    )
  );

create policy "Sellers can delete images on their own listings"
  on public.listing_images for delete
  to authenticated
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and l.seller_id = (select auth.uid())
    )
  );
