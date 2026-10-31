import Link from "@/components/locale-link";
import { SearchX } from "lucide-react";
import { ListingGrid } from "@/components/listing-card";
import { Pagination } from "@/components/pagination";
import { SaveSearchButton } from "@/components/save-search-button";
import { EquipmentSearchBar } from "@/components/equipment-search-bar";
import { SearchBar } from "@/components/search-bar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { count, fmt } from "@/lib/dictionary";
import { getViewerFavoriteIds } from "@/lib/favorites";
import { getDictionary } from "@/lib/i18n-server";
import {
  getActiveFacetCounts,
  getFeaturedListings,
  listingFiltersToParams,
  PAGE_SIZE,
  searchListings,
  type ListingFilters,
} from "@/lib/listings";
import {
  browseBaseHref,
  defaultSearchName,
  hasActiveFilters,
  listingsHref,
  MAX_SAVED_SEARCH_NAME,
} from "@/lib/saved-searches";
import { ActiveFilters } from "./active-filters";
import { Filters } from "./filters";
import { MobileFilters } from "./mobile-filters";
import { SortSelect } from "./sort-select";

// The search results, filters and paging shared by /listings (cars for sale)
// and /rentals (cars and equipment for rent). Each page renders its own hero.
export async function Browse({
  filters,
  params,
  hero,
}: {
  filters: ListingFilters;
  params: Record<string, string | string[] | undefined>;
  hero: React.ReactNode;
}) {
  const { t, locale } = await getDictionary();
  const rent = filters.type === "rent";
  const equipment = filters.category === "equipment";
  const basePath = rent ? "/rentals" : "/listings";
  const clearHref = browseBaseHref(filters);
  const [{ listings, total }, featured, favoriteIds, current, facets] = await Promise.all([
    searchListings(filters),
    filters.page === 1 ? getFeaturedListings(filters, 3) : [],
    getViewerFavoriteIds(),
    getCurrentUser(),
    // Facet counts cover cars for sale; they'd mislead on the rentals tabs.
    rent ? null : getActiveFacetCounts(),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const searchParamsForSave = listingFiltersToParams(filters);
  const searchHref = listingsHref(filters);

  // Keep the current filters when paging.
  function pageHref(page: number) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "string" && value !== "" && key !== "page" && key !== "type") query.set(key, value);
    }
    if (page > 1) query.set("page", String(page));
    const search = query.toString();
    return search ? `${basePath}?${search}` : basePath;
  }

  // Featured listings sit in their own strip above, so don't repeat them in the grid.
  const featuredIds = new Set(featured.map((listing) => listing.id));
  const results = listings.filter((listing) => !featuredIds.has(listing.id));
  const filtered = hasActiveFilters(filters);
  // Past-the-end pages also report total 0 (see searchListings), so only page 1 counts as "no results".
  const noResults = total === 0 && filters.page === 1;

  const counts = facets
    ? {
        conditions: Object.fromEntries(facets.conditions),
        fuelTypes: Object.fromEntries(facets.fuelTypes),
        bodyTypes: Object.fromEntries(facets.bodyTypes),
        transmissions: Object.fromEntries(facets.transmissions),
      }
    : undefined;
  const found = equipment ? t.equipment.found : rent ? t.rentals.found : t.listings.found;
  const emptyMessage = equipment ? t.equipment.noMatchEmpty : rent ? t.rentals.noMatchEmpty : t.listings.noMatchEmpty;
  const filterProps = { filters, counts, basePath, clearHref };

  return (
    <main className="light bg-canvas text-ink">
      {hero}

      {/* Cars search by make/model; equipment has its own type/brand bar. */}
      <div className="relative mx-auto -mt-10 w-full max-w-6xl px-4 sm:px-6">
        {equipment ? (
          <EquipmentSearchBar key={searchHref} filters={filters} />
        ) : (
          <SearchBar key={searchHref} filters={filters} />
        )}
      </div>

      <div className="mx-auto mt-6 grid w-full max-w-6xl items-start gap-6 px-4 sm:px-6 lg:grid-cols-[16.0625rem_minmax(0,1fr)]">
        <Card className="gap-0 rounded-lg p-4 shadow-[0_2px_10px_rgba(20,30,25,.05)] ring-0 max-lg:hidden">
          <Filters key={searchHref} {...filterProps} idPrefix="sidebar" />
        </Card>
        <MobileFilters>
          <Filters key={searchHref} {...filterProps} idPrefix="sheet" />
        </MobileFilters>

        <section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-label font-semibold">
              {count(locale, total, found)}
              {filters.q && <span className="font-normal text-muted-foreground">{fmt(t.listings.matching, { q: filters.q })}</span>}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {filtered && (
                <SaveSearchButton
                  key={searchHref}
                  params={searchParamsForSave}
                  defaultName={defaultSearchName(filters, t, locale)}
                  maxNameLength={MAX_SAVED_SEARCH_NAME}
                  signedIn={current !== null}
                  loginHref={`/login?next=${encodeURIComponent(searchHref)}`}
                />
              )}
              <SortSelect value={filters.sort} />
            </div>
          </div>
          <ActiveFilters filters={filters} />

          {noResults && (
            <Card className="mt-4 items-center gap-2 rounded-lg px-6 py-12 text-center shadow-[0_2px_10px_rgba(20,30,25,.05)] ring-0">
              <SearchX className="size-8 text-brand-600" strokeWidth={1.6} />
              <p className="mt-1 text-sm font-semibold">{equipment ? t.equipment.noMatchTitle : t.listings.noMatchTitle}</p>
              <p className="max-w-sm text-xs text-muted-foreground">
                {filtered ? (equipment ? t.equipment.noMatchFiltered : t.listings.noMatchFiltered) : emptyMessage}
              </p>
              {filtered && (
                <Button asChild size="sm" className="mt-3 text-xs max-sm:text-sm font-semibold">
                  <Link href={clearHref}>{t.listings.clearAllFilters}</Link>
                </Button>
              )}
            </Card>
          )}

          {featured.length > 0 && (
            <div className="mt-4 mb-8 border-b border-line pb-8">
              <p className="mb-3 text-caption font-bold tracking-[0.2em] text-brand-600">{t.listings.featured}</p>
              <ListingGrid listings={featured} favoriteIds={favoriteIds} columns={3} />
            </div>
          )}
          <div className="mt-4">
            <ListingGrid
              listings={results}
              // The no-results card covers page 1; otherwise this is a page past the end.
              empty={noResults || featured.length > 0 ? "" : t.listings.emptyPage}
              favoriteIds={favoriteIds} columns={3} />
          </div>
          <Pagination page={filters.page} pageCount={pageCount} hrefFor={pageHref} />
        </section>
      </div>
    </main>
  );
}

// The dark band at the top of a browse page.
export function BrowseHero({ children }: { children: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-charcoal">
      <div className="absolute inset-y-0 end-0 w-2/3 bg-[radial-gradient(ellipse_at_70%_60%,rgba(111,224,124,.16),transparent_60%)] rtl:bg-[radial-gradient(ellipse_at_30%_60%,rgba(111,224,124,.16),transparent_60%)]" />
      <div className="relative mx-auto w-full max-w-6xl px-4 pt-10 pb-20 sm:px-6">{children}</div>
    </section>
  );
}
