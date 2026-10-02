-- Contact clicks per listing: how often buyers tap Call or WhatsApp.
--
-- Stored next to the view count in listing_view_counts, so the existing
-- "Sellers can read their own listing views" policy covers reads. Writes only
-- go through increment_listing_contact(); there are no insert/update policies.

alter table public.listing_view_counts
  add column calls int not null default 0 check (calls >= 0),
  add column whatsapps int not null default 0 check (whatsapps >= 0);

-- Counts one contact click on an active listing. The seller's own clicks are
-- ignored, as are unknown kinds.
create function public.increment_listing_contact(p_listing_id uuid, p_kind text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.listing_view_counts (listing_id, calls, whatsapps)
  select l.id, (p_kind = 'call')::int, (p_kind = 'whatsapp')::int
  from public.listings l
  where l.id = p_listing_id
    and l.status = 'active'
    and l.seller_id is distinct from (select auth.uid())
    and p_kind in ('call', 'whatsapp')
  on conflict (listing_id)
    do update set
      calls = public.listing_view_counts.calls + excluded.calls,
      whatsapps = public.listing_view_counts.whatsapps + excluded.whatsapps;
$$;

revoke execute on function public.increment_listing_contact(uuid, text) from public;
grant execute on function public.increment_listing_contact(uuid, text) to anon, authenticated;
