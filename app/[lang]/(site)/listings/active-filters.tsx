import Link from "@/components/locale-link";
import { X } from "lucide-react";
import { makeName, modelName } from "@/lib/car-names";
import { cityName, fmt, optionLabel } from "@/lib/dictionary";
import type { Dictionary } from "@/lib/dictionaries";
import { formatKm, formatSAR } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n-server";
import { defaultSort, type ListingFilters } from "@/lib/listings";
import { formatNear } from "@/lib/cities";
import { listingsHref } from "@/lib/saved-searches";

type Chip = { key: string; label: string; without: Partial<ListingFilters> };

function rangeLabel(
  t: Dictionary,
  min: number | undefined,
  max: number | undefined,
  format: (n: number) => string,
): string {
  const s = t.filtersSummary;
  if (min !== undefined && max !== undefined) return fmt(s.priceRange, { min: format(min), max: format(max) });
  if (min !== undefined) return fmt(s.priceFrom, { price: format(min) });
  return max !== undefined ? fmt(s.priceUpTo, { price: format(max) }) : "";
}

// One chip per active value; each links to the same search without it.
function chipsFor(filters: ListingFilters, t: Dictionary, locale: Locale): Chip[] {
  const chips: Chip[] = [];
  const many = <T extends string>(key: keyof ListingFilters, values: T[], label: (value: T) => string) => {
    for (const value of values) {
      chips.push({ key: `${key}-${value}`, label: label(value), without: { [key]: values.filter((v) => v !== value) } });
    }
  };

  if (filters.q) chips.push({ key: "q", label: `“${filters.q}”`, without: { q: undefined } });
  // Removing the make drops the model too; a model only counts alongside its make.
  if (filters.make) chips.push({ key: "make", label: makeName(locale, filters.make), without: { make: undefined, model: undefined } });
  if (filters.model) chips.push({ key: "model", label: modelName(locale, filters.make ?? "", filters.model), without: { model: undefined } });
  if (filters.city) chips.push({ key: "city", label: cityName(t, filters.city), without: { city: undefined } });
  if (filters.near) {
    chips.push({
      key: "near",
      label: fmt(t.nearMe.chip, { distance: formatKm(filters.radiusKm, locale) }),
      without: { near: undefined },
    });
  }
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    chips.push({
      key: "price",
      label: rangeLabel(t, filters.minPrice, filters.maxPrice, (amount) => formatSAR(amount, locale)),
      without: { minPrice: undefined, maxPrice: undefined },
    });
  }
  if (filters.minYear !== undefined || filters.maxYear !== undefined) {
    chips.push({
      key: "year",
      label: rangeLabel(t, filters.minYear, filters.maxYear, String),
      without: { minYear: undefined, maxYear: undefined },
    });
  }
  if (filters.maxMileage !== undefined) {
    chips.push({ key: "mileage", label: fmt(t.filtersSummary.mileageUpTo, { km: formatKm(filters.maxMileage, locale) }), without: { maxMileage: undefined } });
  }
  many("conditions", filters.conditions, (value) => optionLabel(t.options.condition, value));
  many("bodyTypes", filters.bodyTypes, (value) => optionLabel(t.options.bodyType, value));
  many("fuelTypes", filters.fuelTypes, (value) => optionLabel(t.options.fuel, value));
  many("transmissions", filters.transmissions, (value) => optionLabel(t.options.transmission, value));
  many("features", filters.features, (value) => optionLabel(t.options.features, value));
  return chips;
}

// Keeps the sort and location; page always resets. "Nearest" goes with the location.
function hrefWithout(filters: ListingFilters, without: Partial<ListingFilters>): string {
  const next = { ...filters, ...without };
  const params = new URLSearchParams(listingsHref(next).split("?")[1]);
  if (next.near) {
    params.set("near", formatNear(next.near));
    params.set("radius", String(next.radiusKm));
  }
  // The default sort stays out of the URL; "nearest" is only ever a default.
  if (next.sort !== defaultSort(next.near !== undefined) && next.sort !== "nearest") params.set("sort", next.sort);
  const search = params.toString();
  return search ? `/listings?${search}` : "/listings";
}

export async function ActiveFilters({ filters }: { filters: ListingFilters }) {
  const { t, locale } = await getDictionary();
  const chips = chipsFor(filters, t, locale);
  if (chips.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <Link
          key={chip.key}
          href={hrefWithout(filters, chip.without)}
          aria-label={fmt(t.listings.removeFilter, { label: chip.label })}
          className="inline-flex h-7 items-center gap-1.5 rounded-full border border-line bg-white px-3 text-caption font-medium text-ink hover:border-brand hover:bg-mint"
        >
          {chip.label}
          <X className="size-3 text-muted-foreground" strokeWidth={2.4} />
        </Link>
      ))}
      <Link
        href={filters.sort === "newest" || filters.sort === "nearest" ? "/listings" : `/listings?sort=${filters.sort}`}
        className="px-1 text-caption font-semibold text-brand hover:underline"
      >
        {t.listings.clearAll}
      </Link>
    </div>
  );
}
