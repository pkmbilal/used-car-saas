import { makeName, modelName } from "@/lib/car-names";
import { cityName, fmt, optionLabel } from "@/lib/dictionary";
import type { Dictionary } from "@/lib/dictionaries";
import { formatKm, formatSAR } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { bodyTypeLabel, capitalize } from "@/lib/listing-options";
import type { ListingWithImages } from "@/lib/listings";

type SeoListing = Pick<
  ListingWithImages,
  | "make"
  | "model"
  | "year"
  | "mileage"
  | "price"
  | "city"
  | "condition"
  | "fuel_type"
  | "transmission"
  | "body_type"
  | "color"
  | "status"
  | "images"
>;

// Meta description for a listing page, built from its specs.
export function listingDescription(listing: SeoListing, t: Dictionary, locale: Locale): string {
  const specs = [
    formatKm(listing.mileage, locale),
    listing.transmission && optionLabel(t.options.transmission, listing.transmission),
    optionLabel(t.options.fuel, listing.fuel_type),
  ]
    .filter(Boolean)
    .join(t.list.separator);
  return fmt(t.seo.listingDescription, {
    year: listing.year,
    make: makeName(locale, listing.make),
    model: modelName(locale, listing.make, listing.model),
    city: cityName(t, listing.city),
    specs,
    price: formatSAR(listing.price, locale),
  });
}

// schema.org Car + Offer structured data for search results. Spec values stay
// in English; the description is in the page's language.
export function listingJsonLd(listing: SeoListing, url: string, description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Car",
    name: `${listing.year} ${listing.make} ${listing.model}`,
    description,
    url,
    image: listing.images.map((image) => image.url),
    brand: { "@type": "Brand", name: listing.make },
    model: listing.model,
    vehicleModelDate: String(listing.year),
    mileageFromOdometer: { "@type": "QuantitativeValue", value: listing.mileage, unitCode: "KMT" },
    fuelType: capitalize(listing.fuel_type),
    ...(listing.transmission && { vehicleTransmission: capitalize(listing.transmission) }),
    ...(listing.body_type && { bodyType: bodyTypeLabel(listing.body_type) }),
    ...(listing.color && { color: capitalize(listing.color) }),
    itemCondition: "https://schema.org/UsedCondition",
    offers: {
      "@type": "Offer",
      url,
      price: listing.price,
      priceCurrency: "SAR",
      availability: listing.status === "active" ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
      areaServed: { "@type": "City", name: listing.city },
    },
  };
}

// JSON for an inline <script type="application/ld+json">; escapes "<" so
// listing text can't close the script tag.
export function jsonLdScript(data: object): string {
  return JSON.stringify(data).replace(/</g, "\u003c");
}
