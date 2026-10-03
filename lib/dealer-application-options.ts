// Dealer application fields and documents, shared by the application form and
// server validation. Keep in sync with the dealer_applications migration.

export const REGISTRATION_NUMBER_MAX = 30;

export const DEALER_DOCS = {
  cr: "Commercial Registration (CR)",
  vat: "VAT certificate",
  muroor: "Muroor certificate",
} as const;

export type DealerDoc = keyof typeof DEALER_DOCS;

export const DEALER_DOC_TYPES = Object.keys(DEALER_DOCS) as DealerDoc[];

export function isDealerDoc(value: unknown): value is DealerDoc {
  return typeof value === "string" && Object.hasOwn(DEALER_DOCS, value);
}

// Plans a dealer can apply for; billing isn't wired up, so a moderator grants them.
export const DEALER_PLANS = ["dealer", "dealer_pro", "showroom"] as const;
export type DealerPlan = (typeof DEALER_PLANS)[number];

export function isDealerPlanChoice(value: unknown): value is DealerPlan {
  return typeof value === "string" && (DEALER_PLANS as readonly string[]).includes(value);
}
