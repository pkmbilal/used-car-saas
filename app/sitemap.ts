import type { MetadataRoute } from "next";
import { CITIES, cityHref } from "@/lib/cities";
import { DEFAULT_LOCALE, LOCALES, localizePath } from "@/lib/i18n";
import { getSitemapListings } from "@/lib/listings";
import { MAKES, makeHref } from "@/lib/makes";
import { siteUrl } from "@/lib/site";
import { getDealerStorefronts } from "@/lib/storefront";

type Entry = Omit<MetadataRoute.Sitemap[number], "url" | "alternates"> & { path: string };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const url = (path: string) => new URL(path, base).toString();
  const [listings, dealers] = await Promise.all([getSitemapListings(), getDealerStorefronts()]);
  // Empty city pages are thin content; only list cities with active listings.
  const listedCities = new Set(listings.map((listing) => listing.city));
  const listedMakes = new Set(listings.map((listing) => listing.make));

  const entries: Entry[] = [
    { path: "/", changeFrequency: "daily", priority: 1 },
    { path: "/listings", changeFrequency: "hourly", priority: 0.9 },
    { path: "/locations", changeFrequency: "weekly", priority: 0.6 },
    { path: "/brands", changeFrequency: "weekly", priority: 0.6 },
    { path: "/dealers", changeFrequency: "weekly", priority: 0.6 },
    { path: "/pricing", changeFrequency: "monthly", priority: 0.4 },
    { path: "/contact", changeFrequency: "yearly", priority: 0.2 },
    { path: "/privacy", changeFrequency: "yearly", priority: 0.1 },
    { path: "/terms", changeFrequency: "yearly", priority: 0.1 },
    ...CITIES.filter((city) => listedCities.has(city)).map((city) => ({ path: cityHref(city), changeFrequency: "daily" as const, priority: 0.7 })),
    ...MAKES.filter((make) => make !== "Other" && listedMakes.has(make)).map((make) => ({
      path: makeHref(make),
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...dealers.map((dealer) => ({ path: `/sellers/${dealer.id}`, changeFrequency: "weekly" as const, priority: 0.5 })),
    ...listings.map((listing) => ({
      path: `/listings/${listing.id}`,
      lastModified: listing.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];

  // Every page once per locale, each pointing at all its translations.
  return entries.flatMap(({ path, ...entry }) => {
    const languages = Object.fromEntries([
      ...LOCALES.map((locale) => [locale, url(localizePath(locale, path))]),
      ["x-default", url(localizePath(DEFAULT_LOCALE, path))],
    ]);
    return LOCALES.map((locale) => ({ ...entry, url: url(localizePath(locale, path)), alternates: { languages } }));
  });
}
