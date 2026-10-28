// Offer rules shared by the offer forms and server actions. They must match
// public.make_offer and public.seller_respond_offer.

export const MAX_OFFER_NOTE = 500;

// Half the asking price, rounded up; must match public.make_offer.
export function minOffer(price: number): number {
  return Math.ceil(price / 2);
}

// Whole riyals only; Arabic-Indic digits and separators are accepted.
export function parseAmount(value: FormDataEntryValue | null): number | null {
  const digits = String(value ?? "")
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[,\s٬]/g, "");
  if (!/^\d{1,9}$/.test(digits)) return null;
  const amount = Number(digits);
  return amount > 0 ? amount : null;
}
