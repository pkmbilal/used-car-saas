import "server-only";
import { isCity } from "@/lib/cities";
import { CONDITIONS, FUEL_TYPES } from "@/lib/listing-options";
import { isMake } from "@/lib/makes";
import { publicUrl } from "@/lib/r2";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

// search_vector is a DB-only search column; it is stripped before rows leave lib/.
export type Listing = Omit<Database["public"]["Tables"]["listings"]["Row"], "search_vector">;
export type ListingImage = Database["public"]["Tables"]["listing_images"]["Row"];
export type ListingStatus = Listing["status"];

export type ListingInput = Pick<
  Listing,
  "make" | "model" | "year" | "mileage" | "price" | "condition" | "city" | "fuel_type"
>;

function includes<T extends string>(list: readonly T[], value: unknown): value is T {
  return typeof value === "string" && (list as readonly string[]).includes(value);
}

function parseWholeNumber(value: FormDataEntryValue | null): number | null {
  const text = String(value ?? "").replace(/[,\s]/g, "");
  return /^\d+$/.test(text) ? Number(text) : null;
}

export function parseListing(
  formData: FormData,
): { data: ListingInput } | { error: string } {
  const make = formData.get("make");
  const model = String(formData.get("model") ?? "").trim();
  const year = parseWholeNumber(formData.get("year"));
  const mileage = parseWholeNumber(formData.get("mileage"));
  const price = parseWholeNumber(formData.get("price"));
  const condition = formData.get("condition");
  const city = formData.get("city");
  const fuelType = formData.get("fuel_type");
  const maxYear = new Date().getFullYear() + 1;

  if (!isMake(make)) return { error: "Choose a make." };
  if (model.length < 1 || model.length > 60) return { error: "Enter the model." };
  if (year === null || year < 1950 || year > maxYear) {
    return { error: `Enter a year between 1950 and ${maxYear}.` };
  }
  if (mileage === null || mileage > 2_000_000) return { error: "Enter the mileage in km." };
  if (price === null || price <= 0 || price > 100_000_000) {
    return { error: "Enter the price in SAR." };
  }
  if (!includes(CONDITIONS, condition)) return { error: "Choose the condition." };
  if (!isCity(city)) return { error: "Choose a city." };
  if (!includes(FUEL_TYPES, fuelType)) return { error: "Choose the fuel type." };

  return {
    data: { make, model, year, mileage, price, condition, city, fuel_type: fuelType },
  };
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

// RLS-scoped: 0 unless the signed-in user owns the listing.
export async function getListingViews(listingId: string): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("listing_view_counts")
    .select("views")
    .eq("listing_id", listingId)
    .maybeSingle();
  return data?.views ?? 0;
}

// Best effort: a failed count must never break the listing page.
export async function recordListingView(listingId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc("increment_listing_view", { p_listing_id: listingId });
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
export const SORTS = ["newest", "price_asc", "price_desc"] as const;
export type Sort = (typeof SORTS)[number];

export type ListingFilters = {
  q?: string;
  make?: string;
  city?: string;
  fuelType?: Listing["fuel_type"];
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

function numberParam(searchParams: SearchParams, key: string): number | undefined {
  const value = param(searchParams, key);
  if (value === undefined) return undefined;
  const number = parseWholeNumber(value);
  return number === null ? undefined : number;
}

// Invalid values are dropped rather than erroring: these come from the URL.
export function parseListingFilters(searchParams: SearchParams): ListingFilters {
  const make = param(searchParams, "make");
  const city = param(searchParams, "city");
  const fuelType = param(searchParams, "fuel_type");
  const sort = param(searchParams, "sort");
  const page = numberParam(searchParams, "page");

  return {
    q: param(searchParams, "q")?.trim().slice(0, 100) || undefined,
    make: isMake(make) ? make : undefined,
    city: isCity(city) ? city : undefined,
    fuelType: includes(FUEL_TYPES, fuelType) ? fuelType : undefined,
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
  const entries: [string, string | number | undefined][] = [
    ["q", filters.q],
    ["make", filters.make],
    ["city", filters.city],
    ["fuel_type", filters.fuelType],
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
  eq(column: "status" | "make" | "city" | "fuel_type", value: string): this;
  gte(column: "price" | "year", value: number): this;
  lte(column: "price" | "year", value: number): this;
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
  if (filters.city) query = query.eq("city", filters.city);
  if (filters.fuelType) query = query.eq("fuel_type", filters.fuelType);
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

  query =
    filters.sort === "newest"
      ? query.order("created_at", { ascending: false })
      : query
          .order("price", { ascending: filters.sort === "price_asc" })
          .order("created_at", { ascending: false });

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

// Active listings for everyone; drafts/sold only for their owner (via RLS).
export async function getPublicListing(listingId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("listings")
    .select("*, listing_images(*), seller:profiles(id, full_name, phone, city, created_at, email_verified_at, id_verified_at)")
    .eq("id", listingId)
    .maybeSingle();
  return data ? withImageUrls(data) : null;
}

export async function getSellerProfile(sellerId: string) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, city, created_at, email_verified_at, id_verified_at")
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
