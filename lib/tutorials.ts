import "server-only";
import type { Locale } from "@/lib/i18n";
import { publicUrl } from "@/lib/r2";

// Dealer tutorial videos live in the public R2 bucket under
// tutorials/<version>/<locale>/<n>-<slug>.{mp4,jpg}. Re-recorded clips go
// under a new version so cached copies never go stale.
const VERSION = "v2";

export const TUTORIALS = [
  { n: "01", slug: "overview" },
  { n: "02", slug: "listings" },
  { n: "03", slug: "new-listing" },
  { n: "04", slug: "import" },
  { n: "05", slug: "offers" },
  { n: "06", slug: "bookings" },
  { n: "07", slug: "storefront" },
  { n: "08", slug: "plan" },
  { n: "09", slug: "insights" },
] as const;

export type Tutorial = (typeof TUTORIALS)[number];

function key(locale: Locale, { n, slug }: Tutorial, ext: "mp4" | "jpg") {
  return `tutorials/${VERSION}/${locale}/${n}-${slug}.${ext}`;
}

export function tutorialVideo(locale: Locale, tutorial: Tutorial) {
  return publicUrl(key(locale, tutorial, "mp4"));
}

export function tutorialPoster(locale: Locale, tutorial: Tutorial) {
  return publicUrl(key(locale, tutorial, "jpg"));
}
