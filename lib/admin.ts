import "server-only";
import { requireAdmin } from "@/lib/auth";
import { withImageUrls, type ListingStatus } from "@/lib/listings";
import { SUSPENSION_REMOVAL_REASON } from "@/lib/moderation";
import { isPlan } from "@/lib/plans";
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
      "id, reason, details, created_at, listing:listings(*, listing_images(*), seller:profiles(id, full_name))",
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

export async function getAllListings(filters: {
  status?: ListingStatus;
  q?: string;
  page: number;
}) {
  await requireAdmin();
  const supabase = createAdminClient();
  let query = supabase
    .from("listings")
    .select("*, listing_images(*), seller:profiles(id, full_name)", { count: "exact" });

  if (filters.status) query = query.eq("status", filters.status);
  const q = searchTerm(filters.q);
  if (q) query = query.or(`make.ilike.%${q}%,model.ilike.%${q}%`);

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(...range(filters.page));
  // Out-of-range pages error in PostgREST; treat them as empty.
  if (error) return { listings: [], total: count ?? 0 };
  return { listings: data.map(withImageUrls), total: count ?? 0 };
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
    .select("status, seller:profiles(suspended_at)")
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

// Plans are granted by hand until billing lands.
export async function setUserPlan(userId: string, plan: string): Promise<AdminResult> {
  await requireAdmin();
  if (!isPlan(plan)) return { error: "Unknown plan." };

  const supabase = createAdminClient();
  const { error } = await supabase.from("profiles").update({ plan }).eq("id", userId);
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
