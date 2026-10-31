import { MapPin, Search } from "lucide-react";
import { FormSelect } from "@/components/form-select";
import { Field, MAX_DAILY_PRICES, styles, withCurrent } from "@/components/search-bar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CITIES } from "@/lib/cities";
import { cityName, fmt } from "@/lib/dictionary";
import { EQUIPMENT_BRANDS, EQUIPMENT_TYPES, equipmentBrandName, equipmentTypeName } from "@/lib/equipment";
import { formatSAR } from "@/lib/format";
import { localizePath } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n-server";
import type { ListingFilters } from "@/lib/listings";
import { cn } from "@/lib/utils";

// Quick search for the equipment rentals tab. Uses the same URL params as the
// sidebar filters, so both stay in sync. Like the car bar, it starts a fresh
// search: several types ticked in the sidebar show here as "Any type".
export async function EquipmentSearchBar({ filters, className }: { filters: ListingFilters; className?: string }) {
  const style = styles.default;
  const { t, locale } = await getDictionary();
  const priceLabel = (price: number) => fmt(t.search.upTo, { price: formatSAR(price, locale) });
  const search = (placeholder: string) => ({ placeholder, emptyText: t.select.noMatches });

  return (
    <Card className={cn("gap-0 rounded-xl py-0 shadow-[0_10px_30px_rgba(20,30,25,.08)] ring-0", className)}>
      <form
        method="get"
        action={localizePath(locale, "/rentals")}
        className={cn(style.form, "lg:grid-cols-[repeat(4,minmax(0,1fr))_auto]")}
      >
        <input type="hidden" name="category" value="equipment" />
        {filters.sort !== "newest" && <input type="hidden" name="sort" value={filters.sort} />}
        <Field id="search-equipment-type" label={t.search.equipmentType} variant="default">
          <FormSelect
            id="search-equipment-type"
            name="equipment_type"
            defaultValue={filters.equipmentTypes.length === 1 ? filters.equipmentTypes[0] : undefined}
            placeholder={t.search.anyType}
            search={search(t.select.searchTypes)}
            options={EQUIPMENT_TYPES.map((type) => ({ value: type, label: equipmentTypeName(locale, type) }))}
          />
        </Field>
        <Field id="search-brand" label={t.search.brand} variant="default">
          <FormSelect
            id="search-brand"
            name="make"
            defaultValue={filters.make}
            placeholder={t.search.anyBrand}
            search={search(t.select.searchBrands)}
            options={EQUIPMENT_BRANDS.map((brand) => ({ value: brand, label: equipmentBrandName(locale, brand) }))}
          />
        </Field>
        <Field id="search-price" label={t.search.maxPrice} variant="default">
          <FormSelect
            id="search-price"
            name="max_price"
            defaultValue={filters.maxPrice?.toString()}
            placeholder={t.search.anyPrice}
            options={withCurrent(
              MAX_DAILY_PRICES.map((price) => ({ value: String(price), label: priceLabel(price) })),
              filters.maxPrice,
              priceLabel,
            )}
          />
        </Field>
        <Field id="search-city" label={t.search.location} variant="default">
          <FormSelect
            id="search-city"
            name="city"
            defaultValue={filters.city}
            placeholder={t.search.anyLocation}
            search={search(t.select.searchCities)}
            options={CITIES.map((city) => ({ value: city, label: cityName(t, city) }))}
            icon={<MapPin className="size-3.5 text-muted-foreground" />}
          />
        </Field>
        <Button type="submit" size="lg" className="h-11 px-6 text-xs font-semibold max-sm:text-sm sm:col-span-2 lg:col-span-1">
          <Search className="size-4" />
          {t.search.searchEquipment}
        </Button>
      </form>
    </Card>
  );
}
