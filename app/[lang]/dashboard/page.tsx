import Image from "next/image";
import { RiyalPrice } from "@/components/riyal-price";
import Link from "@/components/locale-link";
import type { Metadata } from "next";
import { rich } from "@/components/rich-text";
import { requireSeller } from "@/lib/auth";
import { carName } from "@/lib/car-names";
import { cityName, fmt, translateMessage } from "@/lib/dictionary";
import { getDictionary } from "@/lib/i18n-server";
import { formatDay, formatKm, formatListingStats } from "@/lib/format";
import { getSellerListings, isFeatured } from "@/lib/listings";
import {
  DRAFT_LIMIT,
  getListingQuota,
  isDealerPlan,
  isPlanExpiringSoon,
  quotaSummary,
  SELF_FEATURE_DAYS,
} from "@/lib/plans";
import { ListingActions } from "./listings/listing-actions";
import { StatusBadge } from "./listings/status-badge";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.dashboard.metaTitle };
}

export default async function DashboardPage() {
  const { user, profile } = await requireSeller();
  const { t, locale } = await getDictionary();
  const d = t.dashboard;
  const [listings, quota] = await Promise.all([getSellerListings(user.id), getListingQuota()]);
  const openDrafts = listings.filter(
    (listing) => listing.status === "draft" && listing.first_published_at === null,
  ).length;
  const newListingClass =
    "rounded-md bg-zinc-900 px-4 py-2.5 text-center text-sm text-white max-sm:flex-1 sm:py-2 dark:bg-zinc-100 dark:text-zinc-900";

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{d.title}</h1>
          {quota && (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {quotaSummary(t, locale, quota)}
              {" · "}
              {fmt(t.plans.draftsUsedOf, { used: openDrafts, limit: DRAFT_LIMIT[quota.plan] })}
              {quota.plan !== "showroom" && (
                <>
                  {" · "}
                  <Link href="/pricing" className="underline">
                    {d.upgrade}
                  </Link>
                </>
              )}
              {isDealerPlan(quota.plan) && (
                <>
                  {" · "}
                  <Link href="/account/storefront" className="underline">
                    {d.editStorefront}
                  </Link>
                </>
              )}
            </p>
          )}
        </div>
        {/* Drafts are free, so new listings stay open at the limit; publishing is what's capped. */}
        <div className="flex shrink-0 items-center gap-2 max-sm:w-full">
          {isDealerPlan(profile.plan) && (
            <Link
              href="/dashboard/listings/import"
              className="rounded-md border border-zinc-300 px-4 py-2.5 text-center text-sm max-sm:flex-1 sm:py-2 dark:border-zinc-700"
            >
              {d.importCsv}
            </Link>
          )}
          <Link href="/dashboard/listings/new" className={newListingClass}>
            {d.newListing}
          </Link>
        </div>
      </div>

      {quota?.planExpiresAt && isPlanExpiringSoon(quota) && (
        <p className="mt-6 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          {fmt(d.planEnding, {
            plan: fmt(t.plans.named, { plan: t.plans.labels[quota.plan] }),
            date: formatDay(quota.planExpiresAt, locale),
          })}{" "}
          <Link href="/pricing" className="font-medium underline">
            {d.renew}
          </Link>
        </p>
      )}

      {profile.suspended_at && (
        <p className="mt-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-900 dark:bg-red-950 dark:text-red-200">
          {d.suspended}
        </p>
      )}

      {listings.length === 0 ? (
        <p className="mt-8 text-zinc-600 dark:text-zinc-400">
          {rich(d.empty, {
            link: (
              <Link href="/dashboard/listings/new" className="font-medium underline">
                {d.createFirst}
              </Link>
            ),
          })}
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
                <div className="min-w-0 flex-1 max-sm:basis-[calc(100%-8rem)]">
                  <div className="flex items-center gap-2">
                    <Link href={editHref} className="truncate font-medium">
                      {carName(locale, listing.make, listing.model, listing.year)}
                    </Link>
                    <StatusBadge status={listing.status} />
                  </div>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    <RiyalPrice amount={listing.price} /> · {formatKm(listing.mileage, locale)} ·{" "}
                    {cityName(t, listing.city)} · {formatListingStats(locale, listing.stats, t.common.stats)}
                  </p>
                  {listing.status === "active" && listing.featured_until && isFeatured(listing) && (
                    <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
                      {fmt(d.featuredUntil, { date: formatDay(listing.featured_until, locale) })}
                    </p>
                  )}
                  {listing.status === "removed" && listing.removed_reason && (
                    <p className="mt-1 text-sm text-red-700 dark:text-red-400">
                      {fmt(d.removedReason, { reason: translateMessage(t, listing.removed_reason) })}
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
