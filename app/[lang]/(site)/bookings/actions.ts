"use server";

import { getCurrentUser } from "@/lib/auth";
import { revalidateLocalized } from "@/lib/i18n-server";
import {
  ownerRespondRental,
  renterCancelRental,
  type OwnerRentalAction,
  type RentalError,
} from "@/lib/rentals";

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
    result = await ownerRespondRental(requestId, action);
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
