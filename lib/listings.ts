import "server-only";
import { cache } from "react";
import { CITIES, isCity } from "@/lib/cities";
import {
  BODY_TYPES,
  CONDITIONS,
  FEATURE_VALUES,
  FUEL_TYPES,
  TRANSMISSIONS,
  type BodyType,
  type Condition,
  type Feature,
  type FuelType,
  type Transmission,
} from "@/lib/listing-options";
import { isMake, MAKES, modelsFor } from "@/lib/makes";
import { publicUrl } from "@/lib/r2";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

// search_vector is a DB-only search column; it is stripped before rows leave lib/.
export type Listing = Omit<Database["public"]["Tables"]["listings"]["Row"], "search_vector">;
export type ListingImage = Database["public"]["Tables"]["listing_images"]["Row"];
export type ListingStatus = Listing["status"];

export type ListingInput = Pick<
  Listing,
  | "make"
  | "model"
  | "year"
  | "mileage"
  | "price"
  | "condition"
  | "city"
  | "fuel_type"
  | "transmission"
  | "body_type"
  | "features"
>;

function includes<T extends string>(list: readonly T[], value: unknown): value is T {
  return typeof value === "string" && (list as readonly string[]).includes(value);
}

function parseWholeNumber(value: FormDataEntryValue | null): number | null {
  const text = String(value ?? "").replace(/[,\s]/g, "");
  return /^\d+$/.test(text) ? Number(text) : null;
}

// Case- and whitespace-insensitive, returning the canonical spelling, so CSV
// values like "toyota" or " RIYADH " are accepted.
function matchOption<T extends string>(list: readonly T[], value: string | null): T | null {
  const key = value?.trim().toLowerCase();
  return (key && list.find((option) => option.toLowerCase() === key)) || null;
}

// "a, b;c" -> the known values among a, b, c (case-insensitive, de-duplicated).
// Used for the features field and for multi-value search filters.
function matchOptions<T extends string>(list: readonly T[], value: string | null | undefined): T[] {
  const matched = (value ?? "")
    .split(/[,;]/)
    .map((part) => matchOption(list, part))
    .filter((option): option is T => option !== null);
  return [...new Set(matched)];
}

export const LISTING_BOUNDS = {
  minYear: 1950,
  maxModelLength: 60,
  maxMileage: 2_000_000,
  maxPrice: 100_000_000,
} as const;

export function maxListingYear(): number {
  return new Date().getFullYear() + 1;
}

export type ListingFieldError = { error: string; field: keyof ListingInput };

// Shared by the listing form and CSV import; `get` reads one raw field value.
export function parseListingFields(
  get: (field: keyof ListingInput) => string | null,
): { data: ListingInput } | ListingFieldError {
  const make = matchOption(MAKES, get("make"));
  const rawModel = (get("model") ?? "").trim();
  // Known models get their canonical spelling; anything else is kept as typed.
  const model = (make && matchOption(modelsFor(make), rawModel)) || rawModel;
  const year = parseWholeNumber(get("year"));
  const mileage = parseWholeNumber(get("mileage"));
  const price = parseWholeNumber(get("price"));
  const condition = matchOption(CONDITIONS, get("condition"));
  const city = matchOption(CITIES, get("city"));
  const fuelType = matchOption(FUEL_TYPES, get("fuel_type"));
  const transmission = matchOption(TRANSMISSIONS, get("transmission"));
  const bodyType = matchOption(BODY_TYPES, get("body_type"));
  const features = matchOptions(FEATURE_VALUES, get("features"));
  const maxYear = maxListingYear();
  const { minYear, maxModelLength, maxMileage, maxPrice } = LISTING_BOUNDS;

  if (!make) return { error: "Choose a make.", field: "make" };
  if (model.length < 1 || model.length > maxModelLength) {
    return { error: "Enter the model.", field: "model" };
  }
  if (year === null || year < minYear || year > maxYear) {
    return { error: `Enter a year between ${minYear} and ${maxYear}.`, field: "year" };
  }
  if (mileage === null || mileage > maxMileage) {
    return { error: "Enter the mileage in km.", field: "mileage" };
  }
  if (price === null || price <= 0 || price > maxPrice) {
    return { error: "Enter the price in SAR.", field: "price" };
  }
  if (!condition) return { error: "Choose the condition.", field: "condition" };
  if (!city) return { error: "Choose a city.", field: "city" };
  if (!fuelType) return { error: "Choose the fuel type.", field: "fuel_type" };
  if (!transmission) return { error: "Choose the transmission.", field: "transmission" };
  if (!bodyType) return { error: "Choose the body style.", field: "body_type" };

  return {
    data: {
      make,
      model,
      year,
      mileage,
      price,
      condition,
      city,
      fuel_type: fuelType,
      transmission,
      body_type: bodyType,
      features,
    },
  };
}

