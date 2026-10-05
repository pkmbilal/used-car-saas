import Link from "next/link";
import { X } from "lucide-react";
import { formatKm, formatSAR } from "@/lib/format";
import { bodyTypeLabel, capitalize, featureLabel } from "@/lib/listing-options";
import type { ListingFilters } from "@/lib/listings";
import { listingsHref } from "@/lib/saved-searches";

type Chip = { key: string; label: string; without: Partial<ListingFilters> };

function rangeLabel(min: number | undefined, max: number | undefined, format: (n: number) => string): string {
  if (min !== undefined && max !== undefined) return `${format(min)} – ${format(max)}`;
  if (min !== undefined) return `From ${format(min)}`;
  return max !== undefined ? `Up to ${format(max)}` : "";
}

// One chip per active value; each links to the same search without it.
function chipsFor(filters: ListingFilters): Chip[] {
  const chips: Chip[] = [];
  const many = <T extends string>(key: keyof ListingFilters, values: T[], label: (value: T) => string) => {
    for (const value of values) {
      chips.push({ key: `${key}-${value}`, label: label(value), without: { [key]: values.filter((v) => v !== value) } });
    }
  };

  if (filters.q) chips.push({ key: "q", label: `“${filters.q}”`, without: { q: undefined } });
  // Removing the make drops the model too; a model only counts alongside its make.
  if (filters.make) chips.push({ key: "make", label: filters.make, without: { make: undefined, model: undefined } });
  if (filters.model) chips.push({ key: "model", label: filters.model, without: { model: undefined } });
  if (filters.city) chips.push({ key: "city", label: filters.city, without: { city: undefined } });
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    chips.push({
      key: "price",
      label: rangeLabel(filters.minPrice, filters.maxPrice, formatSAR),
      without: { minPrice: undefined, maxPrice: undefined },
    });
  }
  if (filters.minYear !== undefined || filters.maxYear !== undefined) {
    chips.push({
      key: "year",
      label: rangeLabel(filters.minYear, filters.maxYear, String),
      without: { minYear: undefined, maxYear: undefined },
    });
  }
  if (filters.maxMileage !== undefined) {
    chips.push({ key: "mileage", label: `Up to ${formatKm(filters.maxMileage)}`, without: { maxMileage: undefined } });
  }
  many("conditions", filters.conditions, capitalize);
  many("bodyTypes", filters.bodyTypes, bodyTypeLabel);
  many("fuelTypes", filters.fuelTypes, capitalize);
  many("transmissions", filters.transmissions, capitalize);
  many("features", filters.features, featureLabel);
  return chips;
}

// Keeps the sort; page always resets.
function hrefWithout(filters: ListingFilters, without: Partial<ListingFilters>): string {
  const href = listingsHref({ ...filters, ...without });
  if (filters.sort === "newest") return href;
  return `${href}${href.includes("?") ? "&" : "?"}sort=${filters.sort}`;
}

export function ActiveFilters({ filters }: { filters: ListingFilters }) {
  const chips = chipsFor(filters);
  if (chips.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <Link
          key={chip.key}
          href={hrefWithout(filters, chip.without)}
          aria-label={`Remove filter: ${chip.label}`}
          className="inline-flex h-7 items-center gap-1.5 rounded-full border border-line bg-white px-3 text-caption font-medium text-ink hover:border-brand hover:bg-mint"
        >
          {chip.label}
          <X className="size-3 text-muted-foreground" strokeWidth={2.4} />
        </Link>
      ))}
      <Link
        href={filters.sort === "newest" ? "/listings" : `/listings?sort=${filters.sort}`}
        className="px-1 text-caption font-semibold text-brand hover:underline"
      >
        Clear all
      </Link>
    </div>
  );
}
