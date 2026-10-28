import type { MetadataRoute } from "next";
import { LOCALES } from "@/lib/i18n";
import { siteUrl } from "@/lib/site";

const PRIVATE = ["/dashboard", "/account", "/favorites", "/offers", "/saved-searches"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/auth", ...LOCALES.flatMap((locale) => PRIVATE.map((path) => `/${locale}${path}`))],
    },
    sitemap: new URL("/sitemap.xml", siteUrl()).toString(),
  };
}
