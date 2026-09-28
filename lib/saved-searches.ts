import "server-only";
import { capitalize } from "@/lib/listing-options";
import {
  applyListingFilters,
  listingFiltersToParams,
  parseListingFilters,
  type ListingFilters,
} from "@/lib/listings";
import { formatSAR } from "@/lib/format";
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

function priceRange(min?: number, max?: number): string | null {
  if (min !== undefined && max !== undefined) return `${formatSAR(min)} – ${formatSAR(max)}`;
  if (min !== undefined) return `From ${formatSAR(min)}`;
  if (max !== undefined) return `Up to ${formatSAR(max)}`;
  return null;
}

function yearRange(min?: number, max?: number): string | null {
  if (min !== undefined && max !== undefined) return min === max ? `${min}` : `${min}–${max}`;
  if (min !== undefined) return `${min} or newer`;
  if (max !== undefined) return `${max} or older`;
  return null;
}

// Human-readable parts, e.g. ["“camry”", "Toyota", "Riyadh", "Up to SAR 80,000"].
export function describeFilters(filters: ListingFilters): string[] {
  return [
    filters.q ? `“${filters.q}”` : null,
    filters.make ?? null,
    filters.city ?? null,
    filters.fuelType ? capitalize(filters.fuelType) : null,
    priceRange(filters.minPrice, filters.maxPrice),
    yearRange(filters.minYear, filters.maxYear),
  ].filter((part): part is string => part !== null);
}

export function defaultSearchName(filters: ListingFilters): string {
  return describeFilters(filters).join(" · ").slice(0, MAX_SAVED_SEARCH_NAME) || "My search";
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
