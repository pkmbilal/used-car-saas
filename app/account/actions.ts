"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { isCity } from "@/lib/cities";
import {
  parseDealerApplication,
  requestDealerDocUpload,
  submitDealerApplication,
  type DealerDocKeys,
} from "@/lib/dealer-application";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
  if (!current) redirect("/login?next=/account");

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
  if (!current) redirect("/login?next=/account/become-seller");

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
  redirect("/dashboard");
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
  if (!current) redirect("/login?next=/account/dealer-application");
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

  redirect("/account/dealer-application");
}
