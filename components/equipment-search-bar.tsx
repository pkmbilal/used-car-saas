import { MapPin, Tag, Truck, Wallet } from "lucide-react";
import { FormSelect } from "@/components/form-select";
import {
  Field,
  FieldLabel,
  MAX_DAILY_PRICES,
  SearchCard,
  styles,
  SubmitButton,
  withCurrent,
  type Variant,
} from "@/components/search-bar";
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
// The "hero" variant is the home page's segmented version.
export async function EquipmentSearchBar({
  filters,
  className,
  variant = "default",
  tabbed = false,
}: {
  filters?: ListingFilters;
  className?: string;
  variant?: Variant;
  tabbed?: boolean;
}) {
  const hero = variant === "hero";
  const style = styles[variant];
  const { t, locale } = await getDictionary();
  const priceLabel = (price: number) => fmt(t.search.upTo, { price: formatSAR(price, locale) });
  const search = (placeholder: string) => ({ placeholder, emptyText: t.select.noMatches });
  const label = (icon: typeof Truck, text: string) => (hero ? <FieldLabel icon={icon}>{text}</FieldLabel> : text);
  const equipmentTypes = filters?.equipmentTypes ?? [];

  return (
    <SearchCard variant={variant} tabbed={tabbed} className={className}>
      <form
        method="get"
        action={localizePath(locale, "/rentals")}
        className={cn(style.form, "lg:grid-cols-[repeat(4,minmax(0,1fr))_auto]")}
      >
        <input type="hidden" name="category" value="equipment" />
        {filters?.sort && filters.sort !== "newest" && <input type="hidden" name="sort" value={filters.sort} />}
        <Field id="search-equipment-type" label={label(Truck, t.search.equipmentType)} variant={variant}>
          <FormSelect
            id="search-equipment-type"
            name="equipment_type"
            defaultValue={equipmentTypes.length === 1 ? equipmentTypes[0] : undefined}
            placeholder={t.search.anyType}
            search={search(t.select.searchTypes)}
            options={EQUIPMENT_TYPES.map((type) => ({ value: type, label: equipmentTypeName(locale, type) }))}
            className={style.trigger}
          />
        </Field>
        <Field id="search-brand" label={label(Tag, t.search.brand)} variant={variant}>
          <FormSelect
            id="search-brand"
            name="make"
            defaultValue={filters?.make}
            placeholder={t.search.anyBrand}
            search={search(t.select.searchBrands)}
            options={EQUIPMENT_BRANDS.map((brand) => ({ value: brand, label: equipmentBrandName(locale, brand) }))}
            className={style.trigger}
          />
        </Field>
        <Field id="search-price" label={label(Wallet, t.search.maxPrice)} variant={variant}>
          <FormSelect
            id="search-price"
            name="max_price"
            defaultValue={filters?.maxPrice?.toString()}
            placeholder={t.search.anyPrice}
            options={withCurrent(
              MAX_DAILY_PRICES.map((price) => ({ value: String(price), label: priceLabel(price) })),
              filters?.maxPrice,
              priceLabel,
            )}
            className={style.trigger}
          />
        </Field>
        <Field id="search-city" label={label(MapPin, t.search.location)} variant={variant}>
          <FormSelect
            id="search-city"
            name="city"
            defaultValue={filters?.city}
            placeholder={t.search.anyLocation}
            search={search(t.select.searchCities)}
            options={CITIES.map((city) => ({ value: city, label: cityName(t, city) }))}
            icon={hero ? undefined : <MapPin className="size-3.5 text-muted-foreground" />}
            className={style.trigger}
          />
        </Field>
        <SubmitButton variant={variant}>{t.search.searchEquipment}</SubmitButton>
      </form>
    </SearchCard>
  );
}
