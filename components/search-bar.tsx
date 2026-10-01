import { ChevronDownIcon, PinIcon, SearchIcon } from "@/components/icons";
import { CITIES } from "@/lib/cities";
import { formatSAR } from "@/lib/format";
import type { ListingFilters } from "@/lib/listings";
import { MAKES } from "@/lib/makes";

const MAX_PRICES = [50_000, 100_000, 150_000, 200_000, 300_000, 500_000];

function minYears(): number[] {
  const year = new Date().getFullYear();
  return [year - 1, year - 3, year - 5, year - 10];
}

function Field({
  label,
  name,
  value,
  placeholder,
  options,
  pin = false,
  formatCustom = String,
}: {
  label: string;
  name: string;
  value?: string | number;
  placeholder: string;
  options: { value: string | number; label: string }[];
  pin?: boolean;
  formatCustom?: (value: string | number) => string;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-2 text-[11px] font-semibold text-ink lg:border-r lg:border-line lg:pr-3">
      {label}
      <span className="relative flex items-center">
        {pin && <PinIcon size={13} className="pointer-events-none absolute left-2.5 text-muted" />}
        <select
          name={name}
          defaultValue={value ?? ""}
          className={`h-9 w-full appearance-none rounded-md border border-line bg-white pr-8 text-xs font-normal text-ink/80 outline-none focus:border-brand ${pin ? "pl-7" : "pl-2.5"}`}
        >
          <option value="">{placeholder}</option>
          {/* Keep a custom value from the sidebar filters instead of dropping it. */}
          {value !== undefined && !options.some((option) => option.value === value) && (
            <option value={value}>{formatCustom(value)}</option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon size={12} strokeWidth={2.4} className="pointer-events-none absolute right-2.5" />
      </span>
    </label>
  );
}

// Quick search card. A GET form, so it works without client JS.
export function SearchBar({ filters, className = "" }: { filters?: ListingFilters; className?: string }) {
  return (
    <form
      method="get"
      action="/listings"
      className={`grid gap-4 rounded-xl bg-white p-5 shadow-[0_10px_30px_rgba(20,30,25,.08)] sm:grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto] lg:items-end lg:gap-3 lg:pl-7 ${className}`}
    >
      {filters?.sort && filters.sort !== "newest" && <input type="hidden" name="sort" value={filters.sort} />}
      <Field
        label="Make"
        name="make"
        value={filters?.make}
        placeholder="Any Make"
        options={MAKES.map((make) => ({ value: make, label: make }))}
      />
      <Field
        label="Max Price"
        name="max_price"
        value={filters?.maxPrice}
        placeholder="Any Price"
        options={MAX_PRICES.map((price) => ({ value: price, label: `Up to ${formatSAR(price)}` }))}
        formatCustom={(price) => `Up to ${formatSAR(Number(price))}`}
      />
      <Field
        label="Year"
        name="min_year"
        value={filters?.minYear}
        placeholder="Any Year"
        options={minYears().map((year) => ({ value: year, label: `${year} & newer` }))}
        formatCustom={(year) => `${year} & newer`}
      />
      <Field
        label="Location"
        name="city"
        value={filters?.city}
        placeholder="Any Location"
        options={CITIES.map((city) => ({ value: city, label: city }))}
        pin
      />
      <button
        type="submit"
        className="flex h-11 items-center justify-center gap-2.5 rounded-md bg-brand px-6 text-xs font-semibold text-white hover:bg-brand-dark sm:col-span-2 lg:col-span-1"
      >
        <SearchIcon size={16} strokeWidth={2.2} />
        Search Cars
      </button>
    </form>
  );
}
