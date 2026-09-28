-- Phase 2: keyword search on listings.
--
-- A stored generated column, so it can never drift from the row and needs no
-- trigger. 'simple' (no stemming) because the text is mostly car names and
-- places, which English stemming mangles; it also copes with Arabic later.
-- Existing listings RLS policies cover the new column.

alter table public.listings
  add column search_vector tsvector generated always as (
    to_tsvector(
      'simple',
      make || ' ' || model || ' ' || year::text || ' ' || city || ' '
        || fuel_type || ' ' || condition
    )
  ) stored;

create index listings_search_vector_idx on public.listings using gin (search_vector);
