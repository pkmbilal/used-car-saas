"use server";

import { revalidatePath } from "next/cache";
import { requireSeller } from "@/lib/auth";
import { MAX_IMPORT_BYTES, parseListingCsv, type ImportRowError } from "@/lib/listing-import";
import {
  getListingQuota,
  isDealerPlan,
  PLAN_LABELS,
  QUOTA_EXCEEDED_DB_MESSAGE,
  quotaExceededMessage,
} from "@/lib/plans";
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

  // Friendly early check; the database trigger is what actually enforces it.
  const quota = await getListingQuota();
  if (quota?.remaining === 0) return { error: quotaExceededMessage(quota) };
  if (quota?.remaining != null && parsed.rows.length > quota.remaining) {
    return {
      error: `The file has ${parsed.rows.length} listings, but you have ${quota.remaining} left this month on the ${PLAN_LABELS[quota.plan]} plan. Nothing was imported.`,
    };
  }

  // One statement, so the quota trigger failing on any row rolls back all of
  // them. Drafts, because a listing needs photos before it can go live.
  const supabase = await createClient();
  const { error } = await supabase
    .from("listings")
    .insert(parsed.rows.map((row) => ({ ...row, seller_id: user.id, status: "draft" as const })));
  if (error?.message === QUOTA_EXCEEDED_DB_MESSAGE && quota) {
    return { error: quotaExceededMessage(quota) };
  }
  if (error) return { error: "Could not import the listings. Nothing was imported. Try again." };

  revalidatePath("/dashboard", "layout");
  return { imported: parsed.rows.length };
}
