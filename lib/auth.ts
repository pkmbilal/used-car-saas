import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

// Cached per request so the header and the page share one lookup.
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (!profile) return null;

  return { user, profile };
});

export async function requireUser(next?: string, loginPath = "/login") {
  const current = await getCurrentUser();
  if (!current) {
    redirect(next ? `${loginPath}?next=${encodeURIComponent(next)}` : loginPath);
  }
  return current;
}

export async function requireSeller(next = "/dashboard") {
  const current = await requireUser(next);
  if (current.profile.role !== "seller") {
    redirect("/account/become-seller");
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
