-- Trigger functions are security definer but were left executable through
-- /rest/v1/rpc by the default PUBLIC grant. Triggers don't need EXECUTE on
-- the caller's side, so revoking it changes nothing for inserts/updates.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.sync_email_verified() from public, anon, authenticated;
revoke execute on function public.enforce_listing_quota() from public, anon, authenticated;

-- rls_auto_enable() was created from the dashboard, not a migration, so it
-- only exists on the hosted project.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;

-- Covering indexes for foreign keys flagged by the performance advisor.
create index if not exists admin_actions_admin_id_idx on public.admin_actions (admin_id);
create index if not exists admin_actions_listing_id_idx on public.admin_actions (listing_id);
create index if not exists dealer_applications_reviewed_by_idx on public.dealer_applications (reviewed_by);
create index if not exists featured_grants_granted_by_idx on public.featured_grants (granted_by);
create index if not exists featured_grants_listing_id_idx on public.featured_grants (listing_id);
create index if not exists featured_usage_granted_by_idx on public.featured_usage (granted_by);
create index if not exists id_verification_requests_reviewed_by_idx on public.id_verification_requests (reviewed_by);
create index if not exists listing_reports_reporter_id_idx on public.listing_reports (reporter_id);
create index if not exists listing_reports_resolved_by_idx on public.listing_reports (resolved_by);
create index if not exists plan_changes_changed_by_idx on public.plan_changes (changed_by);
create index if not exists plan_payments_plan_change_id_idx on public.plan_payments (plan_change_id);
create index if not exists plan_payments_recorded_by_idx on public.plan_payments (recorded_by);
