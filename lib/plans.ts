import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { fmt } from "@/lib/dictionary";
import type { Dictionary } from "@/lib/dictionaries";
import { formatDay } from "@/lib/format";
import type { Locale } from "@/lib/i18n";

// Limits live in the database (plan_monthly_listing_limit); this file only
// knows how to name plans and read the signed-in seller's usage.

export type Plan = Database["public"]["Tables"]["profiles"]["Row"]["plan"];

// English names for the admin panel; the site's are in the dictionaries.
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
  highlighted?: boolean;
};

// Prices for /pricing; the marketing copy is in the dictionaries
// (plans.details), whose listing limits must match plan_monthly_listing_limit
// (latest in the showroom_plan migration).
export const PLAN_DETAILS: Record<Plan, PlanDetails> = {
  free: { price: 0 },
  dealer: { price: 199 },
  dealer_pro: { price: 449, highlighted: true },
  showroom: { price: 899 },
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
  return planExpiryFrom(new Date(), months);
}

export function planExpiryFrom(start: Date, months: PlanDurationMonths): string | null {
  if (months === null) return null;
  const date = new Date(start);
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

// Ranges offered on /dashboard/insights, shortest first; empty = no insights.
// The longest must match plan_insights_days in the listing_daily_stats
// migration, which enforces it.
export const INSIGHTS_DAYS: Record<Plan, readonly number[]> = {
  free: [],
  dealer: [],
  dealer_pro: [7, 30],
  showroom: [7, 30, 90],
};

export function hasInsights(plan: Plan): boolean {
  return INSIGHTS_DAYS[plan].length > 0;
}

// Showroom extras on the insights page: make/city breakdown, CSV, print report.
export function hasInsightsReport(plan: Plan): boolean {
  return plan === "showroom";
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
  listingCredits: number; // bought extra listings, spent once the monthly limit is used up
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
    remaining:
      row.monthly_limit === null ? null : Math.max(0, row.monthly_limit - row.used) + row.listing_credits,
    featuredUsed: row.featured_used,
    featuredAllowance: row.featured_allowance,
    featuredRemaining:
      row.featured_allowance === null ? 0 : Math.max(0, row.featured_allowance - row.featured_used),
    listingCredits: row.listing_credits,
  };
}

const FEATURE_ERRORS = [
  "listing_not_active",
  "featured_not_included",
  "featured_already_used",
  "featured_allowance_exceeded",
] as const;

export type FeatureError = (typeof FEATURE_ERRORS)[number] | "failed";

// Spends one of the seller's featured slots on their own listing (RLS-scoped
// client; feature_own_listing checks ownership and the allowance itself).
// Errors come back as keys of the dictionary's plans.featureErrors.
export async function featureOwnListing(listingId: string): Promise<{ error?: FeatureError }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("feature_own_listing", { p_listing_id: listingId });
  if (!error) return {};
  const known = FEATURE_ERRORS.find((code) => code === error.message);
  return { error: known ?? "failed" };
}

// Refresh to top: a wait between refreshes of the same listing and a monthly
// cap per plan, both set by plan_bump_cooldown_hours / plan_monthly_bump_limit
// in the listing_bumps migration, which enforces them.
export type BumpStatus = {
  used: number;
  limit: number | null; // null = unlimited
  remaining: number | null;
  cooldownHours: number;
};

export async function getBumpStatus(): Promise<BumpStatus | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("bump_status");
  const row = data?.[0];
  if (error || !row) return null;
  return {
    used: row.used,
    limit: row.monthly_limit,
    remaining: row.monthly_limit === null ? null : Math.max(0, row.monthly_limit - row.used),
    cooldownHours: row.cooldown_hours,
  };
}

// When the listing can next be refreshed; null = now.
export function nextBumpAt(bumpedAt: string, status: Pick<BumpStatus, "cooldownHours">): string | null {
  const next = new Date(bumpedAt).getTime() + status.cooldownHours * 60 * 60 * 1000;
  return next > Date.now() ? new Date(next).toISOString() : null;
}

const BUMP_ERRORS = ["listing_not_active", "bump_too_soon", "bump_limit_reached"] as const;

export type BumpError = (typeof BUMP_ERRORS)[number] | "failed";

// Errors come back as keys of the dictionary's plans.bumpErrors.
export async function bumpOwnListing(listingId: string): Promise<{ error?: BumpError }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("bump_own_listing", { p_listing_id: listingId });
  if (!error) return {};
  const known = BUMP_ERRORS.find((code) => code === error.message);
  return { error: known ?? "failed" };
}

// Raised by the enforce_listing_quota trigger.
export const QUOTA_EXCEEDED_DB_MESSAGE = "listing_quota_exceeded";

