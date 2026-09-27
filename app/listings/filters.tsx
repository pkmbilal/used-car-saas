import Link from "next/link";
import { CITIES } from "@/lib/cities";
import { capitalize, FUEL_TYPES } from "@/lib/listing-options";
import type { ListingFilters, Sort } from "@/lib/listings";
import { MAKES } from "@/lib/makes";

const inputClass =
  "w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900";

const sortLabels: Record<Sort, string> = {
  newest: "Newest first",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
};

function Select({
  name,
  label,
  options,
  value,
  format = (option) => option,
}: {
  name: string;
  label: string;
  options: readonly string[];
  value?: string;
  format?: (option: string) => string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium">
      {label}
      <select name={name} defaultValue={value ?? ""} className={inputClass}>
        <option value="">Any</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {format(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

function Range({
  label,
  minName,
  maxName,
  min,
  max,
}: {
  label: string;
  minName: string;
  maxName: string;
  min?: number;
  max?: number;
}) {
  return (
    <fieldset className="flex flex-col gap-1 text-sm font-medium">
      <legend className="mb-1">{label}</legend>
      <div className="flex gap-2">
        <input
          name={minName}
          type="number"
          min={0}
          placeholder="Min"
          aria-label={`${label} min`}
          defaultValue={min}
          className={inputClass}
        />
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
export function Filters({ filters }: { filters: ListingFilters }) {
  return (
    <form method="get" action="/listings" className="flex flex-col gap-4">
      <Select name="make" label="Make" options={MAKES} value={filters.make} />
      <Select name="city" label="City" options={CITIES} value={filters.city} />
      <Select
        name="fuel_type"
        label="Fuel type"
        options={FUEL_TYPES}
        value={filters.fuelType}
        format={capitalize}
      />
      <Range
        label="Price (SAR)"
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
      <label className="flex flex-col gap-1 text-sm font-medium">
        Sort by
        <select name="sort" defaultValue={filters.sort} className={inputClass}>
          {Object.entries(sortLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <div className="flex items-center gap-4">
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Apply
        </button>
        <Link href="/listings" className="text-sm text-zinc-600 dark:text-zinc-400">
          Reset
        </Link>
      </div>
    </form>
  );
}
