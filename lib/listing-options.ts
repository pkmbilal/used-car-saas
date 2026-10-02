// Listing field options and upload limits, shared by client forms and server
// validation.
import type { Database } from "@/lib/supabase/database.types";

type ListingRow = Database["public"]["Tables"]["listings"]["Row"];

export const CONDITIONS = ["excellent", "good", "fair"] as const satisfies readonly ListingRow["condition"][];
export const FUEL_TYPES = ["petrol", "diesel", "hybrid", "electric"] as const satisfies readonly ListingRow["fuel_type"][];
export const TRANSMISSIONS = ["automatic", "manual"] as const satisfies readonly NonNullable<ListingRow["transmission"]>[];
export const BODY_TYPES = ["sedan", "suv", "hatchback", "coupe", "pickup", "van"] as const satisfies readonly NonNullable<ListingRow["body_type"]>[];

export type FuelType = (typeof FUEL_TYPES)[number];
export type Transmission = (typeof TRANSMISSIONS)[number];
export type BodyType = (typeof BODY_TYPES)[number];

// Must match the check constraint on listings.features.
export const FEATURES = [
  { value: "sunroof", label: "Sunroof" },
  { value: "leather_seats", label: "Leather Seats" },
  { value: "navigation", label: "Navigation" },
  { value: "rear_camera", label: "Rear Camera" },
  { value: "bluetooth", label: "Bluetooth" },
  { value: "parking_sensors", label: "Parking Sensors" },
  { value: "cruise_control", label: "Cruise Control" },
  { value: "apple_carplay", label: "Apple CarPlay" },
  { value: "android_auto", label: "Android Auto" },
  { value: "keyless_entry", label: "Keyless Entry" },
  { value: "climate_control", label: "Climate Control" },
  { value: "alloy_wheels", label: "Alloy Wheels" },
] as const;

export type Feature = (typeof FEATURES)[number]["value"];
export const FEATURE_VALUES: readonly Feature[] = FEATURES.map((feature) => feature.value);

export function featureLabel(value: string): string {
  return FEATURES.find((feature) => feature.value === value)?.label ?? value;
}

export function bodyTypeLabel(value: string): string {
  return value === "suv" ? "SUV" : capitalize(value);
}

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
