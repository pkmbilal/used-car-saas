"use client";

import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import { FormSelect } from "@/components/form-select";
import { MakeModelSelects } from "@/components/make-model-selects";
import { CheckboxGroup } from "./checkbox-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CITIES } from "@/lib/cities";
import { formatKm } from "@/lib/format";
import { BODY_TYPES, bodyTypeLabel, capitalize, FEATURES, FUEL_TYPES, TRANSMISSIONS } from "@/lib/listing-options";
import type { ListingFilters } from "@/lib/listings";

const inputClass = "h-9 bg-white text-xs";
const labelClass = "text-[11px] font-semibold text-ink";

function Range({
  label,
  hint,
  minName,
  maxName,
  min,
  max,
}: {
  label: string;
  hint?: string;
  minName: string;
  maxName: string;
  min?: number;
  max?: number;
}) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 flex w-full items-center justify-between">
        <span className={labelClass}>{label}</span>
        {hint && <span className="text-[10px] text-muted-foreground">{hint}</span>}
      </legend>
      <div className="flex items-center gap-2">
        <Input name={minName} type="number" min={0} placeholder="Min" aria-label={`${label} min`} defaultValue={min} className={inputClass} />
        <span className="text-xs text-muted-foreground">–</span>
        <Input name={maxName} type="number" min={0} placeholder="Max" aria-label={`${label} max`} defaultValue={max} className={inputClass} />
      </div>
    </fieldset>
  );
}

export type FilterCounts = {
  fuelTypes: Record<string, number>;
  bodyTypes: Record<string, number>;
  transmissions: Record<string, number>;
};

const MAX_MILEAGES = [20_000, 50_000, 100_000, 150_000, 200_000];

// Keeps a custom value from the URL (e.g. max_mileage=80000) selectable.
function mileageOptions(current: number | undefined) {
  const values = current === undefined || MAX_MILEAGES.includes(current) ? MAX_MILEAGES : [current, ...MAX_MILEAGES];
  return values.map((km) => ({ value: String(km), label: `Up to ${formatKm(km)}` }));
}

// Plain GET form: filters live in the URL. Client-side only for the Radix
// controls; "Any" choices are left out of the query entirely.
export function Filters({
  filters,
  counts,
  idPrefix = "filters",
}: {
  filters: ListingFilters;
  // Active-listing counts per option, keyed by value.
  counts: FilterCounts;
  // Filters render twice (sidebar and mobile sheet), so ids need a prefix.
  idPrefix?: string;
}) {
  const id = (name: string) => `${idPrefix}-${name}`;
  const groupProps = { idPrefix, legendClassName: labelClass };

  return (
    <form method="get" action="/listings" className="flex flex-col gap-5">
      {filters.sort !== "newest" && <input type="hidden" name="sort" value={filters.sort} />}
      <div className="flex items-center gap-2 border-b border-line pb-3">
        <SlidersHorizontal className="size-4 text-brand-600" />
        <span className="text-sm font-bold">Filters</span>
        <Button asChild variant="link" size="sm" className="ml-auto h-auto p-0 text-[11px] font-semibold text-brand">
          <Link href="/listings">Clear All</Link>
        </Button>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={id("q")} className={labelClass}>
          Keyword
        </Label>
        <Input
          id={id("q")}
          name="q"
          type="search"
          maxLength={100}
          placeholder="e.g. Camry 2020"
          defaultValue={filters.q}
          className={inputClass}
        />
      </div>
      <MakeModelSelects
        make={filters.make}
        model={filters.model}
        makeId={id("make")}
        modelId={id("model")}
        makePlaceholder="Any"
        modelPlaceholder="Any"
        fieldClassName="flex flex-col gap-1.5"
        labelClassName={labelClass}
      />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={id("city")} className={labelClass}>
          City
        </Label>
        <FormSelect
          id={id("city")}
          name="city"
          defaultValue={filters.city}
          placeholder="Any"
          options={CITIES.map((city) => ({ value: city, label: city }))}
        />
      </div>
      <Range label="Price Range" hint="SAR" minName="min_price" maxName="max_price" min={filters.minPrice} max={filters.maxPrice} />
      <Range label="Year" minName="min_year" maxName="max_year" min={filters.minYear} max={filters.maxYear} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={id("mileage")} className={labelClass}>
          Mileage
        </Label>
        <FormSelect
          id={id("mileage")}
          name="max_mileage"
          defaultValue={filters.maxMileage?.toString()}
          placeholder="Any Mileage"
          options={mileageOptions(filters.maxMileage)}
        />
      </div>
      <CheckboxGroup
        {...groupProps}
        title="Body Style"
        name="body_type"
        selected={filters.bodyTypes}
        options={BODY_TYPES.map((value) => ({ value, label: bodyTypeLabel(value), count: counts.bodyTypes[value] ?? 0 }))}
      />
      <CheckboxGroup
        {...groupProps}
        title="Fuel Type"
        name="fuel_type"
        selected={filters.fuelTypes}
        options={FUEL_TYPES.map((value) => ({ value, label: capitalize(value), count: counts.fuelTypes[value] ?? 0 }))}
      />
      <CheckboxGroup
        {...groupProps}
        title="Transmission"
        name="transmission"
        selected={filters.transmissions}
        options={TRANSMISSIONS.map((value) => ({ value, label: capitalize(value), count: counts.transmissions[value] ?? 0 }))}
      />
      <CheckboxGroup
        {...groupProps}
        title="Features"
        name="features"
        selected={filters.features}
        options={FEATURES.map(({ value, label }) => ({ value, label }))}
      />
      <Button type="submit" className="h-9 text-xs font-semibold">
        <Search className="size-3.5" />
        Apply Filters
      </Button>
    </form>
  );
}
