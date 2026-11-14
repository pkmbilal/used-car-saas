-- Dealer business documents (VAT and Muroor), kept out of the sign-up form.
--
-- Dealers apply with just their CR (dealer_applications). Once on a dealer
-- plan they can add VAT and Muroor numbers and certificates from the
-- storefront page. One row per dealer, private to its owner and moderators
-- (service role). Documents go browser → private R2 bucket; the row only
-- stores their keys.

create table public.dealer_documents (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  vat_number text check (char_length(vat_number) <= 30),
  muroor_number text check (char_length(muroor_number) <= 30),
  -- R2 keys in the private bucket, only ones issued for this user.
  vat_doc_key text check (vat_doc_key like 'dealer-docs/' || user_id::text || '/%'),
  muroor_doc_key text check (muroor_doc_key like 'dealer-docs/' || user_id::text || '/%'),
  updated_at timestamptz not null default now()
);

alter table public.dealer_documents enable row level security;

create policy "Dealers can read their own business documents"
  on public.dealer_documents for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Writes need an active seller on a dealer plan (isDealerPlan: any paid tier).
create policy "Dealers can add their business documents"
  on public.dealer_documents for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'seller'
        and p.suspended_at is null
        and p.plan <> 'free'
    )
  );

create policy "Dealers can update their business documents"
  on public.dealer_documents for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'seller'
        and p.suspended_at is null
        and p.plan <> 'free'
    )
  );

revoke all on public.dealer_documents from anon;
revoke all on public.dealer_documents from authenticated;
grant select on public.dealer_documents to authenticated;
grant insert (user_id, vat_number, muroor_number, vat_doc_key, muroor_doc_key, updated_at)
  on public.dealer_documents to authenticated;
-- user_id is listed because upserts set it; the policy pins it to auth.uid().
grant update (user_id, vat_number, muroor_number, vat_doc_key, muroor_doc_key, updated_at)
  on public.dealer_documents to authenticated;
