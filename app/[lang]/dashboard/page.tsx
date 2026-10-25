import Link from "@/components/locale-link";
import type { Metadata } from "next";
import { rich } from "@/components/rich-text";
import { requireSeller } from "@/lib/auth";
import { fmt } from "@/lib/dictionary";
import { getDictionary } from "@/lib/i18n-server";
import { formatDay } from "@/lib/format";
import { getSellerListings, isFeatured } from "@/lib/listings";
import { getListingQuota, isDealerPlan, isPlanExpiringSoon } from "@/lib/plans";
import { ListingCardItem, ListingListItem } from "./listing-items";
import { PlanCard } from "./plan-card";
import { ViewToggle } from "./view-toggle";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.dashboard.metaTitle };
}

export default async function DashboardPage({ searchParams }: PageProps<"/[lang]/dashboard">) {
  const { user, profile } = await requireSeller();
  const { t, locale } = await getDictionary();
  const d = t.dashboard;
  const view = (await searchParams).view === "list" ? "list" : "grid";
  const Item = view === "list" ? ListingListItem : ListingCardItem;
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

      {quota && <PlanCard quota={quota} openDrafts={openDrafts} t={t} locale={locale} />}

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
        <>
          <div className="mt-8 flex justify-end">
            <ViewToggle view={view} t={t} />
          </div>
          <ul
            className={
              view === "list"
                ? "mt-2 divide-y divide-zinc-200 dark:divide-zinc-800"
                : "mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            }
          >
            {listings.map((listing) => (
              <Item
                key={listing.id}
                listing={listing}
                featureSlots={isFeatured(listing) ? 0 : (quota?.featuredRemaining ?? 0)}
                t={t}
                locale={locale}
              />
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
