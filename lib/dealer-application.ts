import "server-only";
import { randomUUID } from "node:crypto";
import { REGISTRATION_NUMBER_MAX, type DealerDoc } from "@/lib/dealer-application-options";
import { presignPut, PRIVATE_BUCKET } from "@/lib/r2";
import { BUSINESS_NAME_MAX, SHOWROOM_ADDRESS_MAX } from "@/lib/storefront-options";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { ID_DOC_TYPES, isIdDocType, MAX_ID_DOC_BYTES } from "@/lib/verification-options";

// Seller side of dealer applications. Documents go browser → private R2 bucket
// via presigned PUTs; the application row (RLS-scoped) only stores their keys.

export type DealerApplication = Database["public"]["Tables"]["dealer_applications"]["Row"];
type DealerApplicationInsert = Database["public"]["Tables"]["dealer_applications"]["Insert"];

export type DealerApplicationInput = Pick<
  DealerApplicationInsert,
  "business_name" | "showroom_address" | "cr_number" | "requested_plan"
>;

// Sign-up only takes the CR document; VAT and Muroor are added later from the
// storefront page (lib/dealer-documents.ts).
export type DealerDocKeys = Partial<Record<DealerDoc, string>>;

export async function getLatestDealerApplication(
  userId: string,
): Promise<DealerApplication | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dealer_applications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export function docKeyPattern(userId: string) {
  return new RegExp(`^dealer-docs/${userId}/[0-9a-f-]{36}\\.(jpg|png|webp|pdf)$`);
}

export async function requestDealerDocUpload(
  userId: string,
  contentType: string,
  size: number,
): Promise<{ url: string; key: string } | { error: string }> {
  if (!isIdDocType(contentType)) return { error: "Use a JPEG, PNG, WebP or PDF file." };
  if (!Number.isInteger(size) || size <= 0 || size > MAX_ID_DOC_BYTES) {
    return { error: "Files must be under 10 MB." };
  }

  const key = `dealer-docs/${userId}/${randomUUID()}.${ID_DOC_TYPES[contentType]}`;
  const url = await presignPut(key, contentType, size, PRIVATE_BUCKET);
  return { url, key };
}

// Registration numbers: keep digits and letters only. null = left blank,
// undefined = invalid.
export function registrationNumber(formData: FormData, name: string): string | null | undefined {
  const value = String(formData.get(name) ?? "").replace(/[\s-]/g, "").toUpperCase();
  if (!value) return null;
  if (value.length > REGISTRATION_NUMBER_MAX || !/^[0-9A-Z]+$/.test(value)) return undefined;
  return value;
}

export function parseDealerApplication(
  formData: FormData,
): { data: DealerApplicationInput } | { error: string } {
  const businessName = String(formData.get("business_name") ?? "").trim();
  const address = String(formData.get("showroom_address") ?? "").trim();

  if (businessName.length < 2 || businessName.length > BUSINESS_NAME_MAX) {
    return { error: `Business name must be 2–${BUSINESS_NAME_MAX} characters.` };
  }
  if (address.length > SHOWROOM_ADDRESS_MAX) {
    return { error: `Showroom address must be at most ${SHOWROOM_ADDRESS_MAX} characters.` };
  }

  // The CR is what an admin verifies, so it's required (the column stays
  // nullable for older applications).
  const cr = registrationNumber(formData, "cr_number");
  if (!cr) return { error: "Enter a valid CR number." };

  // Free launch: everyone applies for Verified Dealer ('dealer').
  return {
    data: {
      business_name: businessName,
      showroom_address: address || null,
      cr_number: cr,
      requested_plan: "dealer",
    },
  };
}

// Returns an error message, or undefined on success.
export async function submitDealerApplication(
  userId: string,
  data: DealerApplicationInput,
  docKeys: DealerDocKeys,
): Promise<string | undefined> {
  // The CR document is optional, but a key given must be one we issued this user.
  const crKey = docKeys.cr ?? null;
  if (crKey !== null && (typeof crKey !== "string" || !docKeyPattern(userId).test(crKey))) {
    return "Invalid upload.";
  }

  // The insert policy rejects buyers, suspended sellers and sellers already on
  // a dealer plan; the partial unique index rejects a second pending one.
  const supabase = await createClient();
  const { error } = await supabase.from("dealer_applications").insert({
    ...data,
    user_id: userId,
    cr_doc_key: crKey,
  });
  if (!error) return undefined;
  return error.code === "23505"
    ? "Your dealer application is already under review."
    : "Could not submit your application. Try again.";
}
