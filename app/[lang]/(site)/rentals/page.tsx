import type { Metadata } from "next";
import { CarFront, Truck } from "lucide-react";
import Link from "@/components/locale-link";
import { getDictionary } from "@/lib/i18n-server";
import type { ListingCategory } from "@/lib/listing-options";
import { parseListingFilters } from "@/lib/listings";
import { hasActiveFilters } from "@/lib/saved-searches";
import { pageMetadata } from "@/lib/seo";
import { Browse, BrowseHero } from "../listings/browse";

type Params = Record<string, string | string[] | undefined>;

// Everything here is for rent; ?category=equipment switches to the equipment tab.
function rentalFilters(params: Params) {
  return parseListingFilters({ ...params, type: "rent" });
}

export async function generateMetadata({ searchParams }: PageProps<"/[lang]/rentals">): Promise<Metadata> {
  const { t } = await getDictionary();
  const filters = rentalFilters(await searchParams);
  const equipment = filters.category === "equipment";
  return pageMetadata({
    title: equipment ? t.equipment.metaTitle : t.rentals.metaTitle,
    description: equipment ? t.equipment.metaDescription : t.rentals.metaDescription,
    path: equipment ? "/rentals?category=equipment" : "/rentals",
    page: hasActiveFilters(filters) ? 1 : filters.page,
  });
}

export default async function RentalsPage({ searchParams }: PageProps<"/[lang]/rentals">) {
  const params = await searchParams;
  const { t } = await getDictionary();
  const filters = rentalFilters(params);
  const copy = filters.category === "equipment" ? t.equipment : t.rentals;

  return (
    <Browse
      filters={filters}
      params={params}
      tabs={
        <CategoryTabs
          active={filters.category}
          labels={{ car: t.equipment.carsTab, equipment: t.equipment.equipmentTab }}
        />
      }
      hero={
        <BrowseHero withTabs>
          <p className="text-eyebrow font-bold tracking-[0.24em] text-[#5fd06e]">{copy.eyebrow}</p>
          <h1 className="mt-2.5 max-w-md text-3xl leading-tight font-medium tracking-tight text-white md:text-4xl">
            {copy.titleStart} <span className="text-lime">{copy.titleHighlight}</span> {copy.titleEnd}
          </h1>
          <p className="mt-3.5 max-w-sm text-label leading-relaxed text-white/85">{copy.browseIntro}</p>
        </BrowseHero>
      }
    />
  );
}

// Cars | Equipment, as folder tabs on top of the search card. The active tab is
// white and merges into the card. Switching drops the other tab's filters, since they differ.
function CategoryTabs({
  active,
  labels,
}: {
  active: ListingCategory;
  labels: Record<ListingCategory, string>;
}) {
  const tabs = [
    { category: "car", href: "/rentals", icon: CarFront },
    { category: "equipment", href: "/rentals?category=equipment", icon: Truck },
  ] as const;
  return (
    <nav className="relative flex gap-1">
      {tabs.map(({ category, href, icon: Icon }) => {
        const current = category === active;
        return (
          <Link
            key={category}
            href={href}
            aria-current={current ? "page" : undefined}
            className={`flex items-center gap-2 rounded-t-xl px-5 py-2.5 text-sm font-semibold transition ${
              current ? "bg-white text-ink" : "bg-white/10 text-white/80 hover:bg-white/15 hover:text-white"
            }`}
          >
            <Icon className={`size-4 ${current ? "text-brand" : ""}`} strokeWidth={1.8} />
            {labels[category]}
          </Link>
        );
      })}
    </nav>
  );
}
