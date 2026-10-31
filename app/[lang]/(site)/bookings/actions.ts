"use server";

import { getCurrentUser } from "@/lib/auth";
import { revalidateLocalized } from "@/lib/i18n-server";
import {
  ownerRespondRental,
  renterCancelRental,
  type OwnerRentalAction,
  type RentalError,
} from "@/lib/rentals";
import { MAX_RENTAL_NOTE } from "@/lib/rental-quote";

export type RentalActionState = { error?: RentalError };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const OWNER_ACTIONS: readonly OwnerRentalAction[] = ["accept", "decline"];

// One form per request; the pressed button sets "action".
export async function respondToRental(
  requestId: string,
  side: "owner" | "renter",
  _prev: RentalActionState,
  formData: FormData,
): Promise<RentalActionState> {
  if (!UUID.test(requestId)) return { error: "request_not_open" };
  if (!(await getCurrentUser())) return { error: "not_signed_in" };

  let result: { error?: RentalError };
  if (side === "owner") {
    const action = OWNER_ACTIONS.find((a) => a === formData.get("action"));
    if (!action) return { error: "failed" };
    const raw = formData.get("reason");
    const reason = action === "decline" && typeof raw === "string" ? raw.trim() : "";
    if (reason.length > MAX_RENTAL_NOTE) return { error: "note_too_long" };
    result = await ownerRespondRental(requestId, action, reason || null);
  } else {
    if (formData.get("action") !== "cancel") return { error: "failed" };
    result = await renterCancelRental(requestId);
  }
  if (result.error) return result;

  revalidateLocalized("/bookings");
  revalidateLocalized("/dashboard", "layout");
  // Accepting or cancelling changes the listing's booked dates.
  revalidateLocalized("/listings", "layout");
  return {};
}
