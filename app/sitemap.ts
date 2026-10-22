import type { MetadataRoute } from "next";
import { CITIES, cityHref } from "@/lib/cities";
import { getSitemapListings } from "@/lib/listings";
import { siteUrl } from "@/lib/site";
import { getDealerStorefronts } from "@/lib/storefront";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const url = (path: string) => new URL(path, base).toString();
  const [listings, dealers] = await Promise.all([getSitemapListings(), getDealerStorefronts()]);

  return [
    { url: url("/"), changeFrequency: "daily", priority: 1 },
    { url: url("/listings"), changeFrequency: "hourly", priority: 0.9 },
    { url: url("/locations"), changeFrequency: "weekly", priority: 0.6 },
    { url: url("/brands"), changeFrequency: "weekly", priority: 0.6 },
    { url: url("/dealers"), changeFrequency: "weekly", priority: 0.6 },
    { url: url("/pricing"), changeFrequency: "monthly", priority: 0.4 },
    { url: url("/privacy"), changeFrequency: "yearly", priority: 0.1 },
    { url: url("/terms"), changeFrequency: "yearly", priority: 0.1 },
    ...CITIES.map((city) => ({ url: url(cityHref(city)), changeFrequency: "daily" as const, priority: 0.7 })),
    ...dealers.map((dealer) => ({ url: url(`/sellers/${dealer.id}`), changeFrequency: "weekly" as const, priority: 0.5 })),
    ...listings.map((listing) => ({
      url: url(`/listings/${listing.id}`),
      lastModified: listing.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
