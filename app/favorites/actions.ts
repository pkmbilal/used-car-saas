"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// "signin" tells the client to send the visitor to the login page.
export type FavoriteResult = { error?: "signin" | string };

export async function toggleFavorite(
  listingId: string,
  favorite: boolean,
): Promise<FavoriteResult> {
  const current = await getCurrentUser();
  if (!current) return { error: "signin" };

  const supabase = await createClient();
  const { error } = favorite
    ? await supabase
        .from("favorites")
        .upsert(
          { user_id: current.user.id, listing_id: listingId },
          { onConflict: "user_id,listing_id", ignoreDuplicates: true },
        )
    : await supabase
        .from("favorites")
        .delete()
        .eq("user_id", current.user.id)
        .eq("listing_id", listingId);
  if (error) return { error: "Could not update saved cars. Try again." };

  revalidatePath("/favorites");
  return {};
}
