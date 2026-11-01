-- Storage keys must live under their owner's folder. Users can write these
-- columns through the REST API, and the server deletes whatever key a row
-- holds from R2, so without this a seller could point a row at someone
-- else's photo and then delete it.

alter table public.listing_images
  add constraint listing_images_r2_key_owned
  check (r2_key like 'listings/' || listing_id::text || '/%');

alter table public.profiles
  add constraint profiles_avatar_key_owned
  check (avatar_key is null or avatar_key like 'avatars/' || id::text || '/%');

alter table public.profiles
  add constraint profiles_logo_key_owned
  check (logo_key is null or logo_key like 'logos/' || id::text || '/%');
