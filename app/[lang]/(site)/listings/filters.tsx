"use client";

import { useDictionary } from "@/components/i18n-provider";
import Link from "@/components/locale-link";
import { Search, SlidersHorizontal } from "lucide-react";
import { FormSelect } from "@/components/form-select";
import { MakeModelSelects } from "@/components/make-model-selects";
import { CheckboxGroup } from "./checkbox-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CITIES } from "@/lib/cities";
import { EQUIPMENT_BRANDS, EQUIPMENT_TYPES, equipmentBrandName, equipmentTypeName } from "@/lib/equipment";
import { cityName, fmt, optionLabel } from "@/lib/dictionary";
import type { Dictionary } from "@/lib/dictionaries";
import { formatKm } from "@/lib/format";
import { localizePath, type Locale } from "@/lib/i18n";
import {
  BODY_TYPES,
  CONDITIONS,
  FEATURES,
  FUEL_TYPES,
  TRANSMISSIONS,
} from "@/lib/listing-options";
import type { ListingFilters } from "@/lib/listings";

const inputClass = "h-9 bg-white text-xs max-sm:h-10 max-sm:text-base";
const labelClass = "text-caption font-semibold text-ink";

function Range({
  t,
  label,
  hint,
  minName,
  maxName,
  min,
  max,
}: {
  t: Dictionary;
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
        {hint && <span className="text-eyebrow text-muted-foreground">{hint}</span>}
      </legend>
      <div className="flex items-center gap-2">
        <Input name={minName} type="number" min={0} placeholder={t.listings.filters.min} aria-label={fmt(t.listings.filters.rangeMin, { label })} defaultValue={min} className={inputClass} />
        <span className="text-xs text-muted-foreground">–</span>
        <Input name={maxName} type="number" min={0} placeholder={t.listings.filters.max} aria-label={fmt(t.listings.filters.rangeMax, { label })} defaultValue={max} className={inputClass} />
      </div>
    </fieldset>
  );
}

export type FilterCounts = {
  conditions: Record<string, number>;
  fuelTypes: Record<string, number>;
  bodyTypes: Record<string, number>;
  transmissions: Record<string, number>;
};

const MAX_MILEAGES = [20_000, 50_000, 100_000, 150_000, 200_000];

// Keeps a custom value from the URL (e.g. max_mileage=80000) selectable.
function mileageOptions(t: Dictionary, locale: Locale, current: number | undefined) {
  const values = current === undefined || MAX_MILEAGES.includes(current) ? MAX_MILEAGES : [current, ...MAX_MILEAGES];
  return values.map((km) => ({ value: String(km), label: fmt(t.listings.filters.upTo, { value: formatKm(km, locale) }) }));
}

