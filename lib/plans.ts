import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

// Limits live in the database (plan_monthly_listing_limit); this file only
// knows how to name plans and read the signed-in seller's usage.

export type Plan = Database["public"]["Tables"]["profiles"]["Row"]["plan"];

export const PLAN_LABELS: Record<Plan, string> = {
  free: "Free",
  dealer: "Dealer",
  dealer_pro: "Pro",
  showroom: "Showroom",
};

// Ordered lowest to highest.
export const PLANS = Object.keys(PLAN_LABELS) as Plan[];

export type PlanDetails = {
  price: number; // SAR per month; billing isn't wired up, a moderator grants plans
  tagline: string;
  features: string[];
  highlighted?: boolean;
};

// Marketing copy for /pricing. The listing limits must match
// plan_monthly_listing_limit (latest in the showroom_plan migration).
export const PLAN_DETAILS: Record<Plan, PlanDetails> = {
  free: {
    price: 0,
    tagline: "For individuals selling their own car.",
    features: [
      "3 listings a month",
      "Seller profile page",
      "Buyers contact you by phone or WhatsApp",
      "Views and contact stats on your dashboard",
    ],
  },
  dealer: {
    price: 199,
    tagline: "For showrooms getting started online.",
    features: [
      "30 listings a month",
      "Branded dealer storefront",
      "Listed in the dealers directory",
      "Bulk upload from CSV",
      "Everything in Free",
    ],
  },
  dealer_pro: {
    price: 449,
    tagline: "For established dealers growing their sales.",
    features: [
      "100 listings a month",
      "Dealer mini-site with its own link, in Arabic and English",
      "WhatsApp lead routing to the right salesperson",
      "3 featured listings a month",
      "Bulk upload from Excel or CSV",
      "Everything in Dealer",
    ],
    highlighted: true,
  },
  showroom: {
    price: 899,
    tagline: "For showrooms with multiple branches and teams.",
    features: [
      "Unlimited listings",
      "Multiple branches and staff accounts",
      "Custom domain for your mini-site",
      "10 featured listings a month",
      "Priority support and a monthly performance report",
      "Everything in Pro",
    ],
  },
};

// Featured listings included per month; null = none included, admins feature
// them as paid extras. Must match plan_monthly_featured_allowance in the
// featured_allowance migration, which enforces it.
export const FEATURED_ALLOWANCE: Record<Plan, number | null> = {
  free: null,
  dealer: null,
  dealer_pro: 3,
  showroom: 10,
};

export function isPlan(value: unknown): value is Plan {
  return typeof value === "string" && value in PLAN_LABELS;
}

// Dealer plans get a branded storefront on /sellers/[id].
export function isDealerPlan(plan: Plan): boolean {
  return plan !== "free";
}

export type ListingQuota = {
  plan: Plan;
  used: number;
  limit: number | null; // null = unlimited
  remaining: number | null;
  featuredUsed: number;
  featuredAllowance: number | null; // null = none included, admins feature as paid extras
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
    featuredUsed: row.featured_used,
    featuredAllowance: row.featured_allowance,
  };
}

// Raised by the enforce_listing_quota trigger.
export const QUOTA_EXCEEDED_DB_MESSAGE = "listing_quota_exceeded";

export function quotaExceededMessage(quota: Pick<ListingQuota, "plan" | "limit">): string {
  return `You've used all ${quota.limit} listings for this month on the ${PLAN_LABELS[quota.plan]} plan. See the Pricing page to upgrade for more listings.`;
}

export function quotaSummary(quota: ListingQuota): string {
  const plan = `${PLAN_LABELS[quota.plan]} plan`;
  return quota.limit === null
    ? `${plan} · Unlimited listings`
    : `${plan} · ${quota.used} of ${quota.limit} listings used this month`;
}
