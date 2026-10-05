import type { Metadata } from "next";
import { CityCard } from "@/components/city-card";
import { Pagination } from "@/components/pagination";
import { CITIES, CITY_SORTS, isCitySort, sortCities, type CitySort } from "@/lib/cities";
import { getActiveFacetCounts } from "@/lib/listings";
import { SortSelect } from "../listings/sort-select";

export const metadata: Metadata = {
  title: "Used cars by city | DriveLoop",
  description: "Browse used cars for sale in Riyadh, Jeddah, Dammam and every other city across Saudi Arabia.",
};

// Six rows of the three-column desktop grid.
const PAGE_SIZE = 18;

export default async function LocationsPage({ searchParams }: PageProps<"/locations">) {
  const query = await searchParams;
  const sort: CitySort = isCitySort(query.sort) ? query.sort : "most";
  const facets = await getActiveFacetCounts();
  const cities = sortCities(facets.cities, sort);

  const pageCount = Math.max(1, Math.ceil(cities.length / PAGE_SIZE));
  const requestedPage = Number(query.page);
  const page = Number.isInteger(requestedPage) ? Math.min(Math.max(requestedPage, 1), pageCount) : 1;
  const pageCities = cities.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Keep the sort when paging.
  function pageHref(target: number) {
    const search = new URLSearchParams();
    if (sort !== "most") search.set("sort", sort);
    if (target > 1) search.set("page", String(target));
    const qs = search.toString();
    return qs ? `/locations?${qs}` : "/locations";
  }

  return (
    <main className="light bg-canvas text-ink">
      <section className="relative overflow-hidden bg-charcoal">
        <div className="absolute inset-y-0 right-0 w-2/3 bg-[radial-gradient(ellipse_at_70%_60%,rgba(111,224,124,.16),transparent_60%)]" />
        <div className="relative mx-auto w-full max-w-6xl px-4 pt-10 pb-14 sm:px-6">
          <p className="text-eyebrow font-bold tracking-[0.24em] text-[#5fd06e]">LOCATIONS</p>
          <h1 className="mt-2.5 max-w-md text-3xl leading-tight font-medium tracking-tight text-white md:text-4xl">
            Browse Cars <span className="text-lime">by City</span>
          </h1>
          <p className="mt-3.5 max-w-sm text-label leading-relaxed text-white/85">
            Find used cars for sale near you, from private sellers and dealers across the Kingdom.
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-label font-semibold">
            {CITIES.length} Cities
            <span className="font-normal text-muted-foreground">
              {" "}
              · {facets.total} {facets.total === 1 ? "car" : "cars"} for sale
            </span>
          </p>
          <SortSelect value={sort} options={CITY_SORTS} />
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {pageCities.map((city) => (
            <li key={city}>
              <CityCard city={city} count={facets.cities.get(city) ?? 0} />
            </li>
          ))}
        </ul>
        <Pagination page={page} pageCount={pageCount} hrefFor={pageHref} />
      </div>
    </main>
  );
}
