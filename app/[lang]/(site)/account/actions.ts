"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { avatarKeyPattern, MAX_AVATAR_BYTES } from "@/lib/avatar";
import { isCity } from "@/lib/cities";
import { IMAGE_TYPES } from "@/lib/listing-options";
import { deleteObjects, presignPut } from "@/lib/r2";
import {
  parseDealerApplication,
  requestDealerDocUpload,
  submitDealerApplication,
  type DealerDocKeys,
} from "@/lib/dealer-application";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { localeRedirect } from "@/lib/i18n-server";

export type ProfileFormState = {
  error?: string;
  saved?: boolean;
};

// Accepts 05XXXXXXXX, 5XXXXXXXX, 9665XXXXXXXX or +9665XXXXXXXX (spaces/dashes
// allowed) and normalises to +9665XXXXXXXX. Returns null if invalid.
function normalizeSaudiMobile(input: string): string | null {
  const digits = input.replace(/[\s-]/g, "").replace(/^\+/, "");
  const match = digits.match(/^(?:966|0)?(5\d{8})$/);
  return match ? `+966${match[1]}` : null;
}

function parseProfile(formData: FormData) {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const phoneRaw = String(formData.get("phone") ?? "").trim();
  const city = formData.get("city");

  if (fullName.length < 2) return { error: "Enter your full name." } as const;
  const phone = normalizeSaudiMobile(phoneRaw);
  if (!phone) return { error: "Enter a Saudi mobile number, e.g. 05XXXXXXXX." } as const;
  if (!isCity(city)) return { error: "Choose your city." } as const;

  return { data: { full_name: fullName, phone, city } } as const;
}

export async function updateProfile(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const current = await getCurrentUser();
  if (!current) return localeRedirect("/login?next=/account");

  const parsed = parseProfile(formData);
  if ("error" in parsed) return { error: parsed.error };

  // RLS-scoped client: the column grant only allows full_name, phone, city.
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update(parsed.data)
    .eq("id", current.user.id);
  if (error) return { error: "Could not save your profile. Try again." };

  revalidatePath("/", "layout");
  return { saved: true };
}

export async function becomeSeller(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const current = await getCurrentUser();
  if (!current) return localeRedirect("/login?next=/account/become-seller");

  const parsed = parseProfile(formData);
  if ("error" in parsed) return { error: parsed.error };

  // Users can't change their own role under RLS, so the role flip goes
  // through the service-role client — scoped to the signed-in user's id.
  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ ...parsed.data, role: "seller" })
    .eq("id", current.user.id);
  if (error) return { error: "Could not upgrade your account. Try again." };

  revalidatePath("/", "layout");
  return localeRedirect("/dashboard");
}

// ---------------------------------------------------------------------------
// Dealer applications: the browser asks for presigned URLs, PUTs documents
// straight to the private bucket, then submits the form with their keys.
// ---------------------------------------------------------------------------

export async function requestDealerDocUploadAction(contentType: string, size: number) {
  const current = await getCurrentUser();
  if (!current) return { error: "Sign in again to upload documents." };
  if (current.profile.plan !== "free") return { error: "You're already on a dealer plan." };
  return requestDealerDocUpload(current.user.id, contentType, size);
}

// Works for new sellers (from /account/become-seller) and existing ones: it
// saves the contact details, makes the user a seller, then files the application.
export async function submitDealerApplicationAction(
  formData: FormData,
  docKeys: DealerDocKeys,
): Promise<ProfileFormState> {
  const current = await getCurrentUser();
  if (!current) return localeRedirect("/login?next=/account/dealer-application");
  if (current.profile.suspended_at) return { error: "Your account is suspended." };
  if (current.profile.plan !== "free") return { error: "You're already on a dealer plan." };

  const profile = parseProfile(formData);
  if ("error" in profile) return { error: profile.error };
  const application = parseDealerApplication(formData);
  if ("error" in application) return { error: application.error };

  // Same role flip as becomeSeller: users can't change their own role under RLS.
  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ ...profile.data, role: "seller" })
    .eq("id", current.user.id);
  if (error) return { error: "Could not save your details. Try again." };

  const submitError = await submitDealerApplication(current.user.id, application.data, docKeys);
  revalidatePath("/", "layout");
  if (submitError) return { error: submitError };

  return localeRedirect("/account/dealer-application");
}

// ---------------------------------------------------------------------------
// Profile photo: browser asks for a presigned URL, PUTs straight to R2, then
// confirms.
// ---------------------------------------------------------------------------

export type AvatarActionResult = { error?: string };

export async function requestAvatarUpload(
  contentType: string,
  size: number,
): Promise<{ url: string; key: string } | { error: string }> {
  const current = await getCurrentUser();
  if (!current) return { error: "Upload failed." };

  if (!(contentType in IMAGE_TYPES)) return { error: "Use a JPEG, PNG or WebP image." };
  if (!Number.isInteger(size) || size <= 0 || size > MAX_AVATAR_BYTES) {
    return { error: "Profile photos must be under 2 MB." };
  }

  const ext = IMAGE_TYPES[contentType as keyof typeof IMAGE_TYPES];
  const key = `avatars/${current.user.id}/${randomUUID()}.${ext}`;
  const url = await presignPut(key, contentType, size);
  return { url, key };
}

export async function confirmAvatarUpload(key: string): Promise<AvatarActionResult> {
  const current = await getCurrentUser();
  if (!current) return { error: "Upload failed." };

  // Only accept keys the presign step could have issued for this user.
  if (!avatarKeyPattern(current.user.id).test(key)) return { error: "Invalid upload." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_key: key })
    .eq("id", current.user.id);
  if (error) return { error: "Could not save the photo. Try again." };

  await removeOldAvatar(current.profile.avatar_key);
  revalidatePath("/", "layout");
  return {};
}

export async function removeAvatar(): Promise<AvatarActionResult> {
  const current = await getCurrentUser();
  if (!current) return { error: "Could not remove the photo. Try again." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_key: null })
    .eq("id", current.user.id);
  if (error) return { error: "Could not remove the photo. Try again." };

  await removeOldAvatar(current.profile.avatar_key);
  revalidatePath("/", "layout");
  return {};
}

// Best effort: the profile no longer points at it, so a failed delete only
// leaves an orphaned object behind.
async function removeOldAvatar(key: string | null) {
  if (!key) return;
  await deleteObjects([key]).catch(() => {});
}
