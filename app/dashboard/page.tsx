import Image from "next/image";
import Link from "next/link";
import { requireSeller } from "@/lib/auth";
import { formatSAR } from "@/lib/format";
import { getSellerListings } from "@/lib/listings";
import { ListingActions } from "./listings/listing-actions";
import { StatusBadge } from "./listings/status-badge";

const numberFormatter = new Intl.NumberFormat("en-US");

export default async function DashboardPage() {
  const { user } = await requireSeller();
  const listings = await getSellerListings(user.id);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Your listings</h1>
        <Link
          href="/dashboard/listings/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          New listing
        </Link>
      </div>

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
                    {formatSAR(listing.price)} · {numberFormatter.format(listing.mileage)} km ·{" "}
                    {listing.city}
                  </p>
                </div>
                <ListingActions listingId={listing.id} status={listing.status} showEdit />
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
