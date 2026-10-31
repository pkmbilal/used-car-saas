import type { Metadata } from "next";
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
  const equipment = filters.category === "equipment";

  return (
    <Browse
      filters={filters}
      params={params}
      hero={
        <BrowseHero>
          <CategoryTabs
            active={filters.category}
            labels={{ car: t.equipment.carsTab, equipment: t.equipment.equipmentTab }}
          />
          <h1 className="mt-4 max-w-md text-3xl leading-tight font-medium tracking-tight text-white md:text-4xl">
            <span className="text-lime">{equipment ? t.equipment.browseTitle : t.rentals.browseTitle}</span>
          </h1>
          <p className="mt-3.5 max-w-sm text-label leading-relaxed text-white/85">
            {equipment ? t.equipment.browseIntro : t.rentals.browseIntro}
          </p>
        </BrowseHero>
      }
    />
  );
}

// Cars | Equipment. Switching drops the other tab's filters, since they differ.
function CategoryTabs({
  active,
  labels,
}: {
  active: ListingCategory;
  labels: Record<ListingCategory, string>;
}) {
  const tabs = [
    { category: "car", href: "/rentals" },
    { category: "equipment", href: "/rentals?category=equipment" },
  ] as const;
  return (
    <nav className="inline-flex rounded-full bg-white/10 p-1 ring-1 ring-white/15">
      {tabs.map((tab) => (
        <Link
          key={tab.category}
          href={tab.href}
          aria-current={tab.category === active ? "page" : undefined}
          className={`rounded-full px-5 py-1.5 text-sm font-semibold transition ${
            tab.category === active ? "bg-lime text-on-lime" : "text-white/80 hover:text-white"
          }`}
        >
          {labels[tab.category]}
        </Link>
      ))}
    </nav>
  );
}