export function parseListing(
  formData: FormData,
): { data: ListingInput } | { error: string } {
  return parseListingFields((field) => {
    // Features are a checkbox group: one entry per ticked box.
    if (field === "features") return formData.getAll(field).filter((v) => typeof v === "string").join(",");
    const value = formData.get(field);
    return typeof value === "string" ? value : null;
  });
}

export type ListingWithImages = Listing & {
  images: (ListingImage & { url: string })[];
};

export function withImageUrls<
  T extends Listing & { listing_images: ListingImage[]; search_vector?: unknown },
>(listing: T): Omit<T, "listing_images" | "search_vector"> & Pick<ListingWithImages, "images"> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- dropped so it isn't sent to the client
  const { listing_images, search_vector, ...rest } = listing;
  return {
    ...rest,
    images: [...listing_images]
      .sort((a, b) => a.position - b.position)
      .map((image) => ({ ...image, url: publicUrl(image.r2_key) })),
  };
}

// RLS-scoped: returns only the signed-in seller's listings.
export async function getSellerListings(
  sellerId: string,
): Promise<(ListingWithImages & { views: number })[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select("*, listing_images(*), listing_view_counts(views)")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(({ listing_view_counts, ...listing }) => ({
    ...withImageUrls(listing),
    views: listing_view_counts?.views ?? 0,
  }));
}

export type ListingStats = { views: number; calls: number; whatsapps: number };

// RLS-scoped: all zeros unless the signed-in user owns the listing.
export async function getListingStats(listingId: string): Promise<ListingStats> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("listing_view_counts")
    .select("views, calls, whatsapps")
    .eq("listing_id", listingId)
    .maybeSingle();
  return data ?? { views: 0, calls: 0, whatsapps: 0 };
}

// Best effort: a failed count must never break the listing page.
export async function recordListingView(listingId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc("increment_listing_view", { p_listing_id: listingId });
}

export const CONTACT_KINDS = ["call", "whatsapp"] as const;
export type ContactKind = (typeof CONTACT_KINDS)[number];

export function isContactKind(value: unknown): value is ContactKind {
  return includes(CONTACT_KINDS, value);
}

// Best effort, like recordListingView.
export async function recordListingContact(listingId: string, kind: ContactKind): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc("increment_listing_contact", { p_listing_id: listingId, p_kind: kind });
}

// Returns null unless the listing exists and belongs to the seller.
export async function getSellerListing(
  sellerId: string,
  listingId: string,
): Promise<ListingWithImages | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("listings")
    .select("*, listing_images(*)")
    .eq("id", listingId)
    .eq("seller_id", sellerId)
    .maybeSingle();
  return data ? withImageUrls(data) : null;
}

// ---------------------------------------------------------------------------
// Public browse / detail. RLS limits anonymous reads to active listings; the
// explicit status filters keep a signed-in seller's drafts out of results.
// ---------------------------------------------------------------------------

export const PAGE_SIZE = 24;
export const SORTS = ["newest", "price_asc", "price_desc", "mileage_asc", "year_desc"] as const;
export type Sort = (typeof SORTS)[number];

