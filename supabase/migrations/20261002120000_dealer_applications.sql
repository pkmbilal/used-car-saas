-- Phase 3: dealer applications.
--
-- Sellers apply for a dealer plan with their business details and, optionally,
-- CR, VAT and Muroor numbers and documents. Documents go browser → private R2
-- bucket; the row only stores their keys. A moderator (service role) approves
-- the application and grants the plan, or rejects it with a reason.

create table public.dealer_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  business_name text not null check (char_length(business_name) between 2 and 80),
  showroom_address text check (char_length(showroom_address) <= 200),
  cr_number text check (char_length(cr_number) <= 30),
  vat_number text check (char_length(vat_number) <= 30),
  muroor_number text check (char_length(muroor_number) <= 30),
  requested_plan text not null check (requested_plan in ('dealer', 'dealer_pro')),
  -- R2 keys in the private bucket, only ones issued for this user.
  cr_doc_key text check (cr_doc_key like 'dealer-docs/' || user_id::text || '/%'),
  vat_doc_key text check (vat_doc_key like 'dealer-docs/' || user_id::text || '/%'),
  muroor_doc_key text check (muroor_doc_key like 'dealer-docs/' || user_id::text || '/%'),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reject_reason text check (char_length(reject_reason) <= 300),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id) on delete set null
);

-- At most one open application per user.
create unique index dealer_applications_one_pending_idx
  on public.dealer_applications (user_id)
  where status = 'pending';

create index dealer_applications_status_created_at_idx
  on public.dealer_applications (status, created_at);

alter table public.dealer_applications enable row level security;

create policy "Free sellers can apply for a dealer plan"
  on public.dealer_applications for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'seller'
        and p.suspended_at is null
        and p.plan = 'free'
    )
  );

create policy "Users can read their own dealer applications"
  on public.dealer_applications for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Users submit applications; only moderators (service role) review them.
revoke all on public.dealer_applications from anon;
revoke insert, update, delete on public.dealer_applications from authenticated;
grant insert (
  user_id, business_name, showroom_address, cr_number, vat_number, muroor_number,
  requested_plan, cr_doc_key, vat_doc_key, muroor_doc_key
) on public.dealer_applications to authenticated;
