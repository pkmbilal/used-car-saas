// Rental pricing and request limits, shared by the request form and the
// server. Must match public.rental_quote and request_rental in
// supabase/migrations/*_rental_requests.sql.

export const MAX_RENTAL_NOTE = 500;
export const MAX_RENTAL_DAYS = 365;

export type RentalRates = {
  daily: number;
  weekly: number | null;
  monthly: number | null;
};

// The price of `days` days, using whole months (30 days) and weeks where the
// listing has those rates; leftover days never cost more than one more
// week/month.
export function quoteRental({ daily, weekly, monthly }: RentalRates, days: number): number {
  const rest = monthly === null ? days : days % 30;
  const restCost =
    weekly === null ? rest * daily : Math.floor(rest / 7) * weekly + Math.min((rest % 7) * daily, weekly);
  if (monthly === null) return restCost;
  return Math.floor(days / 30) * monthly + Math.min(restCost, monthly);
}

// "YYYY-MM-DD" in Saudi time, the calendar the database checks dates against.
export function todayInRiyadh(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh" }).format(new Date());
}

const DAY_MS = 24 * 60 * 60 * 1000;

// Inclusive day count between two "YYYY-MM-DD" dates; 0 if the range is invalid.
export function rentalDays(start: string, end: string): number {
  const from = Date.parse(`${start}T00:00:00Z`);
  const to = Date.parse(`${end}T00:00:00Z`);
  if (Number.isNaN(from) || Number.isNaN(to) || to < from) return 0;
  return Math.round((to - from) / DAY_MS) + 1;
}

export function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

export type DateRange = { start: string; end: string };

export function overlapsAny(range: DateRange, booked: DateRange[]): boolean {
  return booked.some((b) => range.start <= b.end && b.start <= range.end);
}
