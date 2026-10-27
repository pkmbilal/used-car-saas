import type { Metadata } from "next";
import { CityCard } from "@/components/city-card";
import { Pagination } from "@/components/pagination";
import { CITIES, isCitySort, sortCities, type CitySort } from "@/lib/cities";
import { cityName, count } from "@/lib/dictionary";
import { getDictionary } from "@/lib/i18n-server";
import { getActiveFacetCounts } from "@/lib/listings";
import { SortSelect } from "../listings/sort-select";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return pageMetadata({ title: t.locations.metaTitle, description: t.locations.metaDescription, path: "/locations" });
}

// Six rows of the three-column desktop grid.
const PAGE_SIZE = 18;

export default async function LocationsPage({ searchParams }: PageProps<"/[lang]/locations">) {
  const query = await searchParams;
  const { t, locale } = await getDictionary();
  const l = t.locations;
  const sort: CitySort = isCitySort(query.sort) ? query.sort : "most";
  const facets = await getActiveFacetCounts();
  const cities = sortCities(facets.cities, sort, (city) => cityName(t, city), locale);

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
        <div className="absolute inset-y-0 end-0 w-2/3 bg-[radial-gradient(ellipse_at_70%_60%,rgba(111,224,124,.16),transparent_60%)] rtl:bg-[radial-gradient(ellipse_at_30%_60%,rgba(111,224,124,.16),transparent_60%)]" />
        <div className="relative mx-auto w-full max-w-6xl px-4 pt-10 pb-14 sm:px-6">
          <p className="text-eyebrow font-bold tracking-[0.24em] text-[#5fd06e]">{l.eyebrow}</p>
          <h1 className="mt-2.5 max-w-md text-3xl leading-tight font-medium tracking-tight text-white md:text-4xl">
            {l.titleStart} <span className="text-lime">{l.titleHighlight}</span>
          </h1>
          <p className="mt-3.5 max-w-sm text-label leading-relaxed text-white/85">
            {l.intro}
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-label font-semibold">
            {count(locale, CITIES.length, l.count)}
            <span className="font-normal text-muted-foreground"> · {count(locale, facets.total, t.brands.forSale)}</span>
          </p>
          <SortSelect value={sort} options={l.sort} />
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
