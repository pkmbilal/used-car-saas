import "server-only";
import type { Metadata } from "next";
import { fmt } from "@/lib/dictionary";
import { localizePath, type Locale } from "@/lib/i18n";
import { getDictionary, localeAlternates } from "@/lib/i18n-server";
import { siteUrl } from "@/lib/site";

// Private pages (auth, account, dashboard): kept out of search results, but
// their links still count.
export const noIndex: Metadata["robots"] = { index: false, follow: true };

// Title, description, canonical + hreflang and share tags for a public page.
// Without images, the share card is app/[lang]/opengraph-image. Past page 1
// of a list, the page number goes in the title and canonical URL, so each
// page is its own search result rather than a duplicate of page 1.
export async function pageMetadata({
  title,
  description,
  path,
  page,
  images,
}: {
  title: string;
  description?: string;
  path: string;
  page?: unknown;
  images?: string[];
}): Promise<Metadata> {
  const { t, locale } = await getDictionary();
  const n = Number(page);
  if (Number.isInteger(n) && n > 1) {
    // "Used Toyota cars | KarSouq" -> "Used Toyota cars – Page 2 | KarSouq"
    title = title.replace(/( \| [^|]*)?$/, (suffix) => ` – ${fmt(t.common.page, { page: n })}${suffix}`);
    path = `${path}?page=${n}`;
  }
  // A page's own openGraph replaces the layout's, file-based image included,
  // so the default card has to be named here.
  images ??= [localizePath(locale, "/opengraph-image")];
  return {
    title,
    description,
    alternates: await localeAlternates(path),
    openGraph: {
      type: "website",
      siteName: t.common.siteName,
      locale: locale === "ar" ? "ar_SA" : "en_US",
      title,
      description,
      url: localizePath(locale, path),
      images,
    },
    twitter: { card: "summary_large_image", title, description, images },
  };
}

// Absolute URL of a page in the given locale, for structured data.
export function absoluteUrl(locale: Locale, path: string): string {
  return new URL(localizePath(locale, path), siteUrl()).toString();
}

// schema.org Organization + WebSite for the home page, so search results
// show the site name and logo.
export function siteJsonLd(name: string, locale: Locale) {
  const url = absoluteUrl(locale, "/");
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name,
      url,
      logo: new URL("/logo.png", siteUrl()).toString(),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name,
      url,
      inLanguage: locale,
    },
  ];
}

// schema.org BreadcrumbList for a page's trail; urls are absolute.
export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// JSON for an inline <script type="application/ld+json">; escapes "<" so
// user text can't close the script tag.
export function jsonLdScript(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
