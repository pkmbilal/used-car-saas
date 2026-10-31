import { listingName, makeName, modelName } from "@/lib/car-names";
import { equipmentTypeName } from "@/lib/equipment";
import { cityName, fmt, optionLabel } from "@/lib/dictionary";
import type { Dictionary } from "@/lib/dictionaries";
import { formatSAR, formatUsage } from "@/lib/format";
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
  | "listing_type"
  | "category"
  | "equipment_type"
  | "operating_hours"
>;

// Meta description for a listing page, built from its specs.
export function listingDescription(listing: SeoListing, t: Dictionary, locale: Locale): string {
  const specs = [
    formatUsage(listing, locale),
    listing.equipment_type && equipmentTypeName(locale, listing.equipment_type),
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
    price:
      listing.listing_type === "rent"
        ? `${formatSAR(listing.price, locale)} ${t.rentals.perDay}`
        : formatSAR(listing.price, locale),
  });
}

// schema.org Car + Offer structured data for search results. Spec values stay
// in English; the description is in the page's language.
export function listingJsonLd(
  listing: SeoListing,
  url: string,
  description: string,
  seller: { name: string; dealer: boolean } | null,
) {
  if (listing.category === "equipment") {
    // Equipment: a generic Product leased out by the day.
    return {
      "@context": "https://schema.org",
      "@type": "Product",
      name: listingName("en", listing, listing.year),
      description,
      url,
      image: listing.images.map((image) => image.url),
      brand: { "@type": "Brand", name: listing.make },
      model: listing.model,
      offers: {
        "@type": "Offer",
        url,
        price: listing.price,
        priceCurrency: "SAR",
        businessFunction: "http://purl.org/goodrelations/v1#LeaseOut",
        priceSpecification: { "@type": "UnitPriceSpecification", price: listing.price, priceCurrency: "SAR", unitCode: "DAY" },
        availability: listing.status === "active" ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
        areaServed: { "@type": "City", name: listing.city },
        ...(seller && { seller: { "@type": seller.dealer ? "Organization" : "Person", name: seller.name } }),
      },
    };
  }

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
      // Rentals: the price is a daily rate for leasing the car out.
      ...(listing.listing_type === "rent" && {
        businessFunction: "http://purl.org/goodrelations/v1#LeaseOut",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: listing.price,
          priceCurrency: "SAR",
          unitCode: "DAY",
        },
      }),
      availability: listing.status === "active" ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
      areaServed: { "@type": "City", name: listing.city },
      ...(seller && { seller: { "@type": seller.dealer ? "AutoDealer" : "Person", name: seller.name } }),
    },
  };
}
