-- Free-text color and description for listings, shown on the listing page.
-- Both are optional, so existing listings stay valid. Existing listings RLS
-- policies cover the new columns.

alter table public.listings
  add column color text
    check (char_length(color) between 1 and 30),
  add column description text
    check (char_length(description) between 1 and 4000);
