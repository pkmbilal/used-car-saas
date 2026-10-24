import "server-only";
import { makeName, modelName } from "@/lib/car-names";
import { cityName, fmt, optionLabel } from "@/lib/dictionary";
import type { Dictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";
import {
  applyListingFilters,
  listingFiltersToParams,
  parseListingFilters,
  type ListingFilters,
} from "@/lib/listings";
import { formatKm, formatSAR } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

export const MAX_SAVED_SEARCHES = 20;
export const MAX_SAVED_SEARCH_NAME = 60;

export type SavedSearch = {
  id: string;
  name: string;
  filters: ListingFilters;
  href: string;
  newCount: number;
  createdAt: string;
};

// Stored filters are re-parsed like URL params, so stale values (e.g. a make
// that was since removed) are dropped instead of breaking the search.
function parseStoredFilters(filters: Json): ListingFilters {
  const params: Record<string, string> = {};
  if (filters && typeof filters === "object" && !Array.isArray(filters)) {
    for (const [key, value] of Object.entries(filters)) {
      if (typeof value === "string") params[key] = value;
    }
  }
  return parseListingFilters(params);
}

export function listingsHref(filters: ListingFilters): string {
  const search = new URLSearchParams(listingFiltersToParams(filters)).toString();
  return search ? `/listings?${search}` : "/listings";
}

export function hasActiveFilters(filters: ListingFilters): boolean {
  return Object.keys(listingFiltersToParams(filters)).length > 0;
}

// Human-readable parts, e.g. ["“camry”", "Toyota", "Riyadh", "Up to SAR 80,000"].
export function describeFilters(filters: ListingFilters, t: Dictionary, locale: Locale): string[] {
  const s = t.filtersSummary;
  const sar = (amount: number) => formatSAR(amount, locale);
  const joined = (labels: string[]) => (labels.length ? labels.join(t.list.separator) : null);
  const { minPrice, maxPrice, minYear, maxYear } = filters;

  let price: string | null = null;
  if (minPrice !== undefined && maxPrice !== undefined) price = fmt(s.priceRange, { min: sar(minPrice), max: sar(maxPrice) });
  else if (minPrice !== undefined) price = fmt(s.priceFrom, { price: sar(minPrice) });
  else if (maxPrice !== undefined) price = fmt(s.priceUpTo, { price: sar(maxPrice) });

  let year: string | null = null;
  if (minYear !== undefined && maxYear !== undefined) year = minYear === maxYear ? `${minYear}` : fmt(s.yearRange, { min: minYear, max: maxYear });
  else if (minYear !== undefined) year = fmt(s.yearMin, { year: minYear });
  else if (maxYear !== undefined) year = fmt(s.yearMax, { year: maxYear });

  return [
    filters.q ? `“${filters.q}”` : null,
    filters.make ? makeName(locale, filters.make) : null,
    filters.model ? modelName(locale, filters.make ?? "", filters.model) : null,
    filters.city ? cityName(t, filters.city) : null,
    joined(filters.conditions.map((value) => optionLabel(t.options.condition, value))),
    joined(filters.bodyTypes.map((value) => optionLabel(t.options.bodyType, value))),
    joined(filters.fuelTypes.map((value) => optionLabel(t.options.fuel, value))),
    joined(filters.transmissions.map((value) => optionLabel(t.options.transmission, value))),
    joined(filters.features.map((value) => optionLabel(t.options.features, value))),
    price,
    year,
    filters.maxMileage !== undefined ? fmt(s.mileageUpTo, { km: formatKm(filters.maxMileage, locale) }) : null,
  ].filter((part): part is string => part !== null);
}

export function defaultSearchName(filters: ListingFilters, t: Dictionary, locale: Locale): string {
  return describeFilters(filters, t, locale).join(" · ").slice(0, MAX_SAVED_SEARCH_NAME) || t.filtersSummary.myFirstSearch;
}

// RLS limits rows to the signed-in user's own searches.
export async function getSavedSearches(userId: string): Promise<SavedSearch[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("saved_searches")
    .select("id, name, filters, last_seen_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  // One head-only count per search; the per-user cap keeps this small.
  return Promise.all(
    data.map(async (row) => {
      const filters = parseStoredFilters(row.filters);
      const { count } = await applyListingFilters(
        supabase.from("listings").select("id", { count: "exact", head: true }),
        filters,
      ).gt("created_at", row.last_seen_at);
      return {
        id: row.id,
        name: row.name,
        filters,
        href: listingsHref(filters),
        newCount: count ?? 0,
        createdAt: row.created_at,
      };
    }),
  );
}

export async function createSavedSearch(
  userId: string,
  name: string,
  filters: ListingFilters,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("saved_searches").insert({
    user_id: userId,
    name,
    filters: listingFiltersToParams(filters),
  });
  if (error?.code === "P0001") {
    return { error: `You can save up to ${MAX_SAVED_SEARCHES} searches. Delete one first.` };
  }
  return error ? { error: "Could not save this search. Try again." } : {};
}

export async function deleteSavedSearch(userId: string, id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("saved_searches")
    .delete()
    .eq("user_id", userId)
    .eq("id", id);
  return error ? { error: "Could not delete this search. Try again." } : {};
}

// Resets the "new" count and returns where to send the user, or null if the
// search doesn't exist (or isn't theirs).
export async function markSavedSearchSeen(userId: string, id: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("saved_searches")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("id", id)
    .select("filters")
    .maybeSingle();
  return data ? listingsHref(parseStoredFilters(data.filters)) : null;
}