export type ListingFilters = {
  q?: string;
  make?: string;
  model?: string;
  city?: string;
  conditions: Condition[];
  fuelTypes: FuelType[];
  bodyTypes: BodyType[];
  transmissions: Transmission[];
  // Listings must have every one of these.
  features: Feature[];
  maxMileage?: number;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  sort: Sort;
  page: number;
};

type SearchParams = Record<string, string | string[] | undefined>;

function param(searchParams: SearchParams, key: string): string | undefined {
  const value = searchParams[key];
  return typeof value === "string" && value !== "" ? value : undefined;
}

// Multi-value filters travel as one comma-separated param ("hybrid,electric");
// repeated params are accepted too.
function listParam<T extends string>(searchParams: SearchParams, key: string, list: readonly T[]): T[] {
  const value = searchParams[key];
  return matchOptions(list, Array.isArray(value) ? value.join(",") : value);
}

function numberParam(searchParams: SearchParams, key: string): number | undefined {
  const value = param(searchParams, key);
  if (value === undefined) return undefined;
  const number = parseWholeNumber(value);
  return number === null ? undefined : number;
}

// Invalid values are dropped rather than erroring: these come from the URL.
export function parseListingFilters(searchParams: SearchParams): ListingFilters {
  const rawMake = param(searchParams, "make");
  const make = isMake(rawMake) ? rawMake : undefined;
  // A model only counts alongside its make, and only if it's a known one.
  const model = make ? matchOption(modelsFor(make), param(searchParams, "model") ?? null) : null;
  const city = param(searchParams, "city");
  const sort = param(searchParams, "sort");
  const page = numberParam(searchParams, "page");

  return {
    q: param(searchParams, "q")?.trim().slice(0, 100) || undefined,
    make,
    model: model ?? undefined,
    city: isCity(city) ? city : undefined,
    conditions: listParam(searchParams, "condition", CONDITIONS),
    fuelTypes: listParam(searchParams, "fuel_type", FUEL_TYPES),
    bodyTypes: listParam(searchParams, "body_type", BODY_TYPES),
    transmissions: listParam(searchParams, "transmission", TRANSMISSIONS),
    features: listParam(searchParams, "features", FEATURE_VALUES),
    maxMileage: numberParam(searchParams, "max_mileage"),
    minPrice: numberParam(searchParams, "min_price"),
    maxPrice: numberParam(searchParams, "max_price"),
    minYear: numberParam(searchParams, "min_year"),
    maxYear: numberParam(searchParams, "max_year"),
    sort: includes(SORTS, sort) ? sort : "newest",
    page: page && page > 0 ? page : 1,
  };
}

// "cam 2020" -> "cam:* & 2020:*". Only letters and digits survive, so user
// input can never produce a tsquery syntax error.
export function toPrefixTsQuery(q: string): string | null {
  const tokens = q
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .slice(0, 8);
  return tokens.length ? tokens.map((token) => `${token}:*`).join(" & ") : null;
}

// The query-param form of the search filters (sort and page excluded), as
// read back by parseListingFilters.
export function listingFiltersToParams(filters: ListingFilters): Record<string, string> {
  const list = (values: string[]) => (values.length ? values.join(",") : undefined);
  const entries: [string, string | number | undefined][] = [
    ["q", filters.q],
    ["make", filters.make],
    ["model", filters.model],
    ["city", filters.city],
    ["condition", list(filters.conditions)],
    ["fuel_type", list(filters.fuelTypes)],
    ["body_type", list(filters.bodyTypes)],
    ["transmission", list(filters.transmissions)],
    ["features", list(filters.features)],
    ["max_mileage", filters.maxMileage],
    ["min_price", filters.minPrice],
    ["max_price", filters.maxPrice],
    ["min_year", filters.minYear],
    ["max_year", filters.maxYear],
  ];
  return Object.fromEntries(
    entries.flatMap(([key, value]) => (value === undefined ? [] : [[key, String(value)]])),
  );
}

