"use server";

import { revalidatePath } from "next/cache";
import { requireSeller } from "@/lib/auth";
import { MAX_IMPORT_BYTES, parseListingCsv, type ImportRowError } from "@/lib/listing-import";
import { isDealerPlan } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";

export type ImportFormState = {
  error?: string;
  rowErrors?: ImportRowError[];
  imported?: number;
};

export async function importListings(
  _prev: ImportFormState,
  formData: FormData,
): Promise<ImportFormState> {
  const { user, profile } = await requireSeller("/dashboard/listings/import");
  if (profile.suspended_at) {
    return { error: "Your account is suspended, so you can't publish listings." };
  }
  if (!isDealerPlan(profile.plan)) return { error: "CSV import is available on dealer plans." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a CSV file." };
  if (!file.name.toLowerCase().endsWith(".csv")) return { error: "The file must be a .csv." };
  if (file.size > MAX_IMPORT_BYTES) {
    return { error: `The file is too large. Keep it under ${MAX_IMPORT_BYTES / 1024} KB.` };
  }

  const parsed = parseListingCsv(await file.text());
  if ("error" in parsed) return { error: parsed.error };
  if ("rowErrors" in parsed) {
    const count = parsed.rowErrors.length;
    return {
      error: `${count} ${count === 1 ? "row needs" : "rows need"} fixing. Nothing was imported.`,
      rowErrors: parsed.rowErrors,
    };
  }

  // Drafts, because a listing needs photos before it can go live. Drafts don't
  // use the monthly quota; each listing is charged when first published.
  const supabase = await createClient();
  const { error } = await supabase
    .from("listings")
    .insert(parsed.rows.map((row) => ({ ...row, seller_id: user.id, status: "draft" as const })));
  if (error) return { error: "Could not import the listings. Nothing was imported. Try again." };

  revalidatePath("/dashboard", "layout");
  return { imported: parsed.rows.length };
}
