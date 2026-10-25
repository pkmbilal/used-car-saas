-- Profile photos: any user may upload one from /account. Shown in the header
-- account menu, on private sellers' pages and on their listings.

alter table public.profiles
  add column avatar_key text; -- R2 key in the public bucket

-- Only keys the avatar presign step issues for this user.
alter table public.profiles
  add constraint profiles_avatar_key_own_prefix
    check (avatar_key like 'avatars/' || id::text || '/%');

-- Profiles use column-level grants (see private_phone_publish_quota); the
-- "Users can update their own profile" policy still limits writes to own row.
grant select (avatar_key) on public.profiles to anon, authenticated;
grant update (avatar_key) on public.profiles to authenticated;
