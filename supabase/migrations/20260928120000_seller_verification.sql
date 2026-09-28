-- Phase 2: seller verification badges.
--
-- Two tiers, both shown publicly on the seller's profile:
--   * email verified — mirrored from auth.users.email_confirmed_at
--   * ID verified    — seller uploads ID documents to a private R2 bucket and
--                      a moderator approves the request
--
-- Moderator actions run through the service-role client, like reports.

-- ---------------------------------------------------------------------------
-- profiles: badge columns
-- ---------------------------------------------------------------------------

-- Not in the "grant update (full_name, phone, city)" list from the init
-- migration, so users cannot set them.
alter table public.profiles
  add column email_verified_at timestamptz,
  add column id_verified_at timestamptz;

update public.profiles p
set email_verified_at = u.email_confirmed_at
from auth.users u
where u.id = p.id;

-- auth.users isn't publicly readable, so copy the confirmation onto the
-- profile. Runs after handle_new_user, which creates the profile row.
create or replace function public.sync_email_verified()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set email_verified_at = new.email_confirmed_at
  where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_confirmed
  after insert or update of email_confirmed_at on auth.users
  for each row execute function public.sync_email_verified();

-- ---------------------------------------------------------------------------
-- id_verification_requests
-- ---------------------------------------------------------------------------

-- doc_keys point at objects in the private R2 bucket. They are deleted and the
-- array emptied once a moderator decides, so ID copies aren't kept around.
create table public.id_verification_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  doc_keys text[] not null check (cardinality(doc_keys) <= 2),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reject_reason text check (char_length(reject_reason) <= 300),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id) on delete set null,
  check (status <> 'pending' or cardinality(doc_keys) >= 1)
);

-- At most one open request per user.
create unique index id_verification_requests_one_pending_idx
  on public.id_verification_requests (user_id)
  where status = 'pending';

create index id_verification_requests_status_created_at_idx
  on public.id_verification_requests (status, created_at);

alter table public.id_verification_requests enable row level security;

create policy "Unverified sellers can request ID verification"
  on public.id_verification_requests for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'seller'
        and p.suspended_at is null
        and p.id_verified_at is null
    )
  );

create policy "Users can read their own verification requests"
  on public.id_verification_requests for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Users submit requests; only moderators (service role) review them.
revoke all on public.id_verification_requests from anon;
revoke insert, update, delete on public.id_verification_requests from authenticated;
grant insert (user_id, doc_keys) on public.id_verification_requests to authenticated;
