"use server";

import { getCurrentUser } from "@/lib/auth";
import { revealSellerPhone, type RevealResult } from "@/lib/contact-reveal";
import { revalidateLocalized } from "@/lib/i18n-server";
import { isContactKind, recordListingContact, recordListingView } from "@/lib/listings";
import { parseReport } from "@/lib/moderation";
import { MAX_OFFER_NOTE, parseAmount } from "@/lib/offer-limits";
import { makeOffer, type OfferError } from "@/lib/offers";
import { createClient } from "@/lib/supabase/server";

// "signin" tells the client to send the visitor to the login page.
export type ReportState = { error?: "signin" | string; sent?: boolean };

export async function reportListing(
  listingId: string,
  _prev: ReportState,
  formData: FormData,
): Promise<ReportState> {
  const current = await getCurrentUser();
  if (!current) return { error: "signin" };

  const parsed = parseReport(formData);
  if ("error" in parsed) return { error: parsed.error };

  // RLS rejects reports on the reporter's own or non-live listings.
  const supabase = await createClient();
  const { error } = await supabase
    .from("listing_reports")
    .insert({ ...parsed.data, listing_id: listingId, reporter_id: current.user.id });
  if (error?.code === "23505") return { error: "You've already reported this listing." };
  if (error) return { error: "Could not send the report. Try again." };

  return { sent: true };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The RPC only counts active listings and skips the seller's own views.
export async function recordView(listingId: string): Promise<void> {
  if (!UUID.test(listingId)) return;
  await recordListingView(listingId);
}

// Same rules as recordView, for Call / WhatsApp taps.
export async function recordContact(listingId: string, kind: string): Promise<void> {
  if (!UUID.test(listingId) || !isContactKind(kind)) return;
  await recordListingContact(listingId, kind);
}

// Click-to-reveal for seller numbers; rate limited per IP in the database.
export async function revealPhone(sellerId: string): Promise<RevealResult> {
  if (!UUID.test(sellerId)) return { error: "unavailable" };
  return revealSellerPhone(sellerId);
}

// "signin" tells the client to send the visitor to the login page.
export type OfferState = { error?: "signin" | OfferError; sent?: boolean };

export async function sendOffer(
  listingId: string,
  _prev: OfferState,
  formData: FormData,
): Promise<OfferState> {
  if (!UUID.test(listingId)) return { error: "listing_not_active" };
  const current = await getCurrentUser();
  if (!current) return { error: "signin" };

  const amount = parseAmount(formData.get("amount"));
  if (amount === null) return { error: "invalid_amount" };
  const note = String(formData.get("note") ?? "").trim();
  if (note.length > MAX_OFFER_NOTE) return { error: "note_too_long" };

  const result = await makeOffer(listingId, amount, note || null);
  if (result.error) return { error: result.error };

  revalidateLocalized(`/listings/${listingId}`);
  revalidateLocalized("/offers");
  revalidateLocalized("/dashboard", "layout");
  return { sent: true };
}
