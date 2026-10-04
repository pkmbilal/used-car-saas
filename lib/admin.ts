import "server-only";
import { requireAdmin } from "@/lib/auth";
import { isDealerPlanChoice } from "@/lib/dealer-application-options";
import { withImageUrls, type ListingStatus } from "@/lib/listings";
import { SUSPENSION_REMOVAL_REASON } from "@/lib/moderation";
import {
  FEATURED_ALLOWANCE,
  isPlan,
  isPlanDuration,
  planExpiryFrom,
  planExpiryFromNow,
  type Plan,
} from "@/lib/plans";
import { isPaymentMethod, type PaymentInput } from "@/lib/payment-options";
import { deleteObjects, presignGet, PRIVATE_BUCKET } from "@/lib/r2";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import { MAX_REJECT_REASON } from "@/lib/verification-options";

// Moderation data access. Uses the service-role client (bypasses RLS), so
// every function checks for an admin itself rather than trusting its caller.

export const ADMIN_PAGE_SIZE = 25;

export type AdminResult = { error?: string };

function range(page: number) {
  const from = (page - 1) * ADMIN_PAGE_SIZE;
  return [from, from + ADMIN_PAGE_SIZE - 1] as const;
}

// Keep free-text search safe inside PostgREST's or=(...) filter syntax.
function searchTerm(q: string | undefined): string | undefined {
  const cleaned = q?.replace(/[^\p{L}\p{N}\s+-]/gu, "").trim();
  return cleaned ? cleaned : undefined;
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export type ReportedListing = Awaited<ReturnType<typeof getOpenReports>>[number];

// Open reports grouped by listing, most recently reported first.
export async function getOpenReports() {
  await requireAdmin();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("listing_reports")
    .select(
      "id, reason, details, created_at, listing:listings(*, listing_images(*), seller:profiles!listings_seller_id_fkey(id, full_name))",
    )
    .eq("status", "open")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const rows = data.flatMap(({ listing, ...report }) =>
    listing ? [{ listing: withImageUrls(listing), report }] : [],
  );
  type Row = (typeof rows)[number];
  const groups = new Map<string, { listing: Row["listing"]; reports: Row["report"][] }>();
  for (const { listing, report } of rows) {
    const group = groups.get(listing.id);
    if (group) group.reports.push(report);
    else groups.set(listing.id, { listing, reports: [report] });
  }
  return [...groups.values()];
}

// The current quota month in Riyadh time as YYYY-MM-01, mirroring
// public.current_quota_month().
function quotaMonth(): string {
  const month = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
  }).format(new Date());
  return `${month}-01`;
}

export type FeaturedStatus = {
  used: number;
  allowance: number | null; // null = no allowance, featured as paid extras
  countedThisMonth: boolean; // re-featuring this listing won't use another slot
};

export async function getAllListings(filters: {
  status?: ListingStatus;
  q?: string;
  page: number;
}) {
  await requireAdmin();
  const supabase = createAdminClient();
  let query = supabase
    .from("listings")
    .select("*, listing_images(*), seller:profiles!listings_seller_id_fkey(id, full_name, plan)", {
      count: "exact",
    });

  if (filters.status) query = query.eq("status", filters.status);
  const q = searchTerm(filters.q);
  if (q) query = query.or(`make.ilike.%${q}%,model.ilike.%${q}%`);

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(...range(filters.page));
  // Out-of-range pages error in PostgREST; treat them as empty.
  if (error) return { listings: [], total: count ?? 0 };

  // This month's featured usage for the sellers on this page.
  const sellerIds = [...new Set(data.map((listing) => listing.seller_id))];
  const { data: usage } = sellerIds.length
    ? await supabase
        .from("featured_usage")
        .select("seller_id, listing_id")
        .in("seller_id", sellerIds)
        .eq("month", quotaMonth())
    : { data: [] };
  const usedBySeller = new Map<string, number>();
  const countedListings = new Set<string>();
  for (const row of usage ?? []) {
    usedBySeller.set(row.seller_id, (usedBySeller.get(row.seller_id) ?? 0) + 1);
    if (row.listing_id) countedListings.add(row.listing_id);
  }

  return {
    listings: data.map((listing) => ({
      ...withImageUrls(listing),
      featured: {
        used: usedBySeller.get(listing.seller_id) ?? 0,
        allowance: listing.seller ? FEATURED_ALLOWANCE[listing.seller.plan] : null,
        countedThisMonth: countedListings.has(listing.id),
      } satisfies FeaturedStatus,
    })),
    total: count ?? 0,
  };
}

