import "server-only";
import { cache } from "react";
import { arabicToStoredNames } from "@/lib/car-names";
import { CITIES, isCity } from "@/lib/cities";
import {
  BODY_TYPES,
  CONDITIONS,
  FEATURE_VALUES,
  FUEL_TYPES,
  LISTING_TYPES,
  MAX_COLOR_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  TRANSMISSIONS,
  type BodyType,
  type Condition,
  type Feature,
  type FuelType,
  type ListingType,
  type Transmission,
} from "@/lib/listing-options";
import { isMake, MAKES, modelsFor } from "@/lib/makes";
import { isDealerPlan, type Plan } from "@/lib/plans";
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
  | "color"
  | "description"
>;

// Rental-only fields; all null on sale listings (enforced by a DB check).
export type RentalInput = Pick<
  Listing,
  "listing_type" | "weekly_price" | "monthly_price" | "min_rental_days" | "deposit" | "daily_km_limit"
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
  maxColorLength: MAX_COLOR_LENGTH,
  maxDescriptionLength: MAX_DESCRIPTION_LENGTH,
} as const;

// Optional free text: blank means "not given".
function optionalText(value: string | null): string | null {
  const text = value?.trim();
  return text ? text : null;
}

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
  const color = optionalText(get("color"));
  // Normalize line endings so the length check matches what the database stores.
  const description = optionalText(get("description")?.replace(/\r\n/g, "\n") ?? null);
  const maxYear = maxListingYear();
  const { minYear, maxModelLength, maxMileage, maxPrice, maxColorLength, maxDescriptionLength } =
    LISTING_BOUNDS;

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
  if (color && color.length > maxColorLength) {
    return { error: `Keep the color under ${maxColorLength} characters.`, field: "color" };
  }
  if (description && description.length > maxDescriptionLength) {
    return {
      error: `Keep the description under ${maxDescriptionLength.toLocaleString("en")} characters.`,
      field: "description",
    };
  }

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
      color,
      description,
    },
  };
}

export const RENTAL_BOUNDS = {
  maxMinDays: 90,
  maxKmLimit: 10_000,
} as const;

const SALE_FIELDS: RentalInput = {
  listing_type: "sale",
  weekly_price: null,
  monthly_price: null,
  min_rental_days: null,
  deposit: null,
  daily_km_limit: null,
};

// Blank means "not given"; anything else must be a whole number.
function optionalWholeNumber(value: string | null): number | null | undefined {
  const text = (value ?? "").replace(/[,\s]/g, "");
  if (text === "") return null;
  return /^\d+$/.test(text) ? Number(text) : undefined;
}

// The listing form's sale/rent fields. For rentals `price` is the daily rate,
// so it's validated by parseListingFields; this checks the rest against it.
// Limits must match supabase/migrations/*_rental_listings.sql.
export function parseRentalFields(
  get: (field: keyof RentalInput) => string | null,
  dailyPrice: number,
): { data: RentalInput } | { error: string } {
  const type = matchOption(LISTING_TYPES, get("listing_type")) ?? "sale";
  if (type === "sale") return { data: SALE_FIELDS };

  const weekly = optionalWholeNumber(get("weekly_price"));
  const monthly = optionalWholeNumber(get("monthly_price"));
  const minDays = optionalWholeNumber(get("min_rental_days"));
  const deposit = optionalWholeNumber(get("deposit"));
  const kmLimit = optionalWholeNumber(get("daily_km_limit"));

  if (weekly === undefined || weekly === 0 || (weekly !== null && weekly >= dailyPrice * 7)) {
    return { error: "The weekly rate must be less than 7 days at the daily rate." };
  }
  if (monthly === undefined || monthly === 0 || (monthly !== null && monthly >= dailyPrice * 30)) {
    return { error: "The monthly rate must be less than 30 days at the daily rate." };
  }
  if (minDays === undefined || (minDays !== null && (minDays < 1 || minDays > RENTAL_BOUNDS.maxMinDays))) {
    return { error: `The minimum rental must be between 1 and ${RENTAL_BOUNDS.maxMinDays} days.` };
  }
  if (deposit === undefined || (deposit !== null && deposit > LISTING_BOUNDS.maxPrice)) {
    return { error: "Enter the deposit in SAR." };
  }
  if (kmLimit === undefined || kmLimit === 0 || (kmLimit !== null && kmLimit > RENTAL_BOUNDS.maxKmLimit)) {
    return { error: "Enter the daily km limit, or leave it blank for unlimited." };
  }

  return {
    data: {
      listing_type: "rent",
      weekly_price: weekly,
      monthly_price: monthly,
      min_rental_days: minDays ?? 1,
      deposit,
      daily_km_limit: kmLimit,
    },
  };
}