// Never-published drafts a seller can hold at once, so drafts can't fill R2
// with photos. Must match plan_draft_limit in the draft_limit migration, which
// enforces it (and raises these messages).
export const DRAFT_LIMIT: Record<Plan, number> = {
  free: 5,
  dealer: 50,
  dealer_pro: 200,
  showroom: 500,
};
export const DRAFT_LIMIT_DB_MESSAGE = "draft_limit_exceeded";

// Photos per listing. Must match plan_photo_limit in the photo_limit
// migration, which enforces it. Listings over the limit after a downgrade keep
// their photos but can't add more.
export const PHOTO_LIMIT: Record<Plan, number> = {
  free: 5,
  dealer: 10,
  dealer_pro: 15,
  showroom: 20,
};
export const PHOTO_LIMIT_DB_MESSAGE = "photo_limit_exceeded";
export const NOT_PUBLISHED_DB_MESSAGE = "listing_not_published";

export type DraftUsage = { plan: Plan; used: number; limit: number; remaining: number };

export async function getDraftUsage(sellerId: string, plan: Plan): Promise<DraftUsage> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("seller_id", sellerId)
    .eq("status", "draft")
    .is("first_published_at", null);
  const used = count ?? 0;
  const limit = DRAFT_LIMIT[plan];
  return { plan, used, limit, remaining: Math.max(0, limit - used) };
}

function namedPlan(t: Dictionary, plan: Plan): string {
  return fmt(t.plans.named, { plan: t.plans.labels[plan] });
}

export function quotaExceededMessage(t: Dictionary, quota: Pick<ListingQuota, "plan" | "limit">): string {
  return fmt(t.plans.quotaExceeded, { limit: quota.limit ?? "", plan: namedPlan(t, quota.plan) });
}

// Shown on the new-listing and import pages: drafts can still be saved.
export function quotaReachedNote(t: Dictionary, quota: Pick<ListingQuota, "plan" | "limit">): string {
  return fmt(t.plans.quotaReached, { limit: quota.limit ?? "", plan: namedPlan(t, quota.plan) });
}

export function draftLimitMessage(t: Dictionary, usage: Pick<DraftUsage, "plan" | "limit">): string {
  return fmt(t.plans.draftLimitReached, { limit: usage.limit, plan: namedPlan(t, usage.plan) });
}

export function draftImportTooManyMessage(t: Dictionary, usage: Pick<DraftUsage, "remaining" | "limit">): string {
  return fmt(t.plans.draftImportTooMany, { remaining: usage.remaining, limit: usage.limit });
}

export function quotaSummary(t: Dictionary, locale: Locale, quota: ListingQuota): string {
  const name = t.plans.labels[quota.plan];
  const plan = quota.planExpiresAt
    ? fmt(t.plans.summaryPlanUntil, { plan: name, date: formatDay(quota.planExpiresAt, locale) })
    : fmt(t.plans.summaryPlan, { plan: name });
  return quota.limit === null
    ? `${plan} · ${t.plans.unlimited}`
    : `${plan} · ${fmt(t.plans.usedOf, { used: quota.used, limit: quota.limit })}`;
}

// /pricing shows prices excluding VAT; dealers pay price + VAT.
export const VAT_RATE = 0.15;

function withVat(price: number): number {
  return Math.round(price * (1 + VAT_RATE) * 100) / 100;
}

// One-off add-ons any seller can request (addon_requests migration), in SAR
// excluding VAT: a 7-day boost per listing, and a price per extra listing.
export const ADDON_PRICES = { featured_boost: 49, extra_listing: 19 } as const;

export const BOOST_DAYS = 7;

// Must match the pack sizes request_addon accepts.
export const EXTRA_LISTING_PACKS = [1, 3, 5] as const;

export type AddonKind = "featured_boost" | "extra_listings";

// Price excluding VAT, for the site.
export function addonPrice(kind: AddonKind, quantity = 1): number {
  return kind === "featured_boost" ? ADDON_PRICES.featured_boost : ADDON_PRICES.extra_listing * quantity;
}

// Price including VAT, for prefilling recorded payments.
export function addonPriceWithVat(kind: AddonKind, quantity = 1): number {
  return withVat(addonPrice(kind, quantity));
}

// Monthly SAR price per plan including VAT, for prefilling recorded payments.
export const PLAN_PRICES: Record<Plan, number> = {
  free: withVat(PLAN_DETAILS.free.price),
  dealer: withVat(PLAN_DETAILS.dealer.price),
  dealer_pro: withVat(PLAN_DETAILS.dealer_pro.price),
  showroom: withVat(PLAN_DETAILS.showroom.price),
};
