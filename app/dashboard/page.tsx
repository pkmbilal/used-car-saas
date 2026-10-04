import Image from "next/image";
import { RiyalPrice } from "@/components/riyal-price";
import Link from "next/link";
import { requireSeller } from "@/lib/auth";
import { formatDay, formatKm, formatListingStats } from "@/lib/format";
import { getSellerListings, isFeatured } from "@/lib/listings";
import {
  getListingQuota,
  isDealerPlan,
  isPlanExpiringSoon,
  PLAN_LABELS,
  quotaSummary,
  SELF_FEATURE_DAYS,
} from "@/lib/plans";
import { ListingActions } from "./listings/listing-actions";
import { StatusBadge } from "./listings/status-badge";

export default async function DashboardPage() {
  const { user, profile } = await requireSeller();
  const [listings, quota] = await Promise.all([getSellerListings(user.id), getListingQuota()]);
  const newListingClass =
    "rounded-md bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900";

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your listings</h1>
          {quota && (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {quotaSummary(quota)}
              {quota.plan !== "showroom" && (
                <>
                  {" · "}
                  <Link href="/pricing" className="underline">
                    Upgrade
                  </Link>
                </>
              )}
              {isDealerPlan(quota.plan) && (
                <>
                  {" · "}
                  <Link href="/account/storefront" className="underline">
                    Edit storefront
                  </Link>
                </>
              )}
            </p>
          )}
        </div>
        {quota?.remaining === 0 ? (
          <span
            aria-disabled="true"
            title="You've reached this month's listing limit"
            className={`${newListingClass} cursor-not-allowed opacity-50`}
          >
            New listing
          </span>
        ) : (
          <div className="flex shrink-0 items-center gap-2">
            {isDealerPlan(profile.plan) && (
              <Link
                href="/dashboard/listings/import"
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
              >
                Import CSV
              </Link>
            )}
            <Link href="/dashboard/listings/new" className={newListingClass}>
              New listing
            </Link>
          </div>
        )}
      </div>

      {quota?.planExpiresAt && isPlanExpiringSoon(quota) && (
        <p className="mt-6 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          Your {PLAN_LABELS[quota.plan]} plan ends on {formatDay(quota.planExpiresAt)}. After that
          you&apos;ll be on the Free plan.{" "}
          <Link href="/pricing" className="font-medium underline">
            Renew your plan
          </Link>
        </p>
      )}

      {profile.suspended_at && (
        <p className="mt-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-900 dark:bg-red-950 dark:text-red-200">
          Your account is suspended. Your listings are hidden from buyers and you can&apos;t
          publish new ones.
        </p>
      )}

      {listings.length === 0 ? (
        <p className="mt-8 text-zinc-600 dark:text-zinc-400">
          You haven&apos;t listed a car yet.{" "}
          <Link href="/dashboard/listings/new" className="font-medium underline">
            Create your first listing
          </Link>
          .
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-zinc-200 dark:divide-zinc-800">
          {listings.map((listing) => {
            const cover = listing.images[0];
            const editHref = `/dashboard/listings/${listing.id}/edit`;
            return (
              <li key={listing.id} className="flex flex-wrap items-center gap-4 py-4">
                <Link
                  href={editHref}
                  className="relative aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800"
                >
                  {cover && (
                    <Image src={cover.url} alt="" fill sizes="112px" className="object-cover" />
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link href={editHref} className="truncate font-medium">
                      {listing.year} {listing.make} {listing.model}
                    </Link>
                    <StatusBadge status={listing.status} />
                  </div>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    <RiyalPrice amount={listing.price} /> · {formatKm(listing.mileage)} ·{" "}
                    {listing.city} · {formatListingStats(listing.stats)}
                  </p>
                  {listing.status === "active" && listing.featured_until && isFeatured(listing) && (
                    <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
                      Featured until {formatDay(listing.featured_until)}
                    </p>
                  )}
                  {listing.status === "removed" && listing.removed_reason && (
                    <p className="mt-1 text-sm text-red-700 dark:text-red-400">
                      Removed by moderators: {listing.removed_reason}
                    </p>
                  )}
                </div>
                <ListingActions
                  listingId={listing.id}
                  status={listing.status}
                  showEdit
                  featureSlots={isFeatured(listing) ? 0 : (quota?.featuredRemaining ?? 0)}
                  featureDays={SELF_FEATURE_DAYS}
                />
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
