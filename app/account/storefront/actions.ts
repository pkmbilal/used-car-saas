"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { IMAGE_TYPES } from "@/lib/listing-options";
import { isDealerPlan } from "@/lib/plans";
import { deleteObjects, presignPut } from "@/lib/r2";
import { logoKeyPattern, parseStorefront } from "@/lib/storefront";
import { MAX_LOGO_BYTES } from "@/lib/storefront-options";
import { createClient } from "@/lib/supabase/server";

export type StorefrontFormState = {
  error?: string;
  saved?: boolean;
};

export type ActionResult = { error?: string };

const NOT_DEALER_ERROR = "Storefronts are part of the Dealer plans.";

async function requireDealer() {
  const current = await getCurrentUser();
  if (!current) redirect("/login?next=/account/storefront");
  if (current.profile.role !== "seller" || !isDealerPlan(current.profile.plan)) return null;
  return current;
}

function revalidateStorefront(userId: string) {
  revalidatePath("/account/storefront");
  revalidatePath(`/sellers/${userId}`);
}

export async function updateStorefront(
  _prev: StorefrontFormState,
  formData: FormData,
): Promise<StorefrontFormState> {
  const current = await requireDealer();
  if (!current) return { error: NOT_DEALER_ERROR };

  const parsed = parseStorefront(formData);
  if ("error" in parsed) return { error: parsed.error };

  // RLS-scoped client: the column grant covers the storefront fields.
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update(parsed.data)
    .eq("id", current.user.id);
  if (error) return { error: "Could not save your storefront. Try again." };

  revalidateStorefront(current.user.id);
  return { saved: true };
}

// ---------------------------------------------------------------------------
// Logo: browser asks for a presigned URL, PUTs straight to R2, then confirms.
// ---------------------------------------------------------------------------

export async function requestLogoUpload(
  contentType: string,
  size: number,
): Promise<{ url: string; key: string } | { error: string }> {
  const current = await requireDealer();
  if (!current) return { error: NOT_DEALER_ERROR };

  if (!(contentType in IMAGE_TYPES)) return { error: "Use a JPEG, PNG or WebP image." };
  if (!Number.isInteger(size) || size <= 0 || size > MAX_LOGO_BYTES) {
    return { error: "Logos must be under 2 MB." };
  }

  const ext = IMAGE_TYPES[contentType as keyof typeof IMAGE_TYPES];
  const key = `logos/${current.user.id}/${randomUUID()}.${ext}`;
  const url = await presignPut(key, contentType, size);
  return { url, key };
}

export async function confirmLogoUpload(key: string): Promise<ActionResult> {
  const current = await requireDealer();
  if (!current) return { error: NOT_DEALER_ERROR };

  // Only accept keys the presign step could have issued for this user.
  if (!logoKeyPattern(current.user.id).test(key)) return { error: "Invalid upload." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ logo_key: key })
    .eq("id", current.user.id);
  if (error) return { error: "Could not save the logo. Try again." };

  await removeOldLogo(current.profile.logo_key);
  revalidateStorefront(current.user.id);
  return {};
}

export async function removeLogo(): Promise<ActionResult> {
  const current = await requireDealer();
  if (!current) return { error: NOT_DEALER_ERROR };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ logo_key: null })
    .eq("id", current.user.id);
  if (error) return { error: "Could not remove the logo. Try again." };

  await removeOldLogo(current.profile.logo_key);
  revalidateStorefront(current.user.id);
  return {};
}

// Best effort: the profile no longer points at it, so a failed delete only
// leaves an orphaned object behind.
async function removeOldLogo(key: string | null) {
  if (!key) return;
  await deleteObjects([key]).catch(() => {});
}
