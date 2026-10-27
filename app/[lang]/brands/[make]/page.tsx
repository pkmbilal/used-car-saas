import type { Metadata } from "next";
import Link from "@/components/locale-link";
import { notFound } from "next/navigation";
import { ArrowRight, ChevronRight } from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { ListingGrid } from "@/components/listing-card";
import { Pagination } from "@/components/pagination";
import { makeName } from "@/lib/car-names";
import { count, fmt } from "@/lib/dictionary";
import { getViewerFavoriteIds } from "@/lib/favorites";
import { getDictionary } from "@/lib/i18n-server";
import { getActiveFacetCounts, PAGE_SIZE, parseListingFilters, searchListings } from "@/lib/listings";
import { makeFromSlug, makeHref, MAKES } from "@/lib/makes";
import { absoluteUrl, breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { SortSelect } from "../../listings/sort-select";
import { BrandCard } from "../../brand-card";

export async function generateMetadata({ params, searchParams }: PageProps<"/[lang]/brands/[make]">): Promise<Metadata> {
  const make = makeFromSlug((await params).make);
  const { t, locale } = await getDictionary();
  if (!make) return { title: t.brands.makeNotFound };
  const name = makeName(locale, make);
  return pageMetadata({
    title: fmt(t.brands.makeMetaTitle, { make: name }),
    description: fmt(t.brands.makeMetaDescription, { make: name }),
    path: makeHref(make),
    page: (await searchParams).page,
  });
}

export default async function BrandPage({ params, searchParams }: PageProps<"/[lang]/brands/[make]">) {
  const make = makeFromSlug((await params).make);
  if (!make) notFound();
  const { t, locale } = await getDictionary();
  const b = t.brands;
  const name = makeName(locale, make);

  const query = await searchParams;
  // Only sort and page apply here; the full filter set lives on /listings.
  const filters = parseListingFilters({ sort: query.sort, page: query.page, make });
  const [{ listings, total }, facets, favoriteIds] = await Promise.all([
    searchListings(filters),
    getActiveFacetCounts(),
    getViewerFavoriteIds(),
  ]);
  const otherBrands = MAKES.filter((other) => other !== make && other !== "Other")
    .sort((x, y) => (facets.makes.get(y) ?? 0) - (facets.makes.get(x) ?? 0))
    .slice(0, 6);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const basePath = makeHref(make);

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
      <JsonLd
        data={breadcrumbJsonLd([
          { name: t.common.home, url: absoluteUrl(locale, "/") },
          { name: b.brands, url: absoluteUrl(locale, "/brands") },
          { name, url: absoluteUrl(locale, basePath) },
        ])}
      />
      <section className="relative overflow-hidden bg-charcoal">
        <div className="absolute inset-y-0 end-0 w-2/3 bg-[radial-gradient(ellipse_at_70%_60%,rgba(111,224,124,.16),transparent_60%)] rtl:bg-[radial-gradient(ellipse_at_30%_60%,rgba(111,224,124,.16),transparent_60%)]" />
        <div className="relative mx-auto w-full max-w-6xl px-4 pt-10 pb-14 sm:px-6">
          <nav aria-label={t.locations.breadcrumb} className="flex items-center gap-1.5 text-caption text-white/60">
            <Link href="/brands" className="text-white/60 hover:text-lime">
              {b.brands}
            </Link>
            <ChevronRight className="size-3 rtl:rotate-180" />
            <span className="text-white">{name}</span>
          </nav>
          <h1 className="mt-3 max-w-md text-3xl leading-tight font-medium tracking-tight text-white md:text-4xl">
            {b.makeTitleStart} <span className="text-lime">{name}</span> {b.makeTitleEnd}
          </h1>
          <p className="mt-3.5 text-label text-white/85">{count(locale, total, b.forSale)}</p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/listings?make=${encodeURIComponent(make)}`}
            className="flex items-center gap-2 text-caption font-semibold text-brand"
          >
            {b.refine}
            <ArrowRight className="size-3 rtl:rotate-180" strokeWidth={2.4} />
          </Link>
          <SortSelect value={filters.sort} />
        </div>
        <div className="mt-4">
          <ListingGrid
            listings={listings}
            columns={3}
            favoriteIds={favoriteIds}
            empty={fmt(b.noCars, { make: name })}
          />
        </div>
        <Pagination page={filters.page} pageCount={pageCount} hrefFor={pageHref} />
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-caption font-bold tracking-[0.2em] text-brand-600">{b.moreEyebrow}</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">{b.otherBrands}</h2>
          </div>
          <Link href="/brands" className="mb-1 flex shrink-0 items-center gap-2 text-caption font-semibold text-brand">
            {b.allBrands}
            <ArrowRight className="size-3 rtl:rotate-180" strokeWidth={2.4} />
          </Link>
        </div>
        <ul className="mt-6 grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
          {otherBrands.map((other) => (
            <li key={other}>
              <BrandCard make={other} count={facets.makes.get(other) ?? 0} />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
