"use client";

import NextLink from "next/link";
import { useParams } from "next/navigation";
import type { ComponentProps } from "react";
import { DEFAULT_LOCALE, isLocale, localizePath, type Locale } from "@/lib/i18n";

// The locale of the page being viewed, for client components.
export function useLocale(): Locale {
  const { lang } = useParams<{ lang?: string }>();
  return isLocale(lang) ? lang : DEFAULT_LOCALE;
}

// next/link that keeps internal links in the current language: "/listings"
// becomes "/ar/listings" on Arabic pages. Drop-in replacement for next/link.
export default function Link({ href, ...props }: ComponentProps<typeof NextLink>) {
  const locale = useLocale();
  const localized =
    typeof href === "string"
      ? localizePath(locale, href)
      : { ...href, pathname: href.pathname ? localizePath(locale, href.pathname) : href.pathname };
  return <NextLink href={localized} {...props} />;
}
