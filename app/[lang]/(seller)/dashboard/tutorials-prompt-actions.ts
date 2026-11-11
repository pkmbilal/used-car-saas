"use server";

import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// Records that the seller dismissed the Seller Center tutorials popup.
// Best effort: if it fails, the popup just shows again next visit.
export async function markTutorialsPromptSeen(): Promise<void> {
  const current = await getCurrentUser();
  if (!current || current.profile.tutorials_prompt_seen_at) return;

  // No `.is("tutorials_prompt_seen_at", null)` filter: authenticated has UPDATE
  // but not SELECT on that column, and filtering on it fails with
  // "permission denied". The early return above already guards overwrites.
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ tutorials_prompt_seen_at: new Date().toISOString() })
    .eq("id", current.user.id);
  if (error) console.error("markTutorialsPromptSeen failed:", error.message);
}
