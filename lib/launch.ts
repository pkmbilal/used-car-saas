import "server-only";

// Listings (including Verified Dealer) are free until this date. Set
// LAUNCH_FREE_UNTIL (YYYY-MM-DD) in the environment to move it without a code
// change; we promise at least 30 days' notice before any paid plan starts.
const DEFAULT_LAUNCH_FREE_UNTIL = "2027-03-31";

// Midday Riyadh time, so the date reads the same in every timezone.
export function launchFreeUntil(): string {
  const value = process.env.LAUNCH_FREE_UNTIL?.trim();
  const day = value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : DEFAULT_LAUNCH_FREE_UNTIL;
  return `${day}T12:00:00+03:00`;
}
