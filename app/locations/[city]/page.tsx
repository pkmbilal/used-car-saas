import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ChevronRight } from "lucide-react";
import { CityCard } from "@/components/city-card";
import { DealerCard } from "@/components/dealer-card";
import { ListingGrid } from "@/components/listing-card";
import { Pagination } from "@/components/pagination";
import { citiesByCount, cityFromSlug, cityHref } from "@/lib/cities";
import { getViewerFavoriteIds } from "@/lib/favorites";
import { getActiveFacetCounts, PAGE_SIZE, parseListingFilters, searchListings } from "@/lib/listings";
import { getDealerStorefronts } from "@/lib/storefront";
import { SortSelect } from "../../listings/sort-select";

const numberFormatter = new Intl.NumberFormat("en-US");

export async function generateMetadata({ params }: PageProps<"/locations/[city]">): Promise<Metadata> {
  const city = cityFromSlug((await params).city);
  if (!city) return { title: "City not found" };
  return {
    title: `Used cars for sale in ${city} | DriveLoop`,
    description: `Browse used cars for sale in ${city} from private sellers and dealers, and contact them directly.`,
  };
}

export default async function CityPage({ params, searchParams }: PageProps<"/locations/[city]">) {
  const city = cityFromSlug((await params).city);
  if (!city) notFound();

  const query = await searchParams;
  // Only sort and page apply here; the full filter set lives on /listings.
  const filters = parseListingFilters({ sort: query.sort, page: query.page, city });
  const [{ listings, total }, facets, favoriteIds, dealers] = await Promise.all([
    searchListings(filters),
    getActiveFacetCounts(),
    getViewerFavoriteIds(),
    getDealerStorefronts(),
  ]);
  const cityDealers = dealers.filter((dealer) => dealer.profile.city === city);
  const otherCities = citiesByCount(facets.cities)
    .filter((other) => other !== city)
    .slice(0, 6);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const basePath = cityHref(city);

  // Keep the sort when paging.
  function pageHref(page: number) {
    const search = new URLSearchParams();
    if (filters.sort !== "newest") search.set("sort", filters.sort);
    if (page > 1) search.set("page", String(page));
    const qs = search.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  return (
    <main className="light bg-canvas text-ink">
      <section className="relative overflow-hidden bg-charcoal">
        <div className="absolute inset-y-0 right-0 w-2/3 bg-[radial-gradient(ellipse_at_70%_60%,rgba(111,224,124,.16),transparent_60%)]" />
        <div className="relative mx-auto w-full max-w-6xl px-4 pt-10 pb-14 sm:px-6">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-caption text-white/60">
            <Link href="/locations" className="text-white/60 hover:text-lime">
              Locations
            </Link>
            <ChevronRight className="size-3" />
            <span className="text-white">{city}</span>
          </nav>
          <h1 className="mt-3 max-w-md text-3xl leading-tight font-medium tracking-tight text-white md:text-4xl">
            Used Cars in <span className="text-lime">{city}</span>
          </h1>
          <p className="mt-3.5 text-label text-white/85">
            {numberFormatter.format(total)} {total === 1 ? "car" : "cars"} for sale
            {cityDealers.length > 0 &&
              ` · ${cityDealers.length} ${cityDealers.length === 1 ? "dealer" : "dealers"}`}
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/listings?city=${encodeURIComponent(city)}`}
            className="flex items-center gap-2 text-caption font-semibold text-brand"
          >
            Refine with filters
            <ArrowRight className="size-3" strokeWidth={2.4} />
          </Link>
          <SortSelect value={filters.sort} />
        </div>
        <div className="mt-4">
          <ListingGrid
            listings={listings}
            columns={3}
            favoriteIds={favoriteIds}
            empty={`No cars listed in ${city} yet.`}
          />
        </div>
        <Pagination page={filters.page} pageCount={pageCount} hrefFor={pageHref} />
      </section>

      {cityDealers.length > 0 && (
        <section className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6">
          <p className="text-caption font-bold tracking-[0.2em] text-brand-600">DEALERS</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Dealers in {city}</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {cityDealers.map((dealer) => (
              <li key={dealer.id}>
                <DealerCard dealer={dealer} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-caption font-bold tracking-[0.2em] text-brand-600">MORE LOCATIONS</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Other Cities</h2>
          </div>
          <Link
            href="/locations"
            className="mb-1 flex shrink-0 items-center gap-2 text-caption font-semibold text-brand"
          >
            All Cities
            <ArrowRight className="size-3" strokeWidth={2.4} />
          </Link>
        </div>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {otherCities.map((other) => (
            <li key={other}>
              <CityCard city={other} count={facets.cities.get(other) ?? 0} />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
