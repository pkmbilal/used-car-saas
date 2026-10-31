import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { isLocale, localizePath } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n-server";
import { parseListingFilters } from "@/lib/listings";
import { hasActiveFilters } from "@/lib/saved-searches";
import { pageMetadata } from "@/lib/seo";
import { Browse, BrowseHero } from "./browse";

type Params = Record<string, string | string[] | undefined>;

// Cars for sale only; rentals have their own section at /rentals.
function saleFilters(params: Params) {
  return parseListingFilters({ ...params, type: undefined, category: undefined });
}

export async function generateMetadata({ searchParams }: PageProps<"/[lang]/listings">): Promise<Metadata> {
  const { t } = await getDictionary();
  const filters = saleFilters(await searchParams);
  return pageMetadata({
    title: t.listings.metaTitle,
    description: t.listings.metaDescription,
    path: "/listings",
    // Filtered results all canonicalize to the plain list; only its pages stand alone.
    page: hasActiveFilters(filters) ? 1 : filters.page,
  });
}

export default async function ListingsPage({ params, searchParams }: PageProps<"/[lang]/listings">) {
  const query = await searchParams;
  // Old rental links (/listings?type=rent&…) moved to /rentals.
  if (query.type === "rent") {
    const { lang } = await params;
    const rest = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (typeof value === "string" && value !== "" && key !== "type") rest.set(key, value);
    }
    const search = rest.toString();
    permanentRedirect(localizePath(isLocale(lang) ? lang : "ar", search ? `/rentals?${search}` : "/rentals"));
  }

  const { t } = await getDictionary();
  const filters = saleFilters(query);

  return (
    <Browse
      filters={filters}
      params={query}
      hero={
        <BrowseHero>
          <p className="text-eyebrow font-bold tracking-[0.24em] text-[#5fd06e]">{t.listings.eyebrow}</p>
          <h1 className="mt-2.5 max-w-md text-3xl leading-tight font-medium tracking-tight text-white md:text-4xl">
            {t.listings.titleStart} <span className="text-lime">{t.listings.titleHighlight}</span> {t.listings.titleEnd}
          </h1>
          <p className="mt-3.5 max-w-sm text-label leading-relaxed text-white/85">{t.listings.intro}</p>
        </BrowseHero>
      }
    />
  );
}
