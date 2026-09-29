-- Phase 3: dealer storefronts.
--
-- Branding fields shown on /sellers/[id] for sellers on a dealer plan. Any
-- user may write their own row (column grant below), but the app only renders
-- these fields while the plan is dealer or dealer_pro, so no plan check here.

alter table public.profiles
  add column business_name text
    check (char_length(business_name) between 2 and 80),
  add column about text
    check (char_length(about) <= 1000),
  add column logo_key text, -- R2 key in the public bucket
  add column showroom_address text
    check (char_length(showroom_address) <= 200);

-- Only keys the logo presign step issues for this user.
alter table public.profiles
  add constraint profiles_logo_key_own_prefix
    check (logo_key like 'logos/' || id::text || '/%');

-- Extends the (full_name, phone, city) grant from the init migration; the
-- "Users can update their own profile" policy still limits writes to own row.
grant update (business_name, about, logo_key, showroom_address)
  on public.profiles to authenticated;