// The subset of the PostgREST filter builder used below, so any select on
// listings (full rows or a head-only count) can share the same filters.
interface ListingFilterQuery {
  eq(column: "status" | "make" | "city", value: string): this;
  in(column: "condition", values: readonly Condition[]): this;
  in(column: "fuel_type", values: readonly FuelType[]): this;
  in(column: "body_type", values: readonly BodyType[]): this;
  in(column: "transmission", values: readonly Transmission[]): this;
  contains(column: "features", values: string[]): this;
  gte(column: "price" | "year", value: number): this;
  lte(column: "price" | "year" | "mileage", value: number): this;
  ilike(column: "model", pattern: string): this;
  textSearch(column: "search_vector", query: string, options: { config: string }): this;
}

// Active listings matching the filters (sort and page are applied by callers).
export function applyListingFilters<Q extends ListingFilterQuery>(
  query: Q,
  filters: ListingFilters,
): Q {
  query = query.eq("status", "active");
  const tsQuery = filters.q ? toPrefixTsQuery(filters.q) : null;
  if (tsQuery) query = query.textSearch("search_vector", tsQuery, { config: "simple" });
  if (filters.make) query = query.eq("make", filters.make);
  // Case-insensitive exact match; known model names contain no % or _.
  if (filters.model) query = query.ilike("model", filters.model);
  if (filters.city) query = query.eq("city", filters.city);
  if (filters.conditions.length) query = query.in("condition", filters.conditions);
  if (filters.fuelTypes.length) query = query.in("fuel_type", filters.fuelTypes);
  if (filters.bodyTypes.length) query = query.in("body_type", filters.bodyTypes);
  if (filters.transmissions.length) query = query.in("transmission", filters.transmissions);
  if (filters.features.length) query = query.contains("features", filters.features);
  if (filters.maxMileage !== undefined) query = query.lte("mileage", filters.maxMileage);
  if (filters.minPrice !== undefined) query = query.gte("price", filters.minPrice);
  if (filters.maxPrice !== undefined) query = query.lte("price", filters.maxPrice);
  if (filters.minYear !== undefined) query = query.gte("year", filters.minYear);
  if (filters.maxYear !== undefined) query = query.lte("year", filters.maxYear);
  return query;
}

export async function searchListings(
  filters: ListingFilters,
): Promise<{ listings: ListingWithImages[]; total: number }> {
  const supabase = await createClient();
  let query = applyListingFilters(
    supabase.from("listings").select("*, listing_images(*)", { count: "exact" }),
    filters,
  );

  // Newest first breaks ties for every other sort.
  if (filters.sort === "price_asc" || filters.sort === "price_desc") {
    query = query.order("price", { ascending: filters.sort === "price_asc" });
  } else if (filters.sort === "mileage_asc") {
    query = query.order("mileage", { ascending: true });
  } else if (filters.sort === "year_desc") {
    query = query.order("year", { ascending: false });
  }
  query = query.order("created_at", { ascending: false });

  const from = (filters.page - 1) * PAGE_SIZE;
  const { data, count, error } = await query.range(from, from + PAGE_SIZE - 1);
  // Out-of-range pages error in PostgREST; treat them as empty.
  if (error) return { listings: [], total: count ?? 0 };
  return { listings: data.map(withImageUrls), total: count ?? 0 };
}

export function isFeatured(listing: Pick<Listing, "featured_until">): boolean {
  return listing.featured_until !== null && new Date(listing.featured_until).getTime() > Date.now();
}

// Currently featured active listings matching the filters, most recently
// boosted first. Shown above the regular results, which keep their own sort.
export async function getFeaturedListings(
  filters: ListingFilters,
  limit = 4,
): Promise<ListingWithImages[]> {
  const supabase = await createClient();
  const { data, error } = await applyListingFilters(
    supabase.from("listings").select("*, listing_images(*)"),
    filters,
  )
    .gt("featured_until", new Date().toISOString())
    .order("featured_until", { ascending: false })
    .limit(limit);
  if (error) return [];
  return data.map(withImageUrls);
}

export async function getLatestListings(limit: number): Promise<ListingWithImages[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select("*, listing_images(*)")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data.map(withImageUrls);
}

