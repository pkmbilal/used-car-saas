import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { formatDay } from "@/lib/format";

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

// How long an admin-granted plan lasts before expire_plans (hourly pg_cron,
// plan_management migration) drops it back to free. null = no expiry.
export const PLAN_DURATIONS = [
  { months: 1, label: "1 month" },
  { months: 3, label: "3 months" },
  { months: 12, label: "12 months" },
  { months: null, label: "No expiry" },
] as const;

// For the admin selects, which send "" for no expiry.
export const PLAN_DURATION_OPTIONS = PLAN_DURATIONS.map(({ months, label }) => ({
  value: months === null ? "" : String(months),
  label,
}));

export type PlanDurationMonths = (typeof PLAN_DURATIONS)[number]["months"];

export function isPlanDuration(value: unknown): value is PlanDurationMonths {
  return PLAN_DURATIONS.some((duration) => duration.months === value);
}

export function planExpiryFromNow(months: PlanDurationMonths): string | null {
  if (months === null) return null;
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date.toISOString();
}

// Self-serve featuring (feature_own_listing) runs a fixed 7 days per slot.
export const SELF_FEATURE_DAYS = 7;

// Sellers see an expiry warning on their dashboard this close to the date.
const EXPIRY_WARNING_MS = 7 * 24 * 60 * 60 * 1000;

export function isPlanExpiringSoon(quota: Pick<ListingQuota, "planExpiresAt">): boolean {
  if (!quota.planExpiresAt) return false;
  return new Date(quota.planExpiresAt).getTime() - Date.now() < EXPIRY_WARNING_MS;
}

export function isPlan(value: unknown): value is Plan {
  return typeof value === "string" && value in PLAN_LABELS;
}

// Dealer plans get a branded storefront on /sellers/[id].
export function isDealerPlan(plan: Plan): boolean {
  return plan !== "free";
}

export type ListingQuota = {
  plan: Plan;
  planExpiresAt: string | null; // null = no expiry
  used: number;
  limit: number | null; // null = unlimited
  remaining: number | null;
  featuredUsed: number;
  featuredAllowance: number | null; // null = none included, admins feature as paid extras
  featuredRemaining: number; // self-serve slots left this month
};

export async function getListingQuota(): Promise<ListingQuota | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("listing_quota_status");
  const row = data?.[0];
  if (error || !row) return null;

  return {
    plan: row.plan,
    planExpiresAt: row.plan_expires_at,
    used: row.used,
    limit: row.monthly_limit,
    remaining: row.monthly_limit === null ? null : Math.max(0, row.monthly_limit - row.used),
    featuredUsed: row.featured_used,
    featuredAllowance: row.featured_allowance,
    featuredRemaining:
      row.featured_allowance === null ? 0 : Math.max(0, row.featured_allowance - row.featured_used),
  };
}

// Spends one of the seller's featured slots on their own listing (RLS-scoped
// client; feature_own_listing checks ownership and the allowance itself).
export async function featureOwnListing(listingId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("feature_own_listing", { p_listing_id: listingId });
  if (!error) return {};

  switch (error.message) {
    case "listing_not_active":
      return { error: "Only live listings can be featured." };
    case "featured_not_included":
      return { error: "Your plan doesn't include featured listings. See the Pricing page to upgrade." };
    case "featured_already_used":
      return { error: "This listing has already been featured this month." };
    case "featured_allowance_exceeded":
      return { error: "You've used all your featured listings for this month." };
    default:
      return { error: "Could not feature the listing. Try again." };
  }
}

// Raised by the enforce_listing_quota trigger.
export const QUOTA_EXCEEDED_DB_MESSAGE = "listing_quota_exceeded";

export function quotaExceededMessage(quota: Pick<ListingQuota, "plan" | "limit">): string {
  return `You've used all ${quota.limit} listings for this month on the ${PLAN_LABELS[quota.plan]} plan. See the Pricing page to upgrade for more listings.`;
}

export function quotaSummary(quota: ListingQuota): string {
  const plan = quota.planExpiresAt
    ? `${PLAN_LABELS[quota.plan]} plan until ${formatDay(quota.planExpiresAt)}`
    : `${PLAN_LABELS[quota.plan]} plan`;
  return quota.limit === null
    ? `${plan} · Unlimited listings`
    : `${plan} · ${quota.used} of ${quota.limit} listings used this month`;
}
