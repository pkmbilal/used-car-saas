"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { FormSelect } from "@/components/form-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CITIES } from "@/lib/cities";
import { capitalize, FUEL_TYPES } from "@/lib/listing-options";
import type { ListingFilters } from "@/lib/listings";
import { MAKES } from "@/lib/makes";

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

// Plain GET form: filters live in the URL. Client-side only for the Radix
// controls; "Any" choices are left out of the query entirely.
export function Filters({
  filters,
  fuelCounts,
  idPrefix = "filters",
}: {
  filters: ListingFilters;
  fuelCounts: Record<string, number>;
  // Filters render twice (sidebar and mobile sheet), so ids need a prefix.
  idPrefix?: string;
}) {
  const [fuel, setFuel] = useState<string>(filters.fuelType ?? "any");
  const id = (name: string) => `${idPrefix}-${name}`;

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
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={id("make")} className={labelClass}>
          Make
        </Label>
        <FormSelect
          id={id("make")}
          name="make"
          defaultValue={filters.make}
          placeholder="Any"
          options={MAKES.map((make) => ({ value: make, label: make }))}
        />
      </div>
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
      <fieldset className="flex flex-col gap-2">
        <legend className={`${labelClass} mb-2`}>Fuel Type</legend>
        <RadioGroup value={fuel} onValueChange={setFuel} className="gap-2.5">
          {["any", ...FUEL_TYPES].map((option) => (
            <div key={option} className="flex items-center gap-2">
              <RadioGroupItem value={option} id={id(`fuel-${option}`)} />
              <Label htmlFor={id(`fuel-${option}`)} className="text-xs font-normal text-ink/80">
                {option === "any" ? "Any" : capitalize(option)}
                {option !== "any" && (
                  <span className="text-[10px] text-muted-foreground">({fuelCounts[option] ?? 0})</span>
                )}
              </Label>
            </div>
          ))}
        </RadioGroup>
        {fuel !== "any" && <input type="hidden" name="fuel_type" value={fuel} />}
      </fieldset>
      <Button type="submit" className="h-9 text-xs font-semibold">
        <Search className="size-3.5" />
        Apply Filters
      </Button>
    </form>
  );
}
