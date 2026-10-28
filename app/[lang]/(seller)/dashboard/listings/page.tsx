import { Plus, Upload } from "lucide-react";
import Link from "@/components/locale-link";
import type { Metadata } from "next";
import { rich } from "@/components/rich-text";
import { getMyPendingAddons } from "@/lib/addons";
import { requireSeller } from "@/lib/auth";
import { count, fmt } from "@/lib/dictionary";
import { getDictionary } from "@/lib/i18n-server";
import { formatRelativeUntil, formatSAR } from "@/lib/format";
import { getSellerListings, isFeatured, type Listing } from "@/lib/listings";
import { getPendingOfferCounts } from "@/lib/offers";
import { addonPrice, getBumpStatus, getListingQuota, isDealerPlan, nextBumpAt } from "@/lib/plans";
import { noIndex } from "@/lib/seo";
import { ListingCardItem, ListingListItem } from "../listing-items";
import { ViewToggle } from "../view-toggle";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.dashboard.metaTitle, robots: noIndex };
}

export default async function ListingsPage({ searchParams }: PageProps<"/[lang]/dashboard/listings">) {
  const { user, profile } = await requireSeller("/dashboard/listings");
  const { t, locale } = await getDictionary();
  const d = t.dashboard;
  const view = (await searchParams).view === "list" ? "list" : "grid";
  const Item = view === "list" ? ListingListItem : ListingCardItem;
  const [listings, quota, pendingAddons, pendingOffers, bumps] = await Promise.all([
    getSellerListings(user.id),
    getListingQuota(),
    getMyPendingAddons(),
    getPendingOfferCounts(user.id),
    getBumpStatus(),
  ]);
  const pendingBoosts = new Set(
    pendingAddons.flatMap((addon) => (addon.kind === "featured_boost" && addon.listingId ? [addon.listingId] : [])),
  );
  const boostLabel = fmt(t.addons.boostShort, { price: formatSAR(addonPrice("featured_boost"), locale) });
  const a = d.actions;
  // Waiting out the cooldown says when; otherwise the monthly refreshes left.
  const bumpButton = (listing: Listing) => {
    if (!bumps) return undefined;
    const next = nextBumpAt(listing.bumped_at, bumps);
    if (next) return { label: fmt(a.refreshAt, { when: formatRelativeUntil(next, locale) }), disabled: true };
    if (bumps.remaining === 0) return { label: a.refreshNoneLeft, disabled: true };
    const label = bumps.remaining === null ? a.refresh : fmt(a.refreshLeft, { left: bumps.remaining });
    return { label, disabled: false };
  };
  const buttonClass =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-full text-sm font-semibold transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none max-sm:flex-1 motion-safe:hover:-translate-y-px dark:focus-visible:ring-offset-zinc-950";

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-forest/5 px-2.5 py-1 text-xs font-semibold tracking-wide text-forest ring-1 ring-forest/15 dark:bg-lime/10 dark:text-lime dark:ring-lime/25">
            <span className="size-1.5 rounded-full bg-brand dark:bg-lime" aria-hidden />
            {count(locale, listings.length, d.listingCount)}
          </span>
          <h1 className="mt-2.5 text-3xl font-bold tracking-tight sm:text-4xl">{d.title}</h1>
          <span
            aria-hidden
            className="mt-3 block h-1 w-12 rounded-full bg-gradient-to-r from-brand to-lime rtl:bg-gradient-to-l"
          />
        </div>
        {/* Drafts are free, so new listings stay open at the limit; publishing is what's capped. */}
        <div className="flex shrink-0 items-center gap-2.5 max-sm:w-full">
          {isDealerPlan(profile.plan) && (
            <Link
              href="/dashboard/listings/import"
              className={`${buttonClass} border border-line bg-white px-5 text-zinc-800 shadow-sm hover:border-forest/30 hover:bg-forest/5 focus-visible:ring-forest/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800`}
            >
              <Upload className="size-4" aria-hidden />
              {d.importCsv}
            </Link>
          )}
          <Link
            href="/dashboard/listings/new"
            className={`${buttonClass} bg-gradient-to-b from-brand to-forest ps-2 pe-5 text-white shadow-md shadow-forest/25 hover:text-white hover:shadow-lg hover:shadow-forest/30 hover:brightness-110 focus-visible:ring-brand/50`}
          >
            <span className="grid size-7 place-items-center rounded-full bg-white/15 ring-1 ring-white/20">
              <Plus className="size-4" aria-hidden />
            </span>
            {d.newListing}
          </Link>
        </div>
      </div>

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
                ? "mt-4 flex flex-col gap-3"
                : "mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            }
          >
            {listings.map((listing) => (
              <Item
                key={listing.id}
                listing={listing}
                featureSlots={isFeatured(listing) ? 0 : (quota?.featuredRemaining ?? 0)}
                boostLabel={isFeatured(listing) ? null : boostLabel}
                boostPending={pendingBoosts.has(listing.id)}
                bump={bumpButton(listing)}
                pendingOffers={pendingOffers.get(listing.id) ?? 0}
                t={t}
                locale={locale}
              />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
