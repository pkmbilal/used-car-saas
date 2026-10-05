-- Admin tooling: offline plan payments and a moderation audit log.
--
-- Until gateway billing lands, admins collect payment by bank transfer or cash
-- and grant the plan by hand. plan_payments records that money against the
-- plan change it paid for. admin_actions logs moderation decisions; plan
-- changes and featured grants already have their own logs.

-- ---------------------------------------------------------------------------
-- set_plan: return the plan_changes id so a payment can point at it
-- ---------------------------------------------------------------------------

drop function public.set_plan(uuid, text, timestamptz, uuid, text, text);

create function public.set_plan(
  p_user uuid,
  p_plan text,
  p_expires_at timestamptz,
  p_changed_by uuid,
  p_source text,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_plan text;
  new_expires_at timestamptz := case when p_plan = 'free' then null else p_expires_at end;
  change_id uuid;
begin
  select p.plan into old_plan
  from public.profiles p
  where p.id = p_user
  for update;

  if old_plan is null then
    raise exception 'profile_not_found' using errcode = 'P0001';
  end if;

  update public.profiles
  set plan = p_plan, plan_expires_at = new_expires_at
  where id = p_user;

  insert into public.plan_changes (user_id, from_plan, to_plan, expires_at, changed_by, source, note)
  values (p_user, old_plan, p_plan, new_expires_at, p_changed_by, p_source, nullif(trim(p_note), ''))
  returning id into change_id;

  return change_id;
end;
$$;

revoke execute on function public.set_plan(uuid, text, timestamptz, uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.set_plan(uuid, text, timestamptz, uuid, text, text)
  to service_role;

-- ---------------------------------------------------------------------------
-- plan_payments
-- ---------------------------------------------------------------------------

create table public.plan_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  plan_change_id uuid references public.plan_changes (id) on delete set null,
  amount numeric(10, 2) not null check (amount > 0), -- SAR
  method text not null check (method in ('bank_transfer', 'cash', 'other')),
  reference text check (char_length(reference) <= 100),
  recorded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index plan_payments_user_idx on public.plan_payments (user_id, created_at desc);
create index plan_payments_created_at_idx on public.plan_payments (created_at desc);

alter table public.plan_payments enable row level security;

create policy "Users can read their own payments"
  on public.plan_payments for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Only the service role (admin server code) writes here.
revoke all on public.plan_payments from anon;
revoke insert, update, delete on public.plan_payments from authenticated;

-- ---------------------------------------------------------------------------
-- admin_actions
-- ---------------------------------------------------------------------------

create table public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.profiles (id) on delete set null,
  action text not null check (action in (
    'listing_removed',
    'listing_restored',
    'reports_dismissed',
    'listing_unfeatured',
    'user_suspended',
    'user_unsuspended',
    'id_approved',
    'id_rejected',
    'id_revoked',
    'dealer_approved',
    'dealer_rejected'
  )),
  user_id uuid references public.profiles (id) on delete cascade, -- the affected user or seller
  listing_id uuid references public.listings (id) on delete set null,
  reason text check (char_length(reason) <= 300),
  created_at timestamptz not null default now()
);

create index admin_actions_created_at_idx on public.admin_actions (created_at desc);
create index admin_actions_user_idx on public.admin_actions (user_id, created_at desc);

-- Admin-only: read and written through the service role, so no policies.
alter table public.admin_actions enable row level security;

revoke all on public.admin_actions from anon, authenticated;
