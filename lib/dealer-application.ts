import "server-only";
import { randomUUID } from "node:crypto";
import {
  DEALER_DOC_TYPES,
  isDealerPlanChoice,
  REGISTRATION_NUMBER_MAX,
  type DealerDoc,
} from "@/lib/dealer-application-options";
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
  "business_name" | "showroom_address" | "cr_number" | "vat_number" | "muroor_number" | "requested_plan"
>;

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

function docKeyPattern(userId: string) {
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

// Registration numbers are optional; keep digits and letters only.
function registrationNumber(formData: FormData, name: string): string | null | undefined {
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
  const plan = formData.get("requested_plan");

  if (businessName.length < 2 || businessName.length > BUSINESS_NAME_MAX) {
    return { error: `Business name must be 2–${BUSINESS_NAME_MAX} characters.` };
  }
  if (address.length > SHOWROOM_ADDRESS_MAX) {
    return { error: `Showroom address must be at most ${SHOWROOM_ADDRESS_MAX} characters.` };
  }

  const cr = registrationNumber(formData, "cr_number");
  if (cr === undefined) return { error: "Enter a valid CR number." };
  const vat = registrationNumber(formData, "vat_number");
  if (vat === undefined) return { error: "Enter a valid VAT number." };
  const muroor = registrationNumber(formData, "muroor_number");
  if (muroor === undefined) return { error: "Enter a valid Muroor certificate number." };

  if (!isDealerPlanChoice(plan)) return { error: "Choose a dealer plan." };

  return {
    data: {
      business_name: businessName,
      showroom_address: address || null,
      cr_number: cr,
      vat_number: vat,
      muroor_number: muroor,
      requested_plan: plan,
    },
  };
}

// Returns an error message, or undefined on success.
export async function submitDealerApplication(
  userId: string,
  data: DealerApplicationInput,
  docKeys: DealerDocKeys,
): Promise<string | undefined> {
  // Documents are optional, but any key given must be one we issued this user.
  const pattern = docKeyPattern(userId);
  const keys: Record<DealerDoc, string | null> = { cr: null, vat: null, muroor: null };
  for (const doc of DEALER_DOC_TYPES) {
    const key = docKeys[doc];
    if (key === undefined || key === null) continue;
    if (typeof key !== "string" || !pattern.test(key)) return "Invalid upload.";
    keys[doc] = key;
  }

  // The insert policy rejects buyers, suspended sellers and sellers already on
  // a dealer plan; the partial unique index rejects a second pending one.
  const supabase = await createClient();
  const { error } = await supabase.from("dealer_applications").insert({
    ...data,
    user_id: userId,
    cr_doc_key: keys.cr,
    vat_doc_key: keys.vat,
    muroor_doc_key: keys.muroor,
  });
  if (!error) return undefined;
  return error.code === "23505"
    ? "Your dealer application is already under review."
    : "Could not submit your application. Try again.";
}
