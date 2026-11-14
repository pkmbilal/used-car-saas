-- Free launch: listings are free for everyone, including dealers. A seller
-- whose Commercial Registration is approved gets the 'dealer' plan ("Verified
-- Dealer") with no expiry and no payment. dealer_pro/showroom stay valid plan
-- values (existing sellers keep them; admins can still grant them) but are no
-- longer offered on the site.
--
-- Function replacements only: no schema or data changes. Each value must match
-- lib/plans.ts.

-- Verified dealers: 100 listings a month (DEALER_MONTHLY_LISTING_LIMIT).
create or replace function public.plan_monthly_listing_limit(plan text)
returns int
language sql
immutable
set search_path = ''
as $$
  select case plan
    when 'free' then 3
    when 'dealer' then 100
    when 'dealer_pro' then 100
    else null
  end;
$$;

-- 15 photos per listing on every plan (PHOTO_LIMIT_PER_LISTING). Listings that
-- already have more keep them; only new uploads are refused.
create or replace function public.plan_photo_limit(plan text)
returns int
language sql
immutable
set search_path = ''
as $$
  select 15;
$$;

-- Verified dealers hold as many drafts as Pro (DRAFT_LIMIT).
create or replace function public.plan_draft_limit(plan text)
returns int
language sql
immutable
set search_path = ''
as $$
  select case plan
    when 'free' then 5
    when 'dealer' then 200
    when 'dealer_pro' then 200
    when 'showroom' then 500
    else 5
  end;
$$;

-- Verified dealers get the 30-day insights Pro had (INSIGHTS_DAYS).
create or replace function public.plan_insights_days(p_plan text)
returns int
language sql
immutable
set search_path = ''
as $$
  select case p_plan
    when 'dealer' then 30
    when 'dealer_pro' then 30
    when 'showroom' then 90
    else 0
  end;
$$;

-- An expiring plan falls back to 'dealer' (no expiry) when the seller has an
-- approved dealer application, so verified dealers never lose their features.
create or replace function public.expire_plans()
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  expired record;
  expired_count int := 0;
begin
  for expired in
    select
      p.id,
      exists (
        select 1 from public.dealer_applications a
        where a.user_id = p.id and a.status = 'approved'
      ) as verified
    from public.profiles p
    where p.plan <> 'free' and p.plan_expires_at <= now()
    for update of p skip locked
  loop
    if expired.verified then
      perform public.set_plan(expired.id, 'dealer', null, null, 'expiry', 'Verified dealer (free launch)');
    else
      perform public.set_plan(expired.id, 'free', null, null, 'expiry', null);
    end if;
    expired_count := expired_count + 1;
  end loop;
  return expired_count;
end;
$$;

revoke execute on function public.expire_plans() from public, anon, authenticated;
grant execute on function public.expire_plans() to service_role;
