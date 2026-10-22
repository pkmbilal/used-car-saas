import { CalendarDays, Car, CarFront, MapPin, Search, Wallet } from "lucide-react";
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

type Variant = "default" | "hero";

const styles = {
  default: {
    form: "grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-[repeat(5,minmax(0,1fr))_auto] lg:items-end lg:gap-3 lg:pl-7",
    field: "flex min-w-0 flex-col gap-2 lg:border-r lg:border-line lg:pr-3",
    label: "text-caption font-semibold text-ink",
    trigger: undefined,
  },
  // Hairline grid: the 1px gaps show the bg-line behind the white cells.
  hero: {
    form: "grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-[repeat(5,minmax(0,1fr))_auto]",
    field:
      "relative flex min-w-0 flex-col gap-1.5 bg-white px-5 py-4 transition-colors hover:bg-canvas focus-within:bg-canvas",
    // text-(length:…) so cn doesn't mistake the custom size for a color and drop it.
    label: "gap-1.5 text-(length:--text-eyebrow) font-semibold tracking-[0.18em] text-muted-foreground uppercase",
    // The ::after stretches the trigger over its whole cell, so the cell is the click target.
    trigger:
      "h-auto border-0 bg-transparent p-0 text-sm font-semibold text-ink shadow-none focus-visible:ring-0 data-[size=default]:h-auto max-sm:data-[size=default]:h-auto dark:bg-transparent after:absolute after:inset-0",
  },
} satisfies Record<Variant, { form: string; field: string; label: string; trigger: string | undefined }>;

function FieldLabel({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: string }) {
  return (
    <>
      <Icon className="size-3.5 text-brand" />
      {children}
    </>
  );
}

function Field({
  id,
  label,
  variant,
  className,
  children,
}: {
  id: string;
  label: React.ReactNode;
  variant: Variant;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn(styles[variant].field, className)}>
      <Label htmlFor={id} className={styles[variant].label}>
        {label}
      </Label>
      {children}
    </div>
  );
}

const priceLabel = (price: number) => `Up to ${formatSAR(price)}`;
const yearLabel = (year: number) => `${year} & newer`;

// Quick search card. A GET form, so the results page stays shareable.
// The "hero" variant is the larger, segmented version on the home page.
export function SearchBar({
  filters,
  className,
  variant = "default",
}: {
  filters?: ListingFilters;
  className?: string;
  variant?: Variant;
}) {
  const hero = variant === "hero";
  const style = styles[variant];

  return (
    <Card
      className={cn(
        "gap-0 py-0 ring-0",
        hero
          ? "overflow-hidden rounded-2xl shadow-[0_1px_2px_rgba(15,34,25,.06),0_30px_60px_-20px_rgba(15,34,25,.3)] ring-1 ring-black/5"
          : "rounded-xl shadow-[0_10px_30px_rgba(20,30,25,.08)]",
        className,
      )}
    >
      {hero && (
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3.5">
          <span className="flex items-center gap-2 text-eyebrow font-semibold tracking-[0.2em] text-ink">
            <span aria-hidden className="size-1.5 rounded-full bg-lime" />
            FIND YOUR CAR
          </span>
        </div>
      )}
      <form method="get" action="/listings" className={style.form}>
        {filters?.sort && filters.sort !== "newest" && <input type="hidden" name="sort" value={filters.sort} />}
        <MakeModelSelects
          make={filters?.make}
          model={filters?.model}
          makeId="search-make"
          modelId="search-model"
          makePlaceholder="Any Make"
          modelPlaceholder="Any Model"
          fieldClassName={style.field}
          labelClassName={style.label}
          triggerClassName={style.trigger}
          makeLabel={hero ? <FieldLabel icon={CarFront}>Make</FieldLabel> : undefined}
          modelLabel={hero ? <FieldLabel icon={Car}>Model</FieldLabel> : undefined}
        />
        <Field
          id="search-price"
          label={hero ? <FieldLabel icon={Wallet}>Max Price</FieldLabel> : "Max Price"}
          variant={variant}
        >
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
            className={style.trigger}
          />
        </Field>
        <Field
          id="search-year"
          label={hero ? <FieldLabel icon={CalendarDays}>Year</FieldLabel> : "Year"}
          variant={variant}
        >
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
            className={style.trigger}
          />
        </Field>
        <Field
          id="search-city"
          label={hero ? <FieldLabel icon={MapPin}>Location</FieldLabel> : "Location"}
          variant={variant}
          className={hero ? "sm:col-span-2 lg:col-span-1" : undefined}
        >
          <FormSelect
            id="search-city"
            name="city"
            defaultValue={filters?.city}
            placeholder="Any Location"
            options={CITIES.map((city) => ({ value: city, label: city }))}
            icon={hero ? undefined : <MapPin className="size-3.5 text-muted-foreground" />}
            className={style.trigger}
          />
        </Field>
        {hero ? (
          <div className="bg-white p-3 sm:col-span-2 lg:col-span-1">
            <Button
              type="submit"
              size="lg"
              className="h-12 w-full rounded-xl bg-forest-dark px-7 text-sm font-semibold text-white hover:bg-brand lg:h-full lg:min-h-14"
            >
              <Search className="size-4 text-lime" strokeWidth={2.4} />
              Search Cars
            </Button>
          </div>
        ) : (
          <Button type="submit" size="lg" className="h-11 px-6 text-xs max-sm:text-sm font-semibold sm:col-span-2 lg:col-span-1">
            <Search className="size-4" />
            Search Cars
          </Button>
        )}
      </form>
    </Card>
  );
}