// Plain GET form: filters live in the URL. Client-side only for the Radix
// controls; "Any" choices are left out of the query entirely.
export function Filters({
  filters,
  counts,
  basePath,
  clearHref,
  idPrefix = "filters",
}: {
  filters: ListingFilters;
  // The section the form submits to (/listings or /rentals).
  basePath: string;
  // The section's unfiltered page.
  clearHref: string;
  // Active-listing counts per option, keyed by value; omitted where they would mislead (rentals).
  counts?: FilterCounts;
  // Filters render twice (sidebar and mobile sheet), so ids need a prefix.
  idPrefix?: string;
}) {
  const { t, locale } = useDictionary();
  const f = t.listings.filters;
  const id = (name: string) => `${idPrefix}-${name}`;
  const groupProps = { idPrefix, legendClassName: labelClass };
  const equipment = filters.category === "equipment";
  const rent = filters.type === "rent";

  return (
    <form method="get" action={localizePath(locale, basePath)} className="flex flex-col gap-5">
      {filters.sort !== "newest" && <input type="hidden" name="sort" value={filters.sort} />}
      {equipment && <input type="hidden" name="category" value="equipment" />}
      <div className="flex items-center gap-2 border-b border-line pb-3">
        <SlidersHorizontal className="size-4 text-brand-600" />
        <span className="text-sm font-bold">{f.title}</span>
        <Button asChild variant="link" size="sm" className="ms-auto h-auto p-0 max-sm:h-auto text-caption font-semibold text-brand">
          <Link href={clearHref}>{f.clearAll}</Link>
        </Button>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={id("q")} className={labelClass}>
          {f.keyword}
        </Label>
        <Input
          id={id("q")}
          name="q"
          type="search"
          maxLength={100}
          placeholder={f.keywordPlaceholder}
          defaultValue={filters.q}
          className={inputClass}
        />
      </div>
      {equipment ? (
        <>
          <CheckboxGroup
            {...groupProps}
            title={t.equipment.type}
            name="equipment_type"
            selected={filters.equipmentTypes}
            options={EQUIPMENT_TYPES.map((value) => ({ value, label: equipmentTypeName(locale, value) }))}
          />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={id("make")} className={labelClass}>
              {t.equipment.brand}
            </Label>
            <FormSelect
              id={id("make")}
              name="make"
              defaultValue={filters.make}
              placeholder={t.common.any}
              search={{ placeholder: t.select.searchBrands, emptyText: t.select.noMatches }}
              options={EQUIPMENT_BRANDS.map((brand) => ({ value: brand, label: equipmentBrandName(locale, brand) }))}
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-caption font-semibold text-ink">
            <input
              type="checkbox"
              name="operator"
              value="1"
              defaultChecked={filters.withOperator}
              className="size-4 accent-brand"
            />
            {t.equipment.operatorFilter}
          </label>
        </>
      ) : (
        <MakeModelSelects
          make={filters.make}
          model={filters.model}
          makeId={id("make")}
          modelId={id("model")}
          makePlaceholder={t.common.any}
          modelPlaceholder={t.common.any}
          fieldClassName="flex flex-col gap-1.5"
          labelClassName={labelClass}
        />
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={id("city")} className={labelClass}>
          {f.city}
        </Label>
        <FormSelect
          id={id("city")}
          name="city"
          defaultValue={filters.city}
          placeholder={t.common.any}
          options={CITIES.map((city) => ({ value: city, label: cityName(t, city) }))}
        />
      </div>
      <Range t={t} label={rent ? t.rentals.dailyPriceRange : f.priceRange} hint={f.currency} minName="min_price" maxName="max_price" min={filters.minPrice} max={filters.maxPrice} />
      <Range t={t} label={f.year} minName="min_year" maxName="max_year" min={filters.minYear} max={filters.maxYear} />
      {!rent && (
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={id("mileage")} className={labelClass}>
          {f.mileage}
        </Label>
        <FormSelect
          id={id("mileage")}
          name="max_mileage"
          defaultValue={filters.maxMileage?.toString()}
          placeholder={f.anyMileage}
          options={mileageOptions(t, locale, filters.maxMileage)}
        />
      </div>
      )}
      <CheckboxGroup
        {...groupProps}
        title={f.condition}
        name="condition"
        selected={filters.conditions}
        options={CONDITIONS.map((value) => ({ value, label: optionLabel(t.options.condition, value), count: counts && (counts.conditions[value] ?? 0) }))}
      />
      {!equipment && (
      <CheckboxGroup
        {...groupProps}
        title={f.bodyStyle}
        name="body_type"
        selected={filters.bodyTypes}
        options={BODY_TYPES.map((value) => ({ value, label: optionLabel(t.options.bodyType, value), count: counts && (counts.bodyTypes[value] ?? 0) }))}
      />
      )}
      <CheckboxGroup
        {...groupProps}
        title={f.fuelType}
        name="fuel_type"
        selected={filters.fuelTypes}
        options={FUEL_TYPES.map((value) => ({ value, label: optionLabel(t.options.fuel, value), count: counts && (counts.fuelTypes[value] ?? 0) }))}
      />
      {!equipment && (
      <>
      <CheckboxGroup
        {...groupProps}
        title={f.transmission}
        name="transmission"
        selected={filters.transmissions}
        options={TRANSMISSIONS.map((value) => ({ value, label: optionLabel(t.options.transmission, value), count: counts && (counts.transmissions[value] ?? 0) }))}
      />
      <CheckboxGroup
        {...groupProps}
        title={f.features}
        name="features"
        selected={filters.features}
        options={FEATURES.map(({ value }) => ({ value, label: optionLabel(t.options.features, value) }))}
      />
      </>
      )}
      <Button type="submit" className="h-9 text-xs max-sm:text-sm font-semibold">
        <Search className="size-3.5" />
        {f.apply}
      </Button>
    </form>
  );
}
