-- Industrial equipment rentals. A listing is now a car (sale or rent) or a
-- piece of equipment (rent only). Equipment reuses everything listings have
-- (photos, quota, boosts, moderation, rental requests); `make` holds the
-- equipment brand. Limits and lists must match lib/equipment.ts and
-- lib/listings.ts (parseEquipmentFields).

alter table public.listings
  add column category text not null default 'car'
    check (category in ('car', 'equipment')),
  add column equipment_type text
    check (equipment_type in (
      'excavator', 'backhoe_loader', 'wheel_loader', 'bulldozer', 'skid_steer',
      'forklift', 'mobile_crane', 'boom_lift', 'scissor_lift', 'dump_truck',
      'roller', 'generator', 'compressor', 'water_tanker', 'other'
    )),
  add column operating_hours int check (operating_hours between 0 and 1000000),
  add column operator_included boolean;

-- Equipment has no odometer reading; cars still require one (below).
alter table public.listings alter column mileage drop not null;

alter table public.listings
  add constraint listings_category_fields check (
    (
      category = 'car'
      and mileage is not null
      and equipment_type is null
      and operating_hours is null
      and operator_included is null
    )
    or (
      category = 'equipment'
      and listing_type = 'rent'
      and equipment_type is not null
      and operator_included is not null
      and mileage is null
      and transmission is null
      and body_type is null
      and daily_km_limit is null
      and features = '{}'
    )
  );

create index listings_category_type_status_bumped_idx
  on public.listings (category, listing_type, status, bumped_at desc);

-- Rebuild keyword search so equipment types are searchable too.
drop index public.listings_search_vector_idx;
alter table public.listings drop column search_vector;
alter table public.listings
  add column search_vector tsvector generated always as (
    to_tsvector(
      'simple',
      make || ' ' || model || ' ' || year::text || ' ' || city || ' '
        || fuel_type || ' ' || condition || ' '
        || coalesce(replace(equipment_type, '_', ' '), '')
    )
  ) stored;
create index listings_search_vector_idx on public.listings using gin (search_vector);
