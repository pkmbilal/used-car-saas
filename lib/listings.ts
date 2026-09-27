import "server-only";
import { isCity } from "@/lib/cities";
import { CONDITIONS, FUEL_TYPES } from "@/lib/listing-options";
import { isMake } from "@/lib/makes";
import { publicUrl } from "@/lib/r2";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type Listing = Database["public"]["Tables"]["listings"]["Row"];
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

function withImageUrls(listing: Listing & { listing_images: ListingImage[] }): ListingWithImages {
  const { listing_images, ...rest } = listing;
  return {
    ...rest,
    images: [...listing_images]
      .sort((a, b) => a.position - b.position)
      .map((image) => ({ ...image, url: publicUrl(image.r2_key) })),
  };
}

// RLS-scoped: returns only the signed-in seller's listings.
export async function getSellerListings(sellerId: string): Promise<ListingWithImages[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select("*, listing_images(*)")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(withImageUrls);
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
