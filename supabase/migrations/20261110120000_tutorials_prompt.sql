-- Dealers see a one-time "watch the tutorials" popup in Seller Center; this
-- records when they dismissed it so it never shows again on any device.
alter table public.profiles
  add column tutorials_prompt_seen_at timestamptz;

-- Profiles use column grants; the existing "update own profile" RLS policy
-- limits this to the caller's own row.
grant update (tutorials_prompt_seen_at) on public.profiles to authenticated;
