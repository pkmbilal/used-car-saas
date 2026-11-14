import "server-only";
import { docKeyPattern, registrationNumber } from "@/lib/dealer-application";
import { deleteObjects, PRIVATE_BUCKET } from "@/lib/r2";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

// A dealer's VAT and Muroor details, added from the storefront page after
// approval. Documents go browser → private R2 bucket (same dealer-docs/ folder
// as the application's CR); the row (RLS-scoped) only stores their keys.

export type DealerDocuments = Database["public"]["Tables"]["dealer_documents"]["Row"];

export const BUSINESS_DOCS = ["vat", "muroor"] as const;
export type BusinessDoc = (typeof BUSINESS_DOCS)[number];
export type BusinessDocKeys = Partial<Record<BusinessDoc, string>>;

type BusinessNumbers = Pick<DealerDocuments, "vat_number" | "muroor_number">;

export async function getDealerDocuments(userId: string): Promise<DealerDocuments | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dealer_documents")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export function parseDealerDocuments(formData: FormData): { data: BusinessNumbers } | { error: string } {
  const vat = registrationNumber(formData, "vat_number");
  if (vat === undefined) return { error: "Enter a valid VAT number." };
  const muroor = registrationNumber(formData, "muroor_number");
  if (muroor === undefined) return { error: "Enter a valid Muroor certificate number." };
  return { data: { vat_number: vat, muroor_number: muroor } };
}

// Returns an error message, or undefined on success. A doc left out of `keys`
// keeps its current file; a new one replaces it.
export async function saveDealerDocuments(
  userId: string,
  data: BusinessNumbers,
  keys: BusinessDocKeys,
): Promise<string | undefined> {
  const pattern = docKeyPattern(userId);
  for (const doc of BUSINESS_DOCS) {
    const key = keys[doc];
    if (key !== undefined && (typeof key !== "string" || !pattern.test(key))) return "Invalid upload.";
  }

  const current = await getDealerDocuments(userId);
  const supabase = await createClient();
  const { error } = await supabase.from("dealer_documents").upsert({
    user_id: userId,
    ...data,
    vat_doc_key: keys.vat ?? current?.vat_doc_key ?? null,
    muroor_doc_key: keys.muroor ?? current?.muroor_doc_key ?? null,
    updated_at: new Date().toISOString(),
  });
  if (error) return "Could not save your business documents. Try again.";

  // Best effort: the row no longer points at replaced files.
  const replaced = [
    keys.vat && current?.vat_doc_key,
    keys.muroor && current?.muroor_doc_key,
  ].filter((key): key is string => typeof key === "string" && pattern.test(key));
  await deleteObjects(replaced, PRIVATE_BUCKET).catch(() => {});
  return undefined;
}
