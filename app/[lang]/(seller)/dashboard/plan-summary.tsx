import Link from "@/components/locale-link";
import { addonReference, type PendingAddon } from "@/lib/addons";
import { salesWhatsappUrl } from "@/lib/contact";
import { count, fmt } from "@/lib/dictionary";
import type { Dictionary } from "@/lib/dictionaries";
import { formatDay, formatSAR } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import type { SellerListing } from "@/lib/insights";
import { addonPrice, EXTRA_LISTING_PACKS, isPlanExpiringSoon, type ListingQuota } from "@/lib/plans";
import { PlanCard } from "./plan-card";

// The plan card with the extra-listings offer, plus the expiry and suspension
// notices. Shared by the Overview and Plan pages.
export function PlanSummary({
  listings,
  quota,
  pendingAddons,
  suspended,
  showCard = true,
  t,
  locale,
}: {
  listings: SellerListing[];
  quota: ListingQuota | null;
  pendingAddons: PendingAddon[];
  suspended: boolean;
  // false keeps just the notices (the Pro and Showroom overview leads with insights).
  showCard?: boolean;
  t: Dictionary;
  locale: Locale;
}) {
  const d = t.dashboard;
  const pendingExtra = pendingAddons.find((addon) => addon.kind === "extra_listings");
  const pendingRef = pendingExtra ? addonReference(pendingExtra.id) : null;
  const extraListings =
    quota && quota.limit !== null
      ? {
          packs: EXTRA_LISTING_PACKS.map((quantity) => ({
            quantity,
            label: count(locale, quantity, t.addons.pack),
            price: formatSAR(addonPrice("extra_listings", quantity), locale),
          })),
          pending:
            pendingExtra && pendingRef
              ? {
                  note: count(locale, pendingExtra.quantity, t.addons.extraPending, { ref: pendingRef }),
                  whatsappUrl: salesWhatsappUrl(fmt(t.addons.whatsappExtra, { ref: pendingRef })),
                }
              : null,
        }
      : null;
  const openDrafts = listings.filter(
    (listing) => listing.status === "draft" && listing.first_published_at === null,
  ).length;

  return (
    <>
      {suspended && (
        <p className="mt-5 rounded-md bg-red-50 px-4 py-3 text-sm text-red-900 dark:bg-red-950 dark:text-red-200">
          {d.suspended}
        </p>
      )}

      {quota?.planExpiresAt && isPlanExpiringSoon(quota) && (
        <p className="mt-5 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          {fmt(d.planEnding, {
            plan: fmt(t.plans.named, { plan: t.plans.labels[quota.plan] }),
            date: formatDay(quota.planExpiresAt, locale),
          })}{" "}
          <Link href="/pricing" className="font-medium underline">
            {d.renew}
          </Link>
        </p>
      )}

      {showCard && quota && (
        <PlanCard quota={quota} openDrafts={openDrafts} t={t} locale={locale} extraListings={extraListings} />
      )}
    </>
  );
}
