import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { localeRedirect } from "@/lib/i18n-server";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

// Cached per request so the header and the page share one lookup. getClaims()
// verifies the JWT locally (with asymmetric signing keys) instead of calling
// the Auth server like getUser(); proxy.ts keeps the session fresh. Suspension
// lives on the profile, so the profile lookup still gates access.
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;

  // phone isn't publicly readable; this RPC returns the caller's full row.
  const { data: profile } = await supabase.rpc("get_own_profile").maybeSingle();
  if (!profile) return null;

  return { user: { id: claims.sub, email: claims.email ?? null }, profile };
});

export async function requireUser(next?: string, loginPath = "/login") {
  const current = await getCurrentUser();
  if (!current) {
    return localeRedirect(next ? `${loginPath}?next=${encodeURIComponent(next)}` : loginPath);
  }
  return current;
}

export async function requireSeller(next = "/dashboard") {
  const current = await requireUser(next);
  if (current.profile.role !== "seller") {
    return localeRedirect("/account/become-seller");
  }
  return current;
}

// Signed-out visitors go to the admin sign-in; signed-in non-admins get a 404.
export async function requireAdmin() {
  const current = await requireUser("/admin", "/admin/login");
  if (!current.profile.is_admin) notFound();
  return current;
}

// Only allow same-site relative paths as post-login redirects.
export function safeNext(next: unknown): string {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//")
    ? next
    : "/";
}
