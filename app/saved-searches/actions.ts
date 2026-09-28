"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { parseListingFilters } from "@/lib/listings";
import {
  createSavedSearch,
  deleteSavedSearch,
  hasActiveFilters,
  markSavedSearchSeen,
  MAX_SAVED_SEARCH_NAME,
} from "@/lib/saved-searches";

// "signin" tells the client to send the visitor to the login page.
export type SaveSearchState = { error?: "signin" | string; saved?: boolean };

// The form posts the current /listings params as hidden fields; they are
// re-validated here exactly like URL params.
export async function saveSearchAction(
  _prev: SaveSearchState,
  formData: FormData,
): Promise<SaveSearchState> {
  const current = await getCurrentUser();
  if (!current) return { error: "signin" };

  const params: Record<string, string> = {};
  for (const [key, value] of formData) {
    if (typeof value === "string") params[key] = value;
  }
  const filters = parseListingFilters(params);
  if (!hasActiveFilters(filters)) return { error: "Pick at least one filter to save." };

  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 1 || name.length > MAX_SAVED_SEARCH_NAME) {
    return { error: `Give the search a name (up to ${MAX_SAVED_SEARCH_NAME} characters).` };
  }

  const result = await createSavedSearch(current.user.id, name, filters);
  if (result.error) return { error: result.error };

  revalidatePath("/saved-searches");
  return { saved: true };
}

export async function openSavedSearchAction(id: string): Promise<void> {
  const { user } = await requireUser("/saved-searches");
  const href = await markSavedSearchSeen(user.id, id);
  revalidatePath("/saved-searches");
  redirect(href ?? "/saved-searches");
}

export async function deleteSavedSearchAction(id: string): Promise<void> {
  const { user } = await requireUser("/saved-searches");
  await deleteSavedSearch(user.id, id);
  revalidatePath("/saved-searches");
}
