-- Hide a live listing once enough different users report it. It stays in the
-- admin reports queue: restoring dismisses the reports, removing keeps it
-- hidden with the moderator's reason.

alter table public.admin_actions drop constraint admin_actions_action_check;
alter table public.admin_actions
  add constraint admin_actions_action_check check (action in (
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
    'dealer_rejected',
    'listing_auto_hidden'
  ));

-- Threshold and reason must match AUTO_HIDE_REPORT_THRESHOLD and
-- AUTO_HIDE_REASON in lib/moderation.ts.
create function public.auto_hide_reported_listing()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  listing_status text;
  listing_seller uuid;
  open_reports int;
begin
  -- Locking the listing counts concurrent reports one by one.
  select l.status, l.seller_id into listing_status, listing_seller
  from public.listings l
  where l.id = new.listing_id
  for update;

  if listing_status is distinct from 'active' then
    return null;
  end if;

  -- Only open reports count, so a listing an admin restored needs five new
  -- reporters to be hidden again.
  select count(*) into open_reports
  from public.listing_reports r
  where r.listing_id = new.listing_id
    and r.status = 'open';

  if open_reports < 5 then
    return null;
  end if;

  update public.listings
  set status = 'removed', removed_reason = 'Hidden for review after multiple reports'
  where id = new.listing_id;

  insert into public.admin_actions (admin_id, action, user_id, listing_id)
  values (null, 'listing_auto_hidden', listing_seller, new.listing_id);

  return null;
end;
$$;

create trigger listing_reports_auto_hide
  after insert on public.listing_reports
  for each row execute function public.auto_hide_reported_listing();

-- Triggers don't need EXECUTE on the caller's side; keep it off /rest/v1/rpc.
revoke execute on function public.auto_hide_reported_listing() from public, anon, authenticated;