export function parseListing(
  formData: FormData,
): { data: ListingInput & RentalInput } | { error: string } {
  const read = (field: string) => {
    const value = formData.get(field);
    return typeof value === "string" ? value : null;
  };
  const parsed = parseListingFields((field) => {
    // Features are a checkbox group: one entry per ticked box.
    if (field === "features") return formData.getAll(field).filter((v) => typeof v === "string").join(",");
    return read(field);
  });
  if ("error" in parsed) return parsed;
  const rental = parseRentalFields(read, parsed.data.price);
  if ("error" in rental) return rental;
  return { data: { ...parsed.data, ...rental.data } };
}

export function isRental(listing: Pick<Listing, "listing_type">): boolean {
  return listing.listing_type === "rent";
}

export type SellerType = "dealer" | "private";

export type ListingWithImages = Listing & {
  images: (ListingImage & { url: string })[];
  // Set by public card queries (LISTING_CARD_SELECT); shown as a badge.
  sellerType?: SellerType;
  // Set by public card queries; shown as an "ID verified" badge.
  sellerIdVerified?: boolean;
};

// Public listing cards: photos plus the seller's plan and ID status, for the card badges.
export const LISTING_CARD_SELECT =
  "*, listing_images(*), seller:profiles!listings_seller_id_fkey(plan, id_verified_at)";

export function toListingCard<
  T extends Listing & {
    listing_images: ListingImage[];
    seller: { plan: Plan; id_verified_at: string | null } | null;
  },
