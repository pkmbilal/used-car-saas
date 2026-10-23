import "server-only";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DEFAULT_LOCALE, isLocale, LOCALE_HEADER, LOCALES, localizePath, type Locale } from "@/lib/i18n";

// The locale of the current request. Works in Server Components, server
// actions and route handlers alike (next/root-params doesn't reach actions),
// because proxy.ts stamps it on every localized request.
export async function requestLocale(): Promise<Locale> {
  const value = (await headers()).get(LOCALE_HEADER);
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

// redirect() that keeps the visitor in their language.
export async function localeRedirect(path: string): Promise<never> {
  redirect(localizePath(await requestLocale(), path));
}

// revalidatePath() for a page that exists once per locale.
export function revalidateLocalized(path: string, type?: "layout" | "page") {
  for (const locale of LOCALES) revalidatePath(localizePath(locale, path), type);
}

// Metadata alternates for a page: canonical in the current locale, plus its
// hreflang translations.
export async function localeAlternates(path: string) {
  const locale = await requestLocale();
  return {
    canonical: localizePath(locale, path),
    languages: {
      ...Object.fromEntries(LOCALES.map((other) => [other, localizePath(other, path)])),
      "x-default": localizePath(DEFAULT_LOCALE, path),
    },
  };
}
