import Link from "next/link";
import { ChevronDownIcon, FilterIcon, SearchIcon } from "@/components/icons";
import { CITIES } from "@/lib/cities";
import { capitalize, FUEL_TYPES } from "@/lib/listing-options";
import type { ListingFilters } from "@/lib/listings";
import { MAKES } from "@/lib/makes";

const inputClass =
  "h-9 w-full rounded-md border border-line bg-white px-2.5 text-xs text-ink outline-none focus:border-brand";
const labelClass = "text-[11px] font-semibold text-ink";

function Select({
  name,
  label,
  options,
  value,
}: {
  name: string;
  label: string;
  options: readonly string[];
  value?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className={labelClass}>{label}</span>
      <span className="relative flex items-center">
        <select name={name} defaultValue={value ?? ""} className={`${inputClass} appearance-none pr-8`}>
          <option value="">Any</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDownIcon size={11} strokeWidth={2.4} className="pointer-events-none absolute right-2.5" />
      </span>
    </label>
  );
}

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
        {hint && <span className="text-[10px] text-muted">{hint}</span>}
      </legend>
      <div className="flex items-center gap-2">
        <input
          name={minName}
          type="number"
          min={0}
          placeholder="Min"
          aria-label={`${label} min`}
          defaultValue={min}
          className={inputClass}
        />
        <span className="text-xs text-muted">–</span>
        <input
          name={maxName}
          type="number"
          min={0}
          placeholder="Max"
          aria-label={`${label} max`}
          defaultValue={max}
          className={inputClass}
        />
      </div>
    </fieldset>
  );
}

// Plain GET form: filters live in the URL, so no client JS is needed.
export function Filters({
  filters,
  fuelCounts,
}: {
  filters: ListingFilters;
  fuelCounts: Map<string, number>;
}) {
  return (
    <form method="get" action="/listings" className="flex flex-col gap-5">
      {filters.sort !== "newest" && <input type="hidden" name="sort" value={filters.sort} />}
      <div className="flex items-center gap-2 border-b border-line pb-3">
        <FilterIcon size={16} className="text-brand-600" />
        <span className="text-sm font-bold">Filters</span>
        <Link href="/listings" className="ml-auto text-[11px] font-semibold text-brand">
          Clear All
        </Link>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>Keyword</span>
        <input
          name="q"
          type="search"
          maxLength={100}
          placeholder="e.g. Camry 2020"
          defaultValue={filters.q}
          className={inputClass}
        />
      </label>
      <Select name="make" label="Make" options={MAKES} value={filters.make} />
      <Select name="city" label="City" options={CITIES} value={filters.city} />
      <Range
        label="Price Range"
        hint="SAR"
        minName="min_price"
        maxName="max_price"
        min={filters.minPrice}
        max={filters.maxPrice}
      />
      <Range
        label="Year"
        minName="min_year"
        maxName="max_year"
        min={filters.minYear}
        max={filters.maxYear}
      />
      <fieldset className="flex flex-col gap-2">
        <legend className={`${labelClass} mb-2`}>Fuel Type</legend>
        {[undefined, ...FUEL_TYPES].map((fuel) => (
          <label key={fuel ?? "any"} className="flex cursor-pointer items-center gap-2 text-xs text-ink/80">
            <input
              type="radio"
              name="fuel_type"
              value={fuel ?? ""}
              defaultChecked={filters.fuelType === fuel}
              className="size-3.5 accent-brand"
            />
            {fuel ? capitalize(fuel) : "Any"}
            {fuel && <span className="text-[10px] text-muted">({fuelCounts.get(fuel) ?? 0})</span>}
          </label>
        ))}
      </fieldset>
      <button
        type="submit"
        className="flex h-9 items-center justify-center gap-2 rounded-md bg-brand text-xs font-semibold text-white hover:bg-brand-dark"
      >
        <SearchIcon size={14} strokeWidth={2.2} />
        Apply Filters
      </button>
    </form>
  );
}