>({ seller, ...listing }: T): ListingWithImages {
  return {
    ...withImageUrls(listing),
    sellerType: seller ? (isDealerPlan(seller.plan) ? "dealer" : "private") : undefined,
    sellerIdVerified: !!seller?.id_verified_at,
  };
}

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
): Promise<(ListingWithImages & { stats: ListingStats })[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select("*, listing_images(*), listing_view_counts(views, calls, whatsapps)")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(({ listing_view_counts, ...listing }) => ({
    ...withImageUrls(listing),
    stats: listing_view_counts ?? { views: 0, calls: 0, whatsapps: 0 },
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
  // Sale and rental listings are browsed separately; sale is the default.
  type: ListingType;
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
    type: param(searchParams, "type") === "rent" ? "rent" : "sale",
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
    // Sale is the default, so it stays out of URLs.
    ["type", filters.type === "rent" ? "rent" : undefined],
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
  eq(column: "status" | "make" | "city" | "listing_type", value: string): this;
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
  query = query.eq("status", "active").eq("listing_type", filters.type);
  // Arabic make/model names match their stored English spelling.
  const tsQuery = filters.q ? toPrefixTsQuery(arabicToStoredNames(filters.q)) : null;
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
    supabase.from("listings").select(LISTING_CARD_SELECT, { count: "exact" }),
    filters,
  );

  // Newest (latest published or refreshed) first breaks ties for every other sort.
  if (filters.sort === "price_asc" || filters.sort === "price_desc") {
    query = query.order("price", { ascending: filters.sort === "price_asc" });
  } else if (filters.sort === "mileage_asc") {
    query = query.order("mileage", { ascending: true });
  } else if (filters.sort === "year_desc") {
    query = query.order("year", { ascending: false });
  }
  query = query.order("bumped_at", { ascending: false });

  const from = (filters.page - 1) * PAGE_SIZE;
  const { data, count, error } = await query.range(from, from + PAGE_SIZE - 1);
  // Out-of-range pages error in PostgREST; treat them as empty.
  if (error) return { listings: [], total: count ?? 0 };
  return { listings: data.map(toListingCard), total: count ?? 0 };
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
    supabase.from("listings").select(LISTING_CARD_SELECT),
    filters,
  )
    .gt("featured_until", new Date().toISOString())
    .order("featured_until", { ascending: false })
    .limit(limit);
  if (error) return [];
  return data.map(toListingCard);
}

// Every active listing's id and last edit, for the sitemap. Paged because the
// API returns at most 1,000 rows per request; Google caps a sitemap at 50,000.
export async function getSitemapListings(): Promise<Pick<Listing, "id" | "updated_at" | "city" | "make">[]> {
  const supabase = await createClient();
  const pageSize = 1000;
  const rows: Pick<Listing, "id" | "updated_at" | "city" | "make">[] = [];
  while (rows.length < 45000) {
    const { data, error } = await supabase
      .from("listings")
      .select("id, updated_at, city, make")
      .eq("status", "active")
      .order("id")
      .range(rows.length, rows.length + pageSize - 1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < pageSize) break;
  }
  return rows;
}

export async function getLatestListings(
  limit: number,
  type: ListingType = "sale",
): Promise<ListingWithImages[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select(LISTING_CARD_SELECT)
    .eq("status", "active")
    .eq("listing_type", type)
    .order("bumped_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data.map(toListingCard);
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
    .select(LISTING_CARD_SELECT)
    .eq("status", "active")
    .in("city", cities)
    .order("bumped_at", { ascending: false })
    .limit(cities.length * perCity * 4);
  if (error) throw error;

  for (const listing of data) {
    const bucket = result[listing.city];
    if (bucket && bucket.length < perCity) bucket.push(toListingCard(listing));
  }
  return result;
}

// Same make first, then cars in a similar price band, excluding the listing itself.
export async function getSimilarListings(
  listing: Pick<Listing, "id" | "make" | "price" | "listing_type">,
  limit = 4,
): Promise<ListingWithImages[]> {
  const supabase = await createClient();
  const base = () =>
    supabase
      .from("listings")
      .select(LISTING_CARD_SELECT)
      .eq("status", "active")
      .eq("listing_type", listing.listing_type)
      .neq("id", listing.id)
      .order("bumped_at", { ascending: false })
      .limit(limit);

  // Both run at once; the price-band results only fill what same-make leaves.
  const [{ data: sameMake, error }, { data: samePrice }] = await Promise.all([
    base().eq("make", listing.make),
    base()
      .neq("make", listing.make)
      .gte("price", Math.floor(listing.price * 0.75))
      .lte("price", Math.ceil(listing.price * 1.25)),
  ]);
  if (error) return [];
  return [...sameMake, ...(samePrice ?? [])].slice(0, limit).map(toListingCard);
}

// Active listings for everyone; drafts/sold only for their owner (via RLS).
export async function getPublicListing(listingId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select("*, listing_images(*), seller:profiles!listings_seller_id_fkey(id, full_name, has_phone, city, created_at, email_verified_at, id_verified_at, plan, business_name, about, logo_key, avatar_key, showroom_address)")
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
      "id, full_name, has_phone, city, created_at, email_verified_at, id_verified_at, plan, business_name, about, logo_key, avatar_key, showroom_address",
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
    .order("bumped_at", { ascending: false });
  if (error) throw error;

  return { profile, listings: listings.map(withImageUrls) };
}
