// Report reasons and validation, shared by the report form and server actions.
import type { Database } from "@/lib/supabase/database.types";

type ReportRow = Database["public"]["Tables"]["listing_reports"]["Row"];
export type ReportReason = ReportRow["reason"];

export const REPORT_REASONS: Record<ReportReason, string> = {
  scam: "Scam or fraud",
  spam: "Spam or duplicate",
  wrong_info: "Wrong or misleading details",
  already_sold: "Car is already sold",
  offensive: "Offensive content",
  other: "Something else",
};

export const MAX_REPORT_DETAILS = 1000;

// Admin removals triggered by a suspension; unsuspending restores only these.
export const SUSPENSION_REMOVAL_REASON = "Seller account suspended";

function isReason(value: unknown): value is ReportReason {
  return typeof value === "string" && Object.hasOwn(REPORT_REASONS, value);
}

export function parseReport(
  formData: FormData,
): { data: { reason: ReportReason; details: string | null } } | { error: string } {
  const reason = formData.get("reason");
  const details = String(formData.get("details") ?? "").trim();

  if (!isReason(reason)) return { error: "Choose a reason." };
  if (details.length > MAX_REPORT_DETAILS) {
    return { error: `Keep details under ${MAX_REPORT_DETAILS} characters.` };
  }
  return { data: { reason, details: details || null } };
}
