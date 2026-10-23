import { NextResponse, type NextRequest } from "next/server";
import {
  DEFAULT_LOCALE,
  isLocale,
  isUnlocalizedPath,
  LOCALE_COOKIE,
  LOCALE_HEADER,
  localizePath,
  pathLocale,
  type Locale,
} from "@/lib/i18n";
import { updateSession } from "@/lib/supabase/proxy";

const ONE_YEAR = 60 * 60 * 24 * 365;

// A remembered choice wins; otherwise English browsers get English and
// everyone else Arabic.
function preferredLocale(request: NextRequest): Locale {
  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(saved)) return saved;
  const accept = request.headers.get("accept-language")?.trim().toLowerCase() ?? "";
  return accept.startsWith("en") ? "en" : DEFAULT_LOCALE;
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const locale = pathLocale(pathname);

  if (!locale && !isUnlocalizedPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = localizePath(preferredLocale(request), pathname);
    url.search = search;
    return NextResponse.redirect(url);
  }

  // Never trust a locale header sent by the browser.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete(LOCALE_HEADER);
  if (locale) requestHeaders.set(LOCALE_HEADER, locale);

  const response = await updateSession(request, requestHeaders);
  if (locale && request.cookies.get(LOCALE_COOKIE)?.value !== locale) {
    response.cookies.set(LOCALE_COOKIE, locale, { path: "/", maxAge: ONE_YEAR, sameSite: "lax" });
  }
  return response;
}

export const config = {
  matcher: [
    // Skip static assets and image optimization.
    "/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|avif)$).*)",
  ],
};
