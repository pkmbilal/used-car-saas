import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

// Limits live in the database (plan_monthly_listing_limit); this file only
// knows how to name plans and read the signed-in seller's usage.

export type Plan = Database["public"]["Tables"]["profiles"]["Row"]["plan"];

export const PLAN_LABELS: Record<Plan, string> = {
  free: "Free",
  dealer: "Dealer",
  dealer_pro: "Dealer Pro",
};

export const PLANS = Object.keys(PLAN_LABELS) as Plan[];

export function isPlan(value: unknown): value is Plan {
  return typeof value === "string" && value in PLAN_LABELS;
}

export type ListingQuota = {
  plan: Plan;
  used: number;
  limit: number | null; // null = unlimited
  remaining: number | null;
};

export async function getListingQuota(): Promise<ListingQuota | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("listing_quota_status");
  const row = data?.[0];
  if (error || !row) return null;

  return {
    plan: row.plan,
    used: row.used,
    limit: row.monthly_limit,
    remaining: row.monthly_limit === null ? null : Math.max(0, row.monthly_limit - row.used),
  };
}

// Raised by the enforce_listing_quota trigger.
export const QUOTA_EXCEEDED_DB_MESSAGE = "listing_quota_exceeded";

export function quotaExceededMessage(quota: Pick<ListingQuota, "plan" | "limit">): string {
  return `You've used all ${quota.limit} listings for this month on the ${PLAN_LABELS[quota.plan]} plan. Contact us to upgrade.`;
}

export function quotaSummary(quota: ListingQuota): string {
  const plan = `${PLAN_LABELS[quota.plan]} plan`;
  return quota.limit === null
    ? `${plan} · Unlimited listings`
    : `${plan} · ${quota.used} of ${quota.limit} listings used this month`;
}
