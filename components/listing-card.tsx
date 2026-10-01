import Image from "next/image";
import Link from "next/link";
import { FavoriteButton } from "@/components/favorite-button";
import { ArrowRightIcon, FuelIcon, PinIcon } from "@/components/icons";
import { formatKm, formatSAR } from "@/lib/format";
import { capitalize } from "@/lib/listing-options";
import { isFeatured, type ListingWithImages } from "@/lib/listings";

type CardProps = {
  listing: ListingWithImages;
  // Omit to hide the save button (e.g. the seller's own dashboard).
  favorited?: boolean;
  sizes?: string;
};

export function ListingCard({ listing, favorited, sizes }: CardProps) {
  const cover = listing.images[0];

  return (
    <div className="group relative h-full">
      <Link
        href={`/listings/${listing.id}`}
        className="flex h-full flex-col overflow-hidden rounded-lg bg-white text-ink shadow-[0_2px_10px_rgba(20,30,25,.05)] transition hover:-translate-y-0.5 hover:text-ink hover:shadow-[0_10px_24px_rgba(20,30,25,.1)]"
      >
        <div className="relative aspect-[3/2] bg-mint">
          {cover && (
            <Image
              src={cover.url}
              alt={`${listing.year} ${listing.make} ${listing.model}`}
              fill
              sizes={sizes ?? "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"}
              className="object-cover"
            />
          )}
          {isFeatured(listing) && (
            <span className="absolute top-3 left-3 rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-semibold text-on-accent">
              Featured
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col px-4 pt-3.5 pb-4">
          <p className="truncate text-sm font-semibold">
            {listing.make} {listing.model}
          </p>
          <p className="mt-2 flex flex-wrap gap-x-2 text-[11px] text-muted">
            <span>{listing.year}</span>
            <span aria-hidden>·</span>
            <span>{formatKm(listing.mileage)}</span>
          </p>
          <p className="mt-3 text-[15px] font-bold text-brand">{formatSAR(listing.price)}</p>
          <div className="mt-auto flex items-center gap-4 pt-3 text-[11px] text-muted">
            <span className="flex items-center gap-1.5">
              <FuelIcon size={12} strokeWidth={1.8} />
              {capitalize(listing.fuel_type)}
            </span>
            <span className="flex items-center gap-1.5">
              <PinIcon size={12} strokeWidth={1.8} />
              {listing.city}
            </span>
            <span className="ml-auto flex size-5 items-center justify-center rounded-full border border-ink/80 transition group-hover:border-brand group-hover:bg-brand group-hover:text-white">
              <ArrowRightIcon size={10} strokeWidth={2.6} />
            </span>
          </div>
        </div>
      </Link>
      {favorited !== undefined && (
        <FavoriteButton
          listingId={listing.id}
          favorited={favorited}
          className="absolute top-2.5 right-2.5"
        />
      )}
    </div>
  );
}

const gridColumns = {
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
} as const;

const gridSizes = {
  3: "(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw",
  4: "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw",
} as const;

export function ListingGrid({
  listings,
  empty = "No cars match your search.",
  favoriteIds,
  columns = 4,
}: {
  listings: ListingWithImages[];
  empty?: string;
  // Pass (even an empty set) to show save buttons on each card.
  favoriteIds?: Set<string>;
  columns?: keyof typeof gridColumns;
}) {
  if (listings.length === 0) {
    return empty ? <p className="py-12 text-center text-muted">{empty}</p> : null;
  }

  return (
    <ul className={`grid gap-4 lg:gap-5 ${gridColumns[columns]}`}>
      {listings.map((listing) => (
        <li key={listing.id}>
          <ListingCard
            listing={listing}
            favorited={favoriteIds?.has(listing.id)}
            sizes={gridSizes[columns]}
          />
        </li>
      ))}
    </ul>
  );
}