export async function getUsers(filters: { q?: string; page: number }) {
  await requireAdmin();
  const supabase = createAdminClient();
  let query = supabase
    .from("profiles")
    .select("*, listings(count)", { count: "exact" });

  const q = searchTerm(filters.q);
  if (q) query = query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`);

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(...range(filters.page));
  if (error) return { users: [], total: count ?? 0 };
  return {
    users: data.map(({ listings, ...profile }) => ({
      ...profile,
      listingCount: listings[0]?.count ?? 0,
    })),
    total: count ?? 0,
  };
}

export type PlanChange = Awaited<ReturnType<typeof getPlanChanges>>["changes"][number];

// Newest first: every plan change, with who it was for and who made it.
export async function getPlanChanges(page: number) {
  await requireAdmin();
  const supabase = createAdminClient();
  const { data, count, error } = await supabase
    .from("plan_changes")
    .select(
      "*, user:profiles!plan_changes_user_id_fkey(id, full_name), changed_by_profile:profiles!plan_changes_changed_by_fkey(full_name)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(...range(page));
  if (error) return { changes: [], total: count ?? 0 };
  return { changes: data, total: count ?? 0 };
}

export type FeaturedGrant = Awaited<ReturnType<typeof getFeaturedGrants>>["grants"][number];

// Newest first: every featured placement, admin-granted or self-serve.
export async function getFeaturedGrants(page: number) {
  await requireAdmin();
  const supabase = createAdminClient();
  const { data, count, error } = await supabase
    .from("featured_grants")
    .select(
      "*, listing:listings(id, year, make, model), seller:profiles!featured_grants_seller_id_fkey(id, full_name), granted_by_profile:profiles!featured_grants_granted_by_fkey(full_name)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(...range(page));
  if (error) return { grants: [], total: count ?? 0 };
  return { grants: data, total: count ?? 0 };
}

// Plans ending within this many days show on the overview and Expiring tab.
export const EXPIRING_WINDOW_DAYS = 14;
// Within the window, these are highlighted as urgent.
const ENDING_SOON_DAYS = 3;

const DAY_MS = 24 * 60 * 60 * 1000;

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * DAY_MS).toISOString();
}

// Work waiting on an admin, for the nav badges.
export async function getPendingCounts() {
  await requireAdmin();
  const supabase = createAdminClient();
  const [reports, ids, dealers] = await Promise.all([
    supabase.from("listing_reports").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase
      .from("id_verification_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("dealer_applications")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);
  return {
    reports: reports.count ?? 0,
    verifications: ids.count ?? 0,
    dealers: dealers.count ?? 0,
  };
}

export async function getAdminOverview() {
  await requireAdmin();
  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const weekAgo = daysFromNow(-7);
  // Start of the current month in Riyadh time.
  const monthStart = `${quotaMonth()}T00:00:00+03:00`;

  const [pending, expiring, newUsers, newListings, active, featured, paidPlans, payments] =
    await Promise.all([
      getPendingCounts(),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .neq("plan", "free")
        .lte("plan_expires_at", daysFromNow(EXPIRING_WINDOW_DAYS)),
      supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
      supabase.from("listings").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
      supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("status", "active")
        .gt("featured_until", now),
      supabase.from("profiles").select("plan").neq("plan", "free"),
      supabase.from("plan_payments").select("amount").gte("created_at", monthStart),
    ]);

  const planCounts = new Map<Plan, number>();
  for (const { plan } of paidPlans.data ?? []) planCounts.set(plan, (planCounts.get(plan) ?? 0) + 1);

  return {
    pending,
    expiringPlans: expiring.count ?? 0,
    newUsers: newUsers.count ?? 0,
    newListings: newListings.count ?? 0,
    activeListings: active.count ?? 0,
    featuredListings: featured.count ?? 0,
    planCounts,
    paymentsThisMonth: (payments.data ?? []).reduce((sum, { amount }) => sum + Number(amount), 0),
  };
}

export type ExpiringPlan = Awaited<ReturnType<typeof getExpiringPlans>>[number];

// Paid plans ending soon, soonest first. expire_plans moves them to Free.
export async function getExpiringPlans() {
  await requireAdmin();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone, plan, plan_expires_at, business_name")
    .neq("plan", "free")
    .lte("plan_expires_at", daysFromNow(EXPIRING_WINDOW_DAYS))
    .order("plan_expires_at", { ascending: true });
  if (error) throw error;
  const soon = Date.now() + ENDING_SOON_DAYS * DAY_MS;
  return data.map((profile) => ({
    ...profile,
    endsSoon: profile.plan_expires_at !== null && new Date(profile.plan_expires_at).getTime() <= soon,
  }));
}

export type PlanPayment = Awaited<ReturnType<typeof getPayments>>["payments"][number];

// Newest first: every payment recorded by an admin.
export async function getPayments(page: number) {
  await requireAdmin();
  const supabase = createAdminClient();
  const { data, count, error } = await supabase
    .from("plan_payments")
    .select(
      "*, user:profiles!plan_payments_user_id_fkey(id, full_name), recorded_by_profile:profiles!plan_payments_recorded_by_fkey(full_name), plan_change:plan_changes(to_plan, expires_at)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(...range(page));
  if (error) return { payments: [], total: count ?? 0 };
  return { payments: data, total: count ?? 0 };
}

const ADMIN_ACTION_SELECT =
  "*, admin:profiles!admin_actions_admin_id_fkey(full_name), user:profiles!admin_actions_user_id_fkey(id, full_name), listing:listings(id, year, make, model)";

export type AdminActionRow = Awaited<ReturnType<typeof getAdminActions>>["actions"][number];

// Newest first: every logged moderation decision.
export async function getAdminActions(page: number) {
  await requireAdmin();
  const supabase = createAdminClient();
  const { data, count, error } = await supabase
    .from("admin_actions")
    .select(ADMIN_ACTION_SELECT, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(...range(page));
  if (error) return { actions: [], total: count ?? 0 };
  return { actions: data, total: count ?? 0 };
}

// Most recent rows per section on the user detail page.
const USER_HISTORY_LIMIT = 50;

// Everything about one user in one place. Null if there is no such profile.
export async function getUserDetail(userId: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (!profile) return null;

  const [listings, planChanges, payments, featuredGrants, reports, idRequests, dealerApplications, actions] =
    await Promise.all([
      supabase
        .from("listings")
        .select("id, year, make, model, price, status, removed_reason, featured_until, created_at")
        .eq("seller_id", userId)
        .order("created_at", { ascending: false })
        .limit(USER_HISTORY_LIMIT),
      supabase
        .from("plan_changes")
        .select("*, changed_by_profile:profiles!plan_changes_changed_by_fkey(full_name)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(USER_HISTORY_LIMIT),
      supabase
        .from("plan_payments")
        .select("*, recorded_by_profile:profiles!plan_payments_recorded_by_fkey(full_name)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(USER_HISTORY_LIMIT),
      supabase
        .from("featured_grants")
        .select("*, listing:listings(id, year, make, model)")
        .eq("seller_id", userId)
        .order("created_at", { ascending: false })
        .limit(USER_HISTORY_LIMIT),
      supabase
        .from("listing_reports")
        .select("id, reason, details, status, created_at, listing:listings!inner(id, year, make, model)")
        .eq("listing.seller_id", userId)
        .order("created_at", { ascending: false })
        .limit(USER_HISTORY_LIMIT),
      supabase
        .from("id_verification_requests")
        .select("id, status, reject_reason, created_at, reviewed_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("dealer_applications")
        .select("id, business_name, requested_plan, status, reject_reason, created_at, reviewed_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("admin_actions")
        .select(ADMIN_ACTION_SELECT)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(USER_HISTORY_LIMIT),
    ]);

  return {
    profile,
    listings: (listings.data ?? []).map((listing) => ({
      ...listing,
      featuredNow: listing.featured_until !== null && new Date(listing.featured_until).getTime() > Date.now(),
    })),
    planChanges: planChanges.data ?? [],
    payments: payments.data ?? [],
    featuredGrants: featuredGrants.data ?? [],
    reports: reports.data ?? [],
    idRequests: idRequests.data ?? [],
    dealerApplications: dealerApplications.data ?? [],
    actions: actions.data ?? [],
  };
}

// ---------------------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------------------

export type AdminActionType = Database["public"]["Tables"]["admin_actions"]["Row"]["action"];

// Records a moderation decision after it succeeded. A failed log write is
// reported but never undoes or fails the action itself.
async function logAdminAction(
  adminId: string,
  action: AdminActionType,
  target: { userId: string | null; listingId?: string; reason?: string },
) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("admin_actions").insert({
    admin_id: adminId,
    action,
    user_id: target.userId,
    listing_id: target.listingId ?? null,
    reason: target.reason ?? null,
  });
  if (error) console.error("Failed to log admin action", action, target, error);
}

// ---------------------------------------------------------------------------
// Listing moderation
// ---------------------------------------------------------------------------

// Only live listings can be taken down; resolves any open reports on it.
export async function removeListing(listingId: string, reason: string): Promise<AdminResult> {
  const { user } = await requireAdmin();
  const removedReason = reason.trim();
  if (!removedReason) return { error: "Give a reason the seller will see." };
  if (removedReason.length > 300) return { error: "Keep the reason under 300 characters." };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("listings")
    .update({ status: "removed", removed_reason: removedReason })
    .eq("id", listingId)
    .eq("status", "active")
    .select("seller_id");
  if (error) return { error: "Could not remove the listing. Try again." };
  if (data.length === 0) return { error: "Only live listings can be removed." };
  await logAdminAction(user.id, "listing_removed", {
    userId: data[0].seller_id,
    listingId,
    reason: removedReason,
  });

  const { error: reportError } = await supabase
    .from("listing_reports")
    .update({ status: "resolved", resolved_at: new Date().toISOString(), resolved_by: user.id })
    .eq("listing_id", listingId)
    .eq("status", "open");
  if (reportError) return { error: "Listing removed, but its reports could not be closed." };
  return {};
}

export async function restoreListing(listingId: string): Promise<AdminResult> {
  const { user } = await requireAdmin();
  const supabase = createAdminClient();

  const { data: listing } = await supabase
    .from("listings")
    .select("status, seller_id, seller:profiles!listings_seller_id_fkey(suspended_at)")
    .eq("id", listingId)
    .maybeSingle();
  if (!listing || listing.status !== "removed") return { error: "Listing is not removed." };
  if (listing.seller?.suspended_at) return { error: "Unsuspend the seller first." };

  const { error } = await supabase
    .from("listings")
    .update({ status: "active", removed_reason: null })
    .eq("id", listingId);
  if (error) return { error: "Could not restore the listing. Try again." };
  await logAdminAction(user.id, "listing_restored", { userId: listing.seller_id, listingId });
  return {};
}

export async function dismissReports(listingId: string): Promise<AdminResult> {
  const { user } = await requireAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("listing_reports")
    .update({ status: "dismissed", resolved_at: new Date().toISOString(), resolved_by: user.id })
    .eq("listing_id", listingId)
    .eq("status", "open");
  if (error) return { error: "Could not dismiss the reports. Try again." };

  const { data: listing } = await supabase
    .from("listings")
    .select("seller_id")
    .eq("id", listingId)
    .maybeSingle();
  await logAdminAction(user.id, "reports_dismissed", { userId: listing?.seller_id ?? null, listingId });
  return {};
}

// Featured placement is granted by hand until payments land. feature_listing
// enforces the plan's monthly allowance (Pro/Showroom); listings on other
// plans can be featured as paid extras. Re-featuring a listing that is still
// featured extends it rather than resetting it.
export const FEATURE_DAYS = [7, 30] as const;

export async function featureListing(listingId: string, days: number): Promise<AdminResult> {
  const { user } = await requireAdmin();
  if (!(FEATURE_DAYS as readonly number[]).includes(days)) return { error: "Unknown duration." };

  const supabase = createAdminClient();
  const { error } = await supabase.rpc("feature_listing", {
    p_listing_id: listingId,
    p_days: days,
    p_admin: user.id,
  });
  if (error?.message === "listing_not_active") return { error: "Only live listings can be featured." };
  if (error?.message === "featured_allowance_exceeded") {
    return { error: "This seller has used all the featured listings included in their plan this month." };
  }
  if (error) return { error: "Could not feature the listing. Try again." };
  return {};
}

export async function unfeatureListing(listingId: string): Promise<AdminResult> {
  const { user } = await requireAdmin();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("listings")
    .update({ featured_until: null })
    .eq("id", listingId)
    .select("seller_id");
  if (error) return { error: "Could not unfeature the listing. Try again." };
  if (data[0]) {
    await logAdminAction(user.id, "listing_unfeatured", { userId: data[0].seller_id, listingId });
  }
  return {};
}

// ---------------------------------------------------------------------------
// User moderation
// ---------------------------------------------------------------------------

// Suspension hides the seller's live listings; the guard trigger and insert
// policy stop them publishing or creating new ones.
export async function suspendUser(userId: string): Promise<AdminResult> {
  const { user } = await requireAdmin();
  if (userId === user.id) return { error: "You can't suspend yourself." };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("profiles")
    .update({ suspended_at: new Date().toISOString() })
    .eq("id", userId)
    .is("suspended_at", null);
  if (error) return { error: "Could not suspend the user. Try again." };

  const { error: listingError } = await supabase
    .from("listings")
    .update({ status: "removed", removed_reason: SUSPENSION_REMOVAL_REASON })
    .eq("seller_id", userId)
    .eq("status", "active");
  await logAdminAction(user.id, "user_suspended", { userId });
  if (listingError) return { error: "User suspended, but their listings could not be hidden." };
  return {};
}

export async function unsuspendUser(userId: string): Promise<AdminResult> {
  const { user } = await requireAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("profiles")
    .update({ suspended_at: null })
    .eq("id", userId);
  if (error) return { error: "Could not unsuspend the user. Try again." };
  await logAdminAction(user.id, "user_unsuspended", { userId });

  // Listings removed individually by a moderator stay removed.
  const { error: listingError } = await supabase
    .from("listings")
    .update({ status: "active", removed_reason: null })
    .eq("seller_id", userId)
    .eq("status", "removed")
    .eq("removed_reason", SUSPENSION_REMOVAL_REASON);
  if (listingError) return { error: "User unsuspended, but their listings could not be restored." };
  return {};
}

const MAX_PLAN_NOTE = 300;
const MAX_PAYMENT_REFERENCE = 100;

function validatePayment(payment: PaymentInput | null): string | undefined {
  if (!payment) return undefined;
  if (!Number.isFinite(payment.amount) || payment.amount <= 0) return "Enter the amount paid.";
  if (Math.round(payment.amount * 100) !== payment.amount * 100) {
    return "The amount can have at most 2 decimals.";
  }
  if (payment.amount >= 100_000_000) return "That amount is too large.";
  if (!isPaymentMethod(payment.method)) return "Unknown payment method.";
  if (payment.reference.trim().length > MAX_PAYMENT_REFERENCE) {
    return `Keep the reference under ${MAX_PAYMENT_REFERENCE} characters.`;
  }
  return undefined;
}

// set_plan records the change in plan_changes; the payment, if any, points at
// that change.
async function grantPlan(
  adminId: string,
  userId: string,
  plan: Plan,
  expiresAt: string | null,
  note: string,
  payment: PaymentInput | null,
): Promise<AdminResult> {
  const supabase = createAdminClient();
  const { data: changeId, error } = await supabase.rpc("set_plan", {
    p_user: userId,
    p_plan: plan,
    p_expires_at: expiresAt,
    p_changed_by: adminId,
    p_source: "admin",
    p_note: note,
  });
  if (error) return { error: "Could not change the plan. Try again." };
  if (!payment || !isPaymentMethod(payment.method)) return {};

  const { error: paymentError } = await supabase.from("plan_payments").insert({
    user_id: userId,
    plan_change_id: changeId,
    amount: payment.amount,
    method: payment.method,
    reference: payment.reference.trim() || null,
    recorded_by: adminId,
  });
  if (paymentError) return { error: "Plan changed, but the payment could not be recorded." };
  return {};
}

// Plans are granted by hand until billing lands; Free never expires. Picking
// a duration starts it from today.
export async function setUserPlan(
  userId: string,
  plan: string,
  months: number | null,
  note: string,
  payment: PaymentInput | null = null,
): Promise<AdminResult> {
  const { user } = await requireAdmin();
  if (!isPlan(plan)) return { error: "Unknown plan." };
  if (!isPlanDuration(months)) return { error: "Unknown duration." };
  if (note.trim().length > MAX_PLAN_NOTE) {
    return { error: `Keep the note under ${MAX_PLAN_NOTE} characters.` };
  }
  const invalidPayment = validatePayment(plan === "free" ? null : payment);
  if (invalidPayment) return { error: invalidPayment };

  return grantPlan(user.id, userId, plan, planExpiryFromNow(months), note, plan === "free" ? null : payment);
}

// Renews the user's current paid plan, adding the months on top of the time
// they have left so paying early doesn't lose days.
export async function extendUserPlan(
  userId: string,
  months: number,
  note: string,
  payment: PaymentInput | null = null,
): Promise<AdminResult> {
  const { user } = await requireAdmin();
  if (!isPlanDuration(months) || months === null) return { error: "Unknown duration." };
  if (note.trim().length > MAX_PLAN_NOTE) {
    return { error: `Keep the note under ${MAX_PLAN_NOTE} characters.` };
  }
  const invalidPayment = validatePayment(payment);
  if (invalidPayment) return { error: invalidPayment };

  const supabase = createAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, plan_expires_at")
    .eq("id", userId)
    .maybeSingle();
  if (!profile) return { error: "User not found." };
  if (profile.plan === "free" || !profile.plan_expires_at) {
    return { error: "Only paid plans with an expiry date can be extended." };
  }

  const start = new Date(Math.max(Date.now(), new Date(profile.plan_expires_at).getTime()));
  return grantPlan(user.id, userId, profile.plan, planExpiryFrom(start, months), note, payment);
}

// ---------------------------------------------------------------------------
// ID verification
// ---------------------------------------------------------------------------

export type PendingIdVerification = Awaited<ReturnType<typeof getPendingIdVerifications>>[number];

// Oldest first, with short-lived links to the private documents.
export async function getPendingIdVerifications() {
  await requireAdmin();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("id_verification_requests")
    .select(
      "id, doc_keys, created_at, user:profiles!id_verification_requests_user_id_fkey(id, full_name, phone, city, created_at, suspended_at)",
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  if (error) throw error;

  return Promise.all(
    data.map(async ({ doc_keys, ...request }) => ({
      ...request,
      docs: await Promise.all(
        doc_keys.map(async (key) => ({
          url: await presignGet(key),
          isPdf: key.endsWith(".pdf"),
        })),
      ),
    })),
  );
}

// Closes a pending request and deletes its documents: we don't keep ID copies
// once a decision is made.
async function reviewIdVerification(
  requestId: string,
  decision: { status: "approved" } | { status: "rejected"; reject_reason: string },
): Promise<{ userId: string } | { error: string }> {
  const { user } = await requireAdmin();
  const supabase = createAdminClient();

  const { data: request } = await supabase
    .from("id_verification_requests")
    .select("user_id, doc_keys")
    .eq("id", requestId)
    .eq("status", "pending")
    .maybeSingle();
  if (!request) return { error: "Request is no longer pending." };

  const { data, error } = await supabase
    .from("id_verification_requests")
    .update({
      ...decision,
      doc_keys: [],
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq("id", requestId)
    .eq("status", "pending")
    .select("id");
  if (error) return { error: "Could not update the request. Try again." };
  if (data.length === 0) return { error: "Request is no longer pending." };

  await deleteObjects(request.doc_keys, PRIVATE_BUCKET).catch((err) =>
    console.error("Failed to delete ID documents", request.doc_keys, err),
  );
  await logAdminAction(user.id, decision.status === "approved" ? "id_approved" : "id_rejected", {
    userId: request.user_id,
    reason: decision.status === "rejected" ? decision.reject_reason : undefined,
  });
  return { userId: request.user_id };
}

export async function approveIdVerification(requestId: string): Promise<AdminResult> {
  const reviewed = await reviewIdVerification(requestId, { status: "approved" });
  if ("error" in reviewed) return reviewed;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("profiles")
    .update({ id_verified_at: new Date().toISOString() })
    .eq("id", reviewed.userId);
  if (error) return { error: "Request approved, but the badge could not be granted." };
  return {};
}

export async function rejectIdVerification(
  requestId: string,
  reason: string,
): Promise<AdminResult> {
  const rejectReason = reason.trim();
  if (!rejectReason) return { error: "Give a reason the seller will see." };
  if (rejectReason.length > MAX_REJECT_REASON) {
    return { error: `Keep the reason under ${MAX_REJECT_REASON} characters.` };
  }

  const reviewed = await reviewIdVerification(requestId, {
    status: "rejected",
    reject_reason: rejectReason,
  });
  return "error" in reviewed ? reviewed : {};
}

export async function revokeIdVerification(userId: string): Promise<AdminResult> {
  const { user } = await requireAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("profiles")
    .update({ id_verified_at: null })
    .eq("id", userId);
  if (error) return { error: "Could not revoke the badge. Try again." };
  await logAdminAction(user.id, "id_revoked", { userId });
  return {};
}

// ---------------------------------------------------------------------------
// Dealer applications
// ---------------------------------------------------------------------------

export type PendingDealerApplication = Awaited<
  ReturnType<typeof getPendingDealerApplications>
>[number];

// Oldest first, with short-lived links to any documents.
export async function getPendingDealerApplications() {
  await requireAdmin();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("dealer_applications")
    .select(
      "id, business_name, showroom_address, cr_number, vat_number, muroor_number, requested_plan, cr_doc_key, vat_doc_key, muroor_doc_key, created_at, user:profiles!dealer_applications_user_id_fkey(id, full_name, phone, city, created_at, suspended_at)",
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  if (error) throw error;

  return Promise.all(
    data.map(async ({ cr_doc_key, vat_doc_key, muroor_doc_key, ...application }) => {
      const docs = await Promise.all(
        (
          [
            ["cr", cr_doc_key],
            ["vat", vat_doc_key],
            ["muroor", muroor_doc_key],
          ] as const
        ).map(async ([doc, key]) =>
          key ? { doc, url: await presignGet(key), isPdf: key.endsWith(".pdf") } : null,
        ),
      );
      return { ...application, docs: docs.filter((doc) => doc !== null) };
    }),
  );
}

async function reviewDealerApplication(
  applicationId: string,
  decision: { status: "approved" } | { status: "rejected"; reject_reason: string },
) {
  const { user } = await requireAdmin();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("dealer_applications")
    .update({ ...decision, reviewed_at: new Date().toISOString(), reviewed_by: user.id })
    .eq("id", applicationId)
    .eq("status", "pending")
    .select("user_id, business_name, showroom_address, cr_doc_key, vat_doc_key, muroor_doc_key");
  if (error) return { error: "Could not update the application. Try again." };
  if (data.length === 0) return { error: "Application is no longer pending." };
  await logAdminAction(user.id, decision.status === "approved" ? "dealer_approved" : "dealer_rejected", {
    userId: data[0].user_id,
    reason: decision.status === "rejected" ? decision.reject_reason : undefined,
  });
  return { application: data[0], reviewerId: user.id };
}

// Grants the plan and prefills the storefront from the application. Documents
// are kept as the dealer's business records.
export async function approveDealerApplication(
  applicationId: string,
  plan: string,
  months: number | null,
): Promise<AdminResult> {
  if (!isDealerPlanChoice(plan)) return { error: "Choose a dealer plan." };
  if (!isPlanDuration(months)) return { error: "Unknown duration." };

  const reviewed = await reviewDealerApplication(applicationId, { status: "approved" });
  if ("error" in reviewed) return reviewed;

  const { user_id, business_name, showroom_address } = reviewed.application;
  const supabase = createAdminClient();
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ business_name, showroom_address })
    .eq("id", user_id);
  if (profileError) return { error: "Application approved, but the business details could not be saved." };

  const { error } = await supabase.rpc("set_plan", {
    p_user: user_id,
    p_plan: plan,
    p_expires_at: planExpiryFromNow(months),
    p_changed_by: reviewed.reviewerId,
    p_source: "dealer_application",
  });
  if (error) return { error: "Application approved, but the plan could not be granted." };
  return {};
}

export async function rejectDealerApplication(
  applicationId: string,
  reason: string,
): Promise<AdminResult> {
  const rejectReason = reason.trim();
  if (!rejectReason) return { error: "Give a reason the seller will see." };
  if (rejectReason.length > MAX_REJECT_REASON) {
    return { error: `Keep the reason under ${MAX_REJECT_REASON} characters.` };
  }

  const reviewed = await reviewDealerApplication(applicationId, {
    status: "rejected",
    reject_reason: rejectReason,
  });
  if ("error" in reviewed) return reviewed;

  // Rejected applications don't need their documents; the seller re-uploads
  // if they apply again.
  const { cr_doc_key, vat_doc_key, muroor_doc_key } = reviewed.application;
  const keys = [cr_doc_key, vat_doc_key, muroor_doc_key].filter((key) => key !== null);
  await deleteObjects(keys, PRIVATE_BUCKET).catch((err) =>
    console.error("Failed to delete dealer documents", keys, err),
  );
  return {};
}
