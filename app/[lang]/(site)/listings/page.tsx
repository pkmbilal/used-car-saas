import type { Metadata } from "next";
import Link from "@/components/locale-link";
import { SearchX } from "lucide-react";
import { ListingGrid } from "@/components/listing-card";
import { Pagination } from "@/components/pagination";
import { SaveSearchButton } from "@/components/save-search-button";
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
  parseListingFilters,
  searchListings,
} from "@/lib/listings";
import {
  defaultSearchName,
  hasActiveFilters,
  listingsHref,
  MAX_SAVED_SEARCH_NAME,
} from "@/lib/saved-searches";
import { pageMetadata } from "@/lib/seo";
import { ActiveFilters } from "./active-filters";
import { Filters } from "./filters";
import { MobileFilters } from "./mobile-filters";
import { DistanceChips } from "./distance-chips";
import { SortSelect } from "./sort-select";

export async function generateMetadata({ searchParams }: PageProps<"/[lang]/listings">): Promise<Metadata> {
  const { t } = await getDictionary();
  const filters = parseListingFilters(await searchParams);
  return pageMetadata({
    title: t.listings.metaTitle,
    description: t.listings.metaDescription,
    path: "/listings",
    // Filtered results all canonicalize to the plain list; only its pages stand alone.
    page: hasActiveFilters(filters) ? 1 : filters.page,
  });
}

export default async function ListingsPage({ searchParams }: PageProps<"/[lang]/listings">) {
  const params = await searchParams;
  const { t, locale } = await getDictionary();
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

  // Featured cars sit in their own strip above, so don't repeat them in the grid.
  const featuredIds = new Set(featured.map((listing) => listing.id));
  const results = listings.filter((listing) => !featuredIds.has(listing.id));
  // "Near me" isn't a saved-search filter, but it still narrows the results.
  const filtered = hasActiveFilters(filters) || filters.near !== undefined;
  // Past-the-end pages also report total 0 (see searchListings), so only page 1 counts as "no results".
  const noResults = total === 0 && filters.page === 1;

  const counts = {
    conditions: Object.fromEntries(facets.conditions),
    fuelTypes: Object.fromEntries(facets.fuelTypes),
    bodyTypes: Object.fromEntries(facets.bodyTypes),
    transmissions: Object.fromEntries(facets.transmissions),
  };

  return (
    <main className="light bg-canvas text-ink">
      <section className="relative overflow-hidden bg-charcoal">
        <div className="absolute inset-y-0 end-0 w-2/3 bg-[radial-gradient(ellipse_at_70%_60%,rgba(111,224,124,.16),transparent_60%)] rtl:bg-[radial-gradient(ellipse_at_30%_60%,rgba(111,224,124,.16),transparent_60%)]" />
        <div className="relative mx-auto w-full max-w-6xl px-4 pt-10 pb-20 sm:px-6">
          <p className="text-eyebrow font-bold tracking-[0.24em] text-[#5fd06e]">{t.listings.eyebrow}</p>
          <h1 className="mt-2.5 max-w-md text-3xl leading-tight font-medium tracking-tight text-white md:text-4xl">
            {t.listings.titleStart} <span className="text-lime">{t.listings.titleHighlight}</span> {t.listings.titleEnd}
          </h1>
          <p className="mt-3.5 max-w-sm text-label leading-relaxed text-white/85">
            {t.listings.intro}
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
            <p className="text-label font-semibold">
              {count(locale, total, t.listings.found)}
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
              {filters.near ? (
                <SortSelect value={filters.sort} options={{ nearest: t.nearMe.sortNearest, ...t.listings.sort }} />
              ) : (
                <SortSelect value={filters.sort} />
              )}
            </div>
          </div>
          <ActiveFilters filters={filters} />
          <DistanceChips filters={filters} params={params} />

          {noResults && (
            <Card className="mt-4 items-center gap-2 rounded-lg px-6 py-12 text-center shadow-[0_2px_10px_rgba(20,30,25,.05)] ring-0">
              <SearchX className="size-8 text-brand-600" strokeWidth={1.6} />
              <p className="mt-1 text-sm font-semibold">{t.listings.noMatchTitle}</p>
              <p className="max-w-sm text-xs text-muted-foreground">
                {filtered ? t.listings.noMatchFiltered : t.listings.noMatchEmpty}
              </p>
              {filtered && (
                <Button asChild size="sm" className="mt-3 text-xs max-sm:text-sm font-semibold">
                  <Link href="/listings">{t.listings.clearAllFilters}</Link>
                </Button>
              )}
            </Card>
          )}

          {featured.length > 0 && (
            <div className="mt-4 mb-8 border-b border-line pb-8">
              <p className="mb-3 text-caption font-bold tracking-[0.2em] text-brand-600">{t.listings.featured}</p>
              <ListingGrid listings={featured} favoriteIds={favoriteIds} columns={3} near={filters.near} />
            </div>
          )}
          <div className="mt-4">
            <ListingGrid
              listings={results}
              // The no-results card covers page 1; otherwise this is a page past the end.
              empty={noResults || featured.length > 0 ? "" : t.listings.emptyPage}
              favoriteIds={favoriteIds} columns={3} near={filters.near} />
          </div>
          <Pagination page={filters.page} pageCount={pageCount} hrefFor={pageHref} />
        </section>
      </div>
    </main>
  );
}
