-- Listing specs used by the Buy Cars filters: transmission, body style and a
-- fixed set of features. transmission and body_type are nullable so listings
-- created before this migration stay valid; the form requires them from now
-- on. Existing listings RLS policies cover the new columns.

alter table public.listings
  add column transmission text
    check (transmission in ('automatic', 'manual')),
  add column body_type text
    check (body_type in ('sedan', 'suv', 'hatchback', 'coupe', 'pickup', 'van')),
  add column features text[] not null default '{}'
    check (features <@ array[
      'sunroof', 'leather_seats', 'navigation', 'rear_camera', 'bluetooth',
      'parking_sensors', 'cruise_control', 'apple_carplay', 'android_auto',
      'keyless_entry', 'climate_control', 'alloy_wheels'
    ]::text[]);

create index listings_body_type_idx on public.listings (body_type);
create index listings_features_idx on public.listings using gin (features);
