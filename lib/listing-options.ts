// Listing field options and upload limits, shared by client forms and server
// validation.
import type { Database } from "@/lib/supabase/database.types";

type ListingRow = Database["public"]["Tables"]["listings"]["Row"];

export const CONDITIONS = ["excellent", "good", "fair"] as const satisfies readonly ListingRow["condition"][];
export const FUEL_TYPES = ["petrol", "diesel", "hybrid", "electric"] as const satisfies readonly ListingRow["fuel_type"][];

export const MAX_IMAGES_PER_LISTING = 15;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
