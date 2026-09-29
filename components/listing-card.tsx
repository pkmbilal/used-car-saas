import Image from "next/image";
import Link from "next/link";
import { FavoriteButton } from "@/components/favorite-button";
import { formatKm, formatSAR } from "@/lib/format";
import { isFeatured, type ListingWithImages } from "@/lib/listings";

type CardProps = {
  listing: ListingWithImages;
  // Omit to hide the save button (e.g. the seller's own dashboard).
  favorited?: boolean;
};

export function ListingCard({ listing, favorited }: CardProps) {
  const cover = listing.images[0];

  return (
    <div className="relative">
      <Link href={`/listings/${listing.id}`} className="group flex flex-col gap-2">
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
          {cover && (
            <Image
              src={cover.url}
              alt={`${listing.year} ${listing.make} ${listing.model}`}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform group-hover:scale-105"
            />
          )}
          {isFeatured(listing) && (
            <span className="absolute top-2 left-2 rounded-full bg-amber-400 px-2 py-0.5 text-xs font-semibold text-amber-950">
              Featured
            </span>
          )}
        </div>
        <div>
          <p className="font-medium">
            {listing.year} {listing.make} {listing.model}
          </p>
          <p className="font-semibold">{formatSAR(listing.price)}</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {formatKm(listing.mileage)} · {listing.city}
          </p>
        </div>
      </Link>
      {favorited !== undefined && (
        <FavoriteButton
          listingId={listing.id}
          favorited={favorited}
          className="absolute top-2 right-2"
        />
      )}
    </div>
  );
}

export function ListingGrid({
  listings,
  empty = "No cars match your search.",
  favoriteIds,
}: {
  listings: ListingWithImages[];
  empty?: string;
  // Pass (even an empty set) to show save buttons on each card.
  favoriteIds?: Set<string>;
}) {
  if (listings.length === 0) {
    return <p className="py-12 text-center text-zinc-600 dark:text-zinc-400">{empty}</p>;
  }

  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {listings.map((listing) => (
        <li key={listing.id}>
          <ListingCard listing={listing} favorited={favoriteIds?.has(listing.id)} />
        </li>
      ))}
    </ul>
  );
}
