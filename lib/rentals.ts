import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import type { DateRange } from "@/lib/rental-quote";

// Rental date requests (rental_requests migration). Writes go through the
// RPCs, which enforce every rule; lib/rental-quote.ts mirrors them for forms.

type RequestRow = Database["public"]["Tables"]["rental_requests"]["Row"];
export type RentalRequestStatus = RequestRow["status"];
export type OwnerRentalAction = "accept" | "decline";

const RENTAL_ERRORS = [
  "not_signed_in",
  "account_suspended",
  "listing_not_active",
  "not_rent_listing",
  "own_listing",
  "phone_required",
  "invalid_dates",
  "min_days_not_met",
  "dates_unavailable",
  "note_too_long",
  "request_rate_limited",
  "request_already_open",
  "request_not_open",
  "request_not_accepted",
] as const;

// Keys of the dictionary's rentals.errors.
export type RentalError = (typeof RENTAL_ERRORS)[number] | "failed";

function toRentalError(message: string): RentalError {
  return RENTAL_ERRORS.find((code) => code === message) ?? "failed";
}

export async function requestRental(
  listingId: string,
  start: string,
  end: string,
  note: string | null,
): Promise<{ id?: string; error?: RentalError }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("request_rental", {
    p_listing_id: listingId,
    p_start: start,
    p_end: end,
    p_note: note,
  });
  return error ? { error: toRentalError(error.message) } : { id: data };
}

export async function ownerRespondRental(
  requestId: string,
  action: OwnerRentalAction,
  reason?: string | null,
): Promise<{ error?: RentalError }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("owner_respond_rental", {
    p_request_id: requestId,
    p_action: action,
    p_reason: reason ?? undefined,
  });
  return error ? { error: toRentalError(error.message) } : {};
}

export async function renterCancelRental(requestId: string): Promise<{ error?: RentalError }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("renter_cancel_rental", { p_request_id: requestId });
  return error ? { error: toRentalError(error.message) } : {};
}

// The other party's name and phone; only works once the request is accepted.
export async function getRentalContact(
  requestId: string,
): Promise<{ name: string | null; phone: string } | { error: RentalError }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("rental_contact", { p_request_id: requestId });
  if (error) return { error: toRentalError(error.message) };
  const row = data?.[0];
  if (!row?.phone) return { error: "failed" };
  return { name: row.full_name, phone: row.phone };
}

// Accepted, upcoming bookings of a listing (no identities), for the calendar.
export async function getBookedRanges(listingId: string): Promise<DateRange[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("rental_booked_ranges", { p_listing_id: listingId });
  if (error) return [];
  return (data ?? []).map((row) => ({ start: row.start_date, end: row.end_date }));
}

export type RentalRequestListing = {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  status: string;
  category: string;
  equipment_type: string | null;
  imageKey: string | null;
};

export type RentalRequest = {
  id: string;
  startDate: string;
  endDate: string;
  days: number;
  quotedTotal: number;
  note: string | null;
  // The owner's optional message when declining.
  declineReason: string | null;
  status: RentalRequestStatus;
  createdAt: string;
  respondedAt: string | null;
  // Null once the renter can no longer see the listing.
  listing: RentalRequestListing | null;
  otherName: string | null;
};

const LISTING_FIELDS =
  "id, make, model, year, price, status, category, equipment_type, listing_images(r2_key, position)";

type RequestQueryRow = RequestRow & {
  listing: {
    id: string;
    make: string;
    model: string;
    year: number;
    price: number;
    status: string;
    category: string;
    equipment_type: string | null;
    listing_images: { r2_key: string; position: number }[];
  } | null;
  other: { full_name: string | null } | null;
};

function toRequest(row: RequestQueryRow): RentalRequest {
  const cover = row.listing && [...row.listing.listing_images].sort((a, b) => a.position - b.position)[0];
  return {
    id: row.id,
    startDate: row.start_date,
    endDate: row.end_date,
    days: row.days,
    quotedTotal: Number(row.quoted_total),
    note: row.note,
    declineReason: row.decline_reason,
    status: row.status,
    createdAt: row.created_at,
    respondedAt: row.responded_at,
    listing: row.listing && {
      id: row.listing.id,
      make: row.listing.make,
      model: row.listing.model,
      year: row.listing.year,
      price: Number(row.listing.price),
      status: row.listing.status,
      category: row.listing.category,
      equipment_type: row.listing.equipment_type,
      imageKey: cover?.r2_key ?? null,
    },
    otherName: row.other?.full_name ?? null,
  };
}

// Requests on the signed-in user's rental listings, newest first.
export async function getReceivedRentalRequests(userId: string): Promise<RentalRequest[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("rental_requests")
    .select(`*, listing:listings(${LISTING_FIELDS}), other:profiles!rental_requests_renter_id_fkey(full_name)`)
    .eq("owner_id", userId)
    .order("created_at", { ascending: false })
    .limit(200)
    .overrideTypes<RequestQueryRow[], { merge: false }>();
  return (data ?? []).map(toRequest);
}

// Requests the signed-in user has sent, newest first.
export async function getSentRentalRequests(userId: string): Promise<RentalRequest[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("rental_requests")
    .select(`*, listing:listings(${LISTING_FIELDS}), other:profiles!rental_requests_owner_id_fkey(full_name)`)
    .eq("renter_id", userId)
    .order("created_at", { ascending: false })
    .limit(200)
    .overrideTypes<RequestQueryRow[], { merge: false }>();
  return (data ?? []).map(toRequest);
}

export type MyRentalRequest = Pick<RentalRequest, "id" | "startDate" | "endDate" | "days" | "quotedTotal" | "status" | "declineReason">;

// The renter's latest request on a listing, if any.
export async function getMyRequestForListing(
  userId: string,
  listingId: string,
): Promise<MyRentalRequest | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("rental_requests")
    .select("id, start_date, end_date, days, quoted_total, status, decline_reason")
    .eq("renter_id", userId)
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (
    data && {
      id: data.id,
      startDate: data.start_date,
      endDate: data.end_date,
      days: data.days,
      quotedTotal: Number(data.quoted_total),
      status: data.status,
      declineReason: data.decline_reason,
    }
  );
}

// Pending requests waiting on the owner, for the nav badge.
export async function countRentalRequestsAwaitingMe(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("rental_requests")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", userId)
    .eq("status", "pending");
  return count ?? 0;
}

// Pending requests per listing for the owner's dashboard.
export async function getPendingRentalCounts(userId: string): Promise<Map<string, number>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("rental_requests")
    .select("listing_id")
    .eq("owner_id", userId)
    .eq("status", "pending");
  const counts = new Map<string, number>();
  for (const row of data ?? []) counts.set(row.listing_id, (counts.get(row.listing_id) ?? 0) + 1);
  return counts;
}
