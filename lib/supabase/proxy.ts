import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";

// Refreshes the Supabase auth session on every matched request so Server
// Components always see a valid session cookie. requestHeaders replaces the
// incoming headers for the rest of the request (proxy.ts adds the locale).
export async function updateSession(request: NextRequest, requestHeaders: Headers = request.headers) {
  const next = () => NextResponse.next({ request: { headers: requestHeaders } });
  let response = next();

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          // request.cookies writes through to request.headers' cookie line;
          // carry it over so the page sees the refreshed session.
          requestHeaders.set("cookie", request.headers.get("cookie") ?? "");
          response = next();
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) =>
            response.headers.set(key, value),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and getClaims(): it
  // revalidates the token and triggers setAll when it rotates.
  await supabase.auth.getClaims();

  return response;
}
