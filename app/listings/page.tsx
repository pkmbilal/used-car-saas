import type { Metadata } from "next";
import { ListingGrid } from "@/components/listing-card";
import { Pagination } from "@/components/pagination";
import { SaveSearchButton } from "@/components/save-search-button";
import { SearchBar } from "@/components/search-bar";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { getViewerFavoriteIds } from "@/lib/favorites";
import {
  getActiveFacetCounts,
  getFeaturedListings,
  listingFiltersToParams,
  PAGE_SIZE,
  parseListingFilters,
  searchListings,
} from "@/lib/listings";
import {
  defaultSearchName,
  hasActiveFilters,
  listingsHref,
  MAX_SAVED_SEARCH_NAME,
} from "@/lib/saved-searches";
import { Filters } from "./filters";
import { MobileFilters } from "./mobile-filters";
import { SortSelect } from "./sort-select";

export const metadata: Metadata = {
  title: "Browse used cars | DriveLoop",
};

const numberFormatter = new Intl.NumberFormat("en-US");

export default async function ListingsPage({ searchParams }: PageProps<"/listings">) {
  const params = await searchParams;
  const filters = parseListingFilters(params);
  const [{ listings, total }, featured, favoriteIds, current, facets] = await Promise.all([
    searchListings(filters),
    filters.page === 1 ? getFeaturedListings(filters, 3) : [],
    getViewerFavoriteIds(),
    getCurrentUser(),
    getActiveFacetCounts(),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const searchParamsForSave = listingFiltersToParams(filters);
  const searchHref = listingsHref(filters);

  // Keep the current filters when paging.
  function pageHref(page: number) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "string" && value !== "" && key !== "page") query.set(key, value);
    }
    if (page > 1) query.set("page", String(page));
    const search = query.toString();
    return search ? `/listings?${search}` : "/listings";
  }

  const counts = {
    fuelTypes: Object.fromEntries(facets.fuelTypes),
    bodyTypes: Object.fromEntries(facets.bodyTypes),
    transmissions: Object.fromEntries(facets.transmissions),
  };

  return (
    <main className="light bg-canvas text-ink">
      <section className="relative overflow-hidden bg-charcoal">
        <div className="absolute inset-y-0 right-0 w-2/3 bg-[radial-gradient(ellipse_at_70%_60%,rgba(111,224,124,.16),transparent_60%)]" />
        <div className="relative mx-auto w-full max-w-6xl px-4 pt-10 pb-20 sm:px-6">
          <p className="text-[0.65625rem] font-bold tracking-[0.24em] text-[#5fd06e]">USED CARS FOR SALE</p>
          <h1 className="mt-2.5 max-w-md text-3xl leading-tight font-medium tracking-tight text-white md:text-4xl">
            Find Your <span className="text-lime">Perfect Car</span> With Easy Filters
          </h1>
          <p className="mt-3.5 max-w-sm text-[0.78125rem] leading-relaxed text-white/85">
            Set your preferences, find the right match, and contact the seller directly.
          </p>
        </div>
      </section>

      <div className="relative mx-auto -mt-10 w-full max-w-6xl px-4 sm:px-6">
        <SearchBar key={searchHref} filters={filters} />
      </div>

      <div className="mx-auto mt-6 grid w-full max-w-6xl items-start gap-6 px-4 sm:px-6 lg:grid-cols-[16.0625rem_minmax(0,1fr)]">
        <Card className="gap-0 rounded-lg p-4 shadow-[0_2px_10px_rgba(20,30,25,.05)] ring-0 max-lg:hidden">
          <Filters key={searchHref} filters={filters} counts={counts} idPrefix="sidebar" />
        </Card>
        <MobileFilters>
          <Filters key={searchHref} filters={filters} counts={counts} idPrefix="sheet" />
        </MobileFilters>

        <section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[0.8125rem] font-semibold">
              {numberFormatter.format(total)} {total === 1 ? "Car" : "Cars"} Found
              {filters.q && <span className="font-normal text-muted-foreground"> matching “{filters.q}”</span>}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {hasActiveFilters(filters) && (
                <SaveSearchButton
                  key={searchHref}
                  params={searchParamsForSave}
                  defaultName={defaultSearchName(filters)}
                  maxNameLength={MAX_SAVED_SEARCH_NAME}
                  signedIn={current !== null}
                  loginHref={`/login?next=${encodeURIComponent(searchHref)}`}
                />
              )}
              <SortSelect value={filters.sort} />
            </div>
          </div>

          {featured.length > 0 && (
            <div className="mt-4 mb-8 border-b border-line pb-8">
              <p className="mb-3 text-[0.6875rem] font-bold tracking-[0.2em] text-brand-600">FEATURED</p>
              <ListingGrid listings={featured} favoriteIds={favoriteIds} columns={3} />
            </div>
          )}
          <div className="mt-4">
            <ListingGrid listings={listings} favoriteIds={favoriteIds} columns={3} />
          </div>
          <Pagination page={filters.page} pageCount={pageCount} hrefFor={pageHref} />
        </section>
      </div>
    </main>
  );
}
