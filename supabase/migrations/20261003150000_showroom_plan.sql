-- Phase 3: plan lineup for the pricing page.
--
--   free 3/month · dealer 30/month · dealer_pro ("Pro") 100/month ·
--   showroom unlimited
--
-- dealer_pro used to be unlimited; it is now capped at 100 and the new
-- showroom plan takes over unlimited listings. Plans are still granted by an
-- admin until billing lands.

alter table public.profiles
  drop constraint profiles_plan_check,
  add constraint profiles_plan_check
    check (plan in ('free', 'dealer', 'dealer_pro', 'showroom'));

alter table public.dealer_applications
  drop constraint dealer_applications_requested_plan_check,
  add constraint dealer_applications_requested_plan_check
    check (requested_plan in ('dealer', 'dealer_pro', 'showroom'));

-- Single source of truth for the limits; null means unlimited.
create or replace function public.plan_monthly_listing_limit(plan text)
returns int
language sql
immutable
set search_path = ''
as $$
  select case plan
    when 'free' then 3
    when 'dealer' then 30
    when 'dealer_pro' then 100
    else null
  end;
$$;
