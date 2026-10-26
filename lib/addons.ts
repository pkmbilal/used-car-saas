import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { AddonKind } from "@/lib/plans";

// One-off add-ons (addon_requests migration): sellers request them here and
// an admin approves them once paid (lib/admin.ts).

const REQUEST_ERRORS = ["not_a_seller", "listing_not_active", "invalid_quantity", "addon_already_pending"] as const;

export type AddonRequestError = (typeof REQUEST_ERRORS)[number] | "failed";

// RLS-scoped client; request_addon checks the seller and listing itself.
// Errors come back as keys of the dictionary's addons.errors.
export async function requestAddon(
  kind: AddonKind,
  listingId: string | null,
  quantity: number,
): Promise<{ id?: string; error?: AddonRequestError }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("request_addon", {
    p_kind: kind,
    p_listing_id: listingId,
    p_quantity: quantity,
  });
  if (!error) return { id: data };
  const known = REQUEST_ERRORS.find((code) => code === error.message);
  return { error: known ?? "failed" };
}

export type PendingAddon = {
  id: string;
  kind: AddonKind;
  listingId: string | null;
  quantity: number;
};

// The signed-in seller's open requests, optionally for one listing.
export async function getMyPendingAddons(listingId?: string): Promise<PendingAddon[]> {
  const supabase = await createClient();
  let query = supabase
    .from("addon_requests")
    .select("id, kind, listing_id, quantity")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (listingId) query = query.eq("listing_id", listingId);
  const { data } = await query;
  return (data ?? []).map((row) => ({
    id: row.id,
    kind: row.kind,
    listingId: row.listing_id,
    quantity: row.quantity,
  }));
}

// Short code sellers quote when paying, so admins can match the transfer.
export function addonReference(id: string): string {
  return id.slice(0, 8).toUpperCase();
}
