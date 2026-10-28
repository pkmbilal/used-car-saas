"use server";

import { getCurrentUser } from "@/lib/auth";
import { revalidateLocalized } from "@/lib/i18n-server";
import { parseAmount } from "@/lib/offer-limits";
import {
  buyerRespondOffer,
  sellerRespondOffer,
  type BuyerOfferAction,
  type OfferError,
  type SellerOfferAction,
} from "@/lib/offers";

export type OfferActionState = { error?: OfferError };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SELLER_ACTIONS: readonly SellerOfferAction[] = ["accept", "decline", "counter"];
const BUYER_ACTIONS: readonly BuyerOfferAction[] = ["accept", "decline", "withdraw"];

// One form per offer; the pressed button sets "action" (and "counter").
export async function respondToOffer(
  offerId: string,
  side: "seller" | "buyer",
  _prev: OfferActionState,
  formData: FormData,
): Promise<OfferActionState> {
  if (!UUID.test(offerId)) return { error: "offer_not_open" };
  if (!(await getCurrentUser())) return { error: "not_signed_in" };

  const action = formData.get("action");
  let result: { error?: OfferError };
  if (side === "seller") {
    const sellerAction = SELLER_ACTIONS.find((a) => a === action);
    if (!sellerAction) return { error: "failed" };
    let counter: number | null = null;
    if (sellerAction === "counter") {
      counter = parseAmount(formData.get("counter"));
      if (counter === null) return { error: "invalid_amount" };
    }
    result = await sellerRespondOffer(offerId, sellerAction, counter);
  } else {
    const buyerAction = BUYER_ACTIONS.find((a) => a === action);
    if (!buyerAction) return { error: "failed" };
    result = await buyerRespondOffer(offerId, buyerAction);
  }
  if (result.error) return result;

  revalidateLocalized("/offers");
  return {};
}
