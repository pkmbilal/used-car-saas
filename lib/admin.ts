import "server-only";
import { requireAdmin } from "@/lib/auth";
import { isDealerPlanChoice } from "@/lib/dealer-application-options";
import { withImageUrls, type ListingStatus } from "@/lib/listings";
import { SUSPENSION_REMOVAL_REASON } from "@/lib/moderation";
import { FEATURED_ALLOWANCE, isPlan, isPlanDuration, planExpiryFromNow } from "@/lib/plans";
import { deleteObjects, presignGet, PRIVATE_BUCKET } from "@/lib/r2";
import { createAdminClient } from "@/lib/supabase/admin";
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
    .select("id");
  if (error) return { error: "Could not remove the listing. Try again." };
  if (data.length === 0) return { error: "Only live listings can be removed." };

  const { error: reportError } = await supabase
    .from("listing_reports")
    .update({ status: "resolved", resolved_at: new Date().toISOString(), resolved_by: user.id })
    .eq("listing_id", listingId)
    .eq("status", "open");
  if (reportError) return { error: "Listing removed, but its reports could not be closed." };
  return {};
}

export async function restoreListing(listingId: string): Promise<AdminResult> {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data: listing } = await supabase
    .from("listings")
    .select("status, seller:profiles!listings_seller_id_fkey(suspended_at)")
    .eq("id", listingId)
    .maybeSingle();
  if (!listing || listing.status !== "removed") return { error: "Listing is not removed." };
  if (listing.seller?.suspended_at) return { error: "Unsuspend the seller first." };

  const { error } = await supabase
    .from("listings")
    .update({ status: "active", removed_reason: null })
    .eq("id", listingId);
  if (error) return { error: "Could not restore the listing. Try again." };
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
  await requireAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("listings")
    .update({ featured_until: null })
    .eq("id", listingId);
  if (error) return { error: "Could not unfeature the listing. Try again." };
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
  if (listingError) return { error: "User suspended, but their listings could not be hidden." };
  return {};
}

export async function unsuspendUser(userId: string): Promise<AdminResult> {
  await requireAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("profiles")
    .update({ suspended_at: null })
    .eq("id", userId);
  if (error) return { error: "Could not unsuspend the user. Try again." };

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

// Plans are granted by hand until billing lands. set_plan records the change
// in plan_changes; Free never expires.
export async function setUserPlan(
  userId: string,
  plan: string,
  months: number | null,
  note: string,
): Promise<AdminResult> {
  const { user } = await requireAdmin();
  if (!isPlan(plan)) return { error: "Unknown plan." };
  if (!isPlanDuration(months)) return { error: "Unknown duration." };
  if (note.trim().length > MAX_PLAN_NOTE) {
    return { error: `Keep the note under ${MAX_PLAN_NOTE} characters.` };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.rpc("set_plan", {
    p_user: userId,
    p_plan: plan,
    p_expires_at: planExpiryFromNow(months),
    p_changed_by: user.id,
    p_source: "admin",
    p_note: note,
  });
  if (error) return { error: "Could not change the plan. Try again." };
  return {};
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
  await requireAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("profiles")
    .update({ id_verified_at: null })
    .eq("id", userId);
  if (error) return { error: "Could not revoke the badge. Try again." };
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
