import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

// Private price offers (listing_offers migration). Writes go through the RPCs,
// which enforce every rule; lib/offer-limits.ts mirrors them for the forms.

type OfferRow = Database["public"]["Tables"]["listing_offers"]["Row"];
export type OfferStatus = OfferRow["status"];
export type SellerOfferAction = "accept" | "decline" | "counter";
export type BuyerOfferAction = "accept" | "decline" | "withdraw";

const OFFER_ERRORS = [
  "not_signed_in",
  "account_suspended",
  "listing_not_active",
  "own_listing",
  "phone_required",
  "offer_too_low",
  "offer_too_high",
  "note_too_long",
  "offer_rate_limited",
  "offer_already_open",
  "offer_not_open",
  "invalid_counter",
  "offer_not_accepted",
] as const;

// Keys of the dictionary's offers.errors.
export type OfferError = (typeof OFFER_ERRORS)[number] | "invalid_amount" | "failed";

function toOfferError(message: string): OfferError {
  return OFFER_ERRORS.find((code) => code === message) ?? "failed";
}

export async function makeOffer(
  listingId: string,
  amount: number,
  note: string | null,
): Promise<{ id?: string; error?: OfferError }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("make_offer", {
    p_listing_id: listingId,
    p_amount: amount,
    p_note: note,
  });
  return error ? { error: toOfferError(error.message) } : { id: data };
}

export async function sellerRespondOffer(
  offerId: string,
  action: SellerOfferAction,
  counter: number | null,
): Promise<{ error?: OfferError }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("seller_respond_offer", {
    p_offer_id: offerId,
    p_action: action,
    p_counter: counter,
  });
  return error ? { error: toOfferError(error.message) } : {};
}

export async function buyerRespondOffer(
  offerId: string,
  action: BuyerOfferAction,
): Promise<{ error?: OfferError }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("buyer_respond_offer", {
    p_offer_id: offerId,
    p_action: action,
  });
  return error ? { error: toOfferError(error.message) } : {};
}

// The other party's name and phone; only works once the offer is accepted.
export async function getOfferContact(
  offerId: string,
): Promise<{ name: string | null; phone: string } | { error: OfferError }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("offer_contact", { p_offer_id: offerId });
  if (error) return { error: toOfferError(error.message) };
  const row = data?.[0];
  if (!row?.phone) return { error: "failed" };
  return { name: row.full_name, phone: row.phone };
}

export type OfferListing = {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  status: string;
  imageKey: string | null;
};

export type Offer = {
  id: string;
  amount: number;
  counterAmount: number | null;
  note: string | null;
  status: OfferStatus;
  createdAt: string;
  respondedAt: string | null;
  // Null once the buyer can no longer see the listing (sold or removed).
  listing: OfferListing | null;
  otherName: string | null;
};

const LISTING_FIELDS = "id, make, model, year, price, status, listing_images(r2_key, position)";

type OfferQueryRow = OfferRow & {
  listing: {
    id: string;
    make: string;
    model: string;
    year: number;
    price: number;
    status: string;
    listing_images: { r2_key: string; position: number }[];
  } | null;
  other: { full_name: string | null } | null;
};

function toOffer(row: OfferQueryRow): Offer {
  const cover = row.listing && [...row.listing.listing_images].sort((a, b) => a.position - b.position)[0];
  return {
    id: row.id,
    amount: row.amount,
    counterAmount: row.counter_amount,
    note: row.note,
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
      imageKey: cover?.r2_key ?? null,
    },
    otherName: row.other?.full_name ?? null,
  };
}

// Offers on the signed-in user's listings, newest first.
export async function getReceivedOffers(userId: string): Promise<Offer[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("listing_offers")
    .select(`*, listing:listings(${LISTING_FIELDS}), other:profiles!listing_offers_buyer_id_fkey(full_name)`)
    .eq("seller_id", userId)
    .order("created_at", { ascending: false })
    .limit(200)
    .overrideTypes<OfferQueryRow[], { merge: false }>();
  return (data ?? []).map(toOffer);
}

// Offers the signed-in user has sent, newest first.
export async function getSentOffers(userId: string): Promise<Offer[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("listing_offers")
    .select(`*, listing:listings(${LISTING_FIELDS}), other:profiles!listing_offers_seller_id_fkey(full_name)`)
    .eq("buyer_id", userId)
    .order("created_at", { ascending: false })
    .limit(200)
    .overrideTypes<OfferQueryRow[], { merge: false }>();
  return (data ?? []).map(toOffer);
}

export type MyOffer = Pick<Offer, "id" | "amount" | "counterAmount" | "status">;

// The buyer's latest offer on a listing, if any.
export async function getMyOfferForListing(userId: string, listingId: string): Promise<MyOffer | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("listing_offers")
    .select("id, amount, counter_amount, status")
    .eq("buyer_id", userId)
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data && { id: data.id, amount: data.amount, counterAmount: data.counter_amount, status: data.status };
}

// Offers waiting on the user: pending ones they received plus counters they
// were sent. Used for the nav badge.
export async function countOffersAwaitingMe(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("listing_offers")
    .select("id", { count: "exact", head: true })
    .or(`and(seller_id.eq.${userId},status.eq.pending),and(buyer_id.eq.${userId},status.eq.countered)`);
  return count ?? 0;
}

// Pending offers per listing for the seller's dashboard.
export async function getPendingOfferCounts(userId: string): Promise<Map<string, number>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("listing_offers")
    .select("listing_id")
    .eq("seller_id", userId)
    .eq("status", "pending");
  const counts = new Map<string, number>();
  for (const row of data ?? []) counts.set(row.listing_id, (counts.get(row.listing_id) ?? 0) + 1);
  return counts;
}
