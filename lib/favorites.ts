import "server-only";
import { getCurrentUser } from "@/lib/auth";
import { withImageUrls, type ListingWithImages } from "@/lib/listings";
import { createClient } from "@/lib/supabase/server";

// RLS limits favorites to the signed-in user's own rows.
export async function getFavoriteIds(userId: string): Promise<Set<string>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("favorites")
    .select("listing_id")
    .eq("user_id", userId);
  if (error) throw error;
  return new Set(data.map((row) => row.listing_id));
}

// Empty for signed-out visitors, so save buttons still render (and prompt login).
export async function getViewerFavoriteIds(): Promise<Set<string>> {
  const current = await getCurrentUser();
  return current ? getFavoriteIds(current.user.id) : new Set();
}

export async function getFavoriteListings(userId: string): Promise<ListingWithImages[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("favorites")
    .select("listing:listings(*, listing_images(*))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  // Listings RLS hides sold/draft cars from non-owners, so those joins are null.
  return data.flatMap(({ listing }) =>
    listing && listing.status === "active" ? [withImageUrls(listing)] : [],
  );
}
