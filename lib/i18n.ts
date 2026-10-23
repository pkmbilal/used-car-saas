// Locales live in the first URL segment (/ar/listings, /en/listings). Arabic
// is the default. The admin panel and auth routes stay unprefixed and English.
// Safe to import from client components.

export const LOCALES = ["ar", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ar";

// Set by proxy.ts on every localized request: the cookie remembers the
// visitor's choice, the header tells server actions which locale they run in.
export const LOCALE_COOKIE = "NEXT_LOCALE";
export const LOCALE_HEADER = "x-karsouq-locale";

const UNLOCALIZED = ["/admin", "/auth", "/api"];

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function dir(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}

function startsWithSegment(path: string, segment: string): boolean {
  return path === segment || path.startsWith(`${segment}/`) || path.startsWith(`${segment}?`) || path.startsWith(`${segment}#`);
}

// The locale a path already carries, if any.
export function pathLocale(path: string): Locale | null {
  return LOCALES.find((locale) => startsWithSegment(path, `/${locale}`)) ?? null;
}

// Paths that never get a locale prefix: admin, auth routes and static files.
export function isUnlocalizedPath(path: string): boolean {
  if (UNLOCALIZED.some((prefix) => startsWithSegment(path, prefix))) return true;
  const lastSegment = path.split(/[?#]/)[0].split("/").pop() ?? "";
  return lastSegment.includes(".");
}

// "/listings?make=Toyota" -> "/ar/listings?make=Toyota". Leaves external URLs,
// already-localized paths and unlocalized paths alone.
export function localizePath(locale: Locale, path: string): string {
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  if (pathLocale(path) || isUnlocalizedPath(path)) return path;
  if (path === "/") return `/${locale}`;
  if (path.startsWith("/?") || path.startsWith("/#")) return `/${locale}${path.slice(1)}`;
  return `/${locale}${path}`;
}

// "/ar/listings/1" -> "/listings/1": the same page in any locale.
export function stripLocale(path: string): string {
  const locale = pathLocale(path);
  if (!locale) return path;
  const rest = path.slice(locale.length + 1);
  return rest === "" || rest.startsWith("?") || rest.startsWith("#") ? `/${rest}` : rest;
}

// "/ar/listings/1" -> "/en/listings/1".
export function switchLocalePath(path: string, locale: Locale): string {
  return localizePath(locale, stripLocale(path));
}