export type FacetCounts = {
  total: number;
  makes: Map<string, number>;
  cities: Map<string, number>;
  conditions: Map<Condition, number>;
  fuelTypes: Map<Listing["fuel_type"], number>;
  bodyTypes: Map<BodyType, number>;
  transmissions: Map<Transmission, number>;
};

function tally<T>(values: T[]): Map<T, number> {
  const counts = new Map<T, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  // Most common first.
  return new Map([...counts].sort((a, b) => b[1] - a[1]));
}

// Active-listing counts per make, city and fuel type for browse UI. Tallied in
// JS from one narrow select, which is fine at current volume; move this to a
// grouped RPC once the listings table gets large (PostgREST's max-rows setting,
// 1000 by default, would otherwise cap the counts).
export const getActiveFacetCounts = cache(async (): Promise<FacetCounts> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select("make, city, condition, fuel_type, body_type, transmission")
    .eq("status", "active");
  if (error) throw error;
  return {
    total: data.length,
    makes: tally(data.map((row) => row.make)),
    cities: tally(data.map((row) => row.city)),
    conditions: tally(data.map((row) => row.condition)),
    fuelTypes: tally(data.map((row) => row.fuel_type)),
    bodyTypes: tally(data.flatMap((row) => (row.body_type ? [row.body_type] : []))),
    transmissions: tally(data.flatMap((row) => (row.transmission ? [row.transmission] : []))),
  };
});

// The newest active listings in each of the given cities, up to perCity each.
export async function getLatestByCities(
  cities: string[],
  perCity = 3,
): Promise<Record<string, ListingWithImages[]>> {
  const result: Record<string, ListingWithImages[]> = Object.fromEntries(cities.map((city) => [city, []]));
  if (cities.length === 0) return result;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select("*, listing_images(*)")
    .eq("status", "active")
    .in("city", cities)
    .order("created_at", { ascending: false })
    .limit(cities.length * perCity * 4);
  if (error) throw error;

  for (const listing of data) {
    const bucket = result[listing.city];
    if (bucket && bucket.length < perCity) bucket.push(withImageUrls(listing));
  }
  return result;
}

// Same make first, then cars in a similar price band, excluding the listing itself.
export async function getSimilarListings(
  listing: Pick<Listing, "id" | "make" | "price">,
  limit = 4,
): Promise<ListingWithImages[]> {
  const supabase = await createClient();
  const base = () =>
    supabase
      .from("listings")
      .select("*, listing_images(*)")
      .eq("status", "active")
      .neq("id", listing.id)
      .order("created_at", { ascending: false })
      .limit(limit);

  const { data: sameMake, error } = await base().eq("make", listing.make);
  if (error) return [];
  const similar = sameMake.map(withImageUrls);
  if (similar.length >= limit) return similar;

  const { data: samePrice } = await base()
    .neq("make", listing.make)
    .gte("price", Math.floor(listing.price * 0.75))
    .lte("price", Math.ceil(listing.price * 1.25));
  return [...similar, ...(samePrice ?? []).map(withImageUrls)].slice(0, limit);
}

// Active listings for everyone; drafts/sold only for their owner (via RLS).
export async function getPublicListing(listingId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select("*, listing_images(*), seller:profiles!listings_seller_id_fkey(id, full_name, phone, city, created_at, email_verified_at, id_verified_at, plan, business_name, about, logo_key, showroom_address)")
    .eq("id", listingId)
    .maybeSingle();
  // A failed query would otherwise look like a missing listing (404).
  if (error) console.error("getPublicListing failed", error);
  return data ? withImageUrls(data) : null;
}

export async function getSellerProfile(sellerId: string) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, full_name, phone, city, created_at, email_verified_at, id_verified_at, plan, business_name, about, logo_key, showroom_address",
    )
    .eq("id", sellerId)
    .eq("role", "seller")
    .maybeSingle();
  if (!profile) return null;

  const { data: listings, error } = await supabase
    .from("listings")
    .select("*, listing_images(*)")
    .eq("seller_id", sellerId)
    .eq("status", "active")
    .order("created_at", { ascending: false });
  if (error) throw error;

  return { profile, listings: listings.map(withImageUrls) };
}
