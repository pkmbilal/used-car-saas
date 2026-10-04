// Payments collected outside the site (until gateway billing lands), recorded
// by an admin alongside the plan change they pay for. Shared by the admin
// forms and lib/admin.ts.

export const PAYMENT_METHODS = {
  bank_transfer: "Bank transfer",
  cash: "Cash",
  other: "Other",
} as const;

export type PaymentMethod = keyof typeof PAYMENT_METHODS;

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return typeof value === "string" && value in PAYMENT_METHODS;
}

export type PaymentInput = { amount: number; method: string; reference: string };
