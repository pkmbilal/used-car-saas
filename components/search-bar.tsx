import { MapPin, Search } from "lucide-react";
import { FormSelect, type FormSelectOption } from "@/components/form-select";
import { MakeModelSelects } from "@/components/make-model-selects";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { CITIES } from "@/lib/cities";
import { formatSAR } from "@/lib/format";
import type { ListingFilters } from "@/lib/listings";
import { cn } from "@/lib/utils";

const MAX_PRICES = [50_000, 100_000, 150_000, 200_000, 300_000, 500_000];

function minYears(): number[] {
  const year = new Date().getFullYear();
  return [year - 1, year - 3, year - 5, year - 10];
}

// Keep a custom value (e.g. typed in the sidebar filters) instead of dropping it.
function withCurrent(options: FormSelectOption[], value: number | undefined, label: (v: number) => string) {
  if (value === undefined || options.some((option) => option.value === String(value))) return options;
  return [{ value: String(value), label: label(value) }, ...options];
}

const fieldClass = "flex min-w-0 flex-col gap-2 lg:border-r lg:border-line lg:pr-3";
const labelClass = "text-[0.6875rem] font-semibold text-ink";

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className={fieldClass}>
      <Label htmlFor={id} className={labelClass}>
        {label}
      </Label>
      {children}
    </div>
  );
}

const priceLabel = (price: number) => `Up to ${formatSAR(price)}`;
const yearLabel = (year: number) => `${year} & newer`;

// Quick search card. A GET form, so the results page stays shareable.
export function SearchBar({ filters, className }: { filters?: ListingFilters; className?: string }) {
  return (
    <Card className={cn("gap-0 rounded-xl py-0 shadow-[0_10px_30px_rgba(20,30,25,.08)] ring-0", className)}>
      <form
        method="get"
        action="/listings"
        className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-[repeat(5,minmax(0,1fr))_auto] lg:items-end lg:gap-3 lg:pl-7"
      >
        {filters?.sort && filters.sort !== "newest" && <input type="hidden" name="sort" value={filters.sort} />}
        <MakeModelSelects
          make={filters?.make}
          model={filters?.model}
          makeId="search-make"
          modelId="search-model"
          makePlaceholder="Any Make"
          modelPlaceholder="Any Model"
          fieldClassName={fieldClass}
          labelClassName={labelClass}
        />
        <Field id="search-price" label="Max Price">
          <FormSelect
            id="search-price"
            name="max_price"
            defaultValue={filters?.maxPrice?.toString()}
            placeholder="Any Price"
            options={withCurrent(
              MAX_PRICES.map((price) => ({ value: String(price), label: priceLabel(price) })),
              filters?.maxPrice,
              priceLabel,
            )}
          />
        </Field>
        <Field id="search-year" label="Year">
          <FormSelect
            id="search-year"
            name="min_year"
            defaultValue={filters?.minYear?.toString()}
            placeholder="Any Year"
            options={withCurrent(
              minYears().map((year) => ({ value: String(year), label: yearLabel(year) })),
              filters?.minYear,
              yearLabel,
            )}
          />
        </Field>
        <Field id="search-city" label="Location">
          <FormSelect
            id="search-city"
            name="city"
            defaultValue={filters?.city}
            placeholder="Any Location"
            options={CITIES.map((city) => ({ value: city, label: city }))}
            icon={<MapPin className="size-3.5 text-muted-foreground" />}
          />
        </Field>
        <Button type="submit" size="lg" className="h-11 px-6 text-xs font-semibold sm:col-span-2 lg:col-span-1">
          <Search className="size-4" />
          Search Cars
        </Button>
      </form>
    </Card>
  );
}
