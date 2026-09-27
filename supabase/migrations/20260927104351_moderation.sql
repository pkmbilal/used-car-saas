-- Phase 2: report listing + admin moderation (post-moderation model).
--
-- Admin actions run through the service-role client (lib/supabase/admin.ts),
-- so admins need no extra RLS policies. There is no UI to grant admin; make
-- the first admin by hand in the SQL editor:
--   update public.profiles set is_admin = true where id = '<user uuid>';

-- ---------------------------------------------------------------------------
-- profiles: admin flag + suspension
-- ---------------------------------------------------------------------------

-- Neither column is in the "grant update (full_name, phone, city)" list from
-- the init migration, so users cannot change them.
alter table public.profiles
  add column is_admin boolean not null default false,
  add column suspended_at timestamptz;

-- ---------------------------------------------------------------------------
-- listings: 'removed' status (set by moderators only)
-- ---------------------------------------------------------------------------

alter table public.listings drop constraint listings_status_check;
alter table public.listings
  add constraint listings_status_check
    check (status in ('draft', 'active', 'sold', 'removed')),
  add column removed_reason text;

-- Suspended sellers cannot create listings.
drop policy "Sellers can create their own listings" on public.listings;
create policy "Sellers can create their own listings"
  on public.listings for insert
  to authenticated
  with check (
    seller_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'seller'
        and p.suspended_at is null
    )
  );

-- Sellers keep full control of their own rows except moderation state. The
-- service role (admin client) is exempt.
create or replace function public.guard_listing_moderation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.status = 'removed' or new.removed_reason is not null then
      raise exception 'Only moderators can remove listings' using errcode = '42501';
    end if;
  else
    if (old.status = 'removed') <> (new.status = 'removed')
      or new.removed_reason is distinct from old.removed_reason then
      raise exception 'Only moderators can remove or restore listings' using errcode = '42501';
    end if;
  end if;

  if new.status = 'active'
    and (tg_op = 'INSERT' or old.status <> 'active')
    and exists (
      select 1 from public.profiles p
      where p.id = new.seller_id and p.suspended_at is not null
    ) then
    raise exception 'Suspended sellers cannot publish listings' using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger listings_guard_moderation
  before insert or update on public.listings
  for each row execute function public.guard_listing_moderation();

-- ---------------------------------------------------------------------------
-- listing_reports
-- ---------------------------------------------------------------------------

create table public.listing_reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null
    check (reason in ('scam', 'spam', 'wrong_info', 'already_sold', 'offensive', 'other')),
  details text check (char_length(details) <= 1000),
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles (id) on delete set null,
  unique (listing_id, reporter_id)
);

create index listing_reports_status_created_at_idx
  on public.listing_reports (status, created_at desc);

alter table public.listing_reports enable row level security;

create policy "Users can report active listings they don't own"
  on public.listing_reports for insert
  to authenticated
  with check (
    reporter_id = (select auth.uid())
    and exists (
      select 1 from public.listings l
      where l.id = listing_id
        and l.status = 'active'
        and l.seller_id <> (select auth.uid())
    )
  );

create policy "Users can read their own reports"
  on public.listing_reports for select
  to authenticated
  using (reporter_id = (select auth.uid()));

-- Users file reports; only moderators (service role) triage them.
revoke all on public.listing_reports from anon;
revoke insert, update, delete on public.listing_reports from authenticated;
grant insert (listing_id, reporter_id, reason, details) on public.listing_reports to authenticated;
