import Image from "next/image";
import Link from "next/link";
import { formatKm, formatSAR } from "@/lib/format";
import type { ListingWithImages } from "@/lib/listings";

export function ListingCard({ listing }: { listing: ListingWithImages }) {
  const cover = listing.images[0];

  return (
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
  );
}

export function ListingGrid({
  listings,
  empty = "No cars match your search.",
}: {
  listings: ListingWithImages[];
  empty?: string;
}) {
  if (listings.length === 0) {
    return <p className="py-12 text-center text-zinc-600 dark:text-zinc-400">{empty}</p>;
  }

  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {listings.map((listing) => (
        <li key={listing.id}>
          <ListingCard listing={listing} />
        </li>
      ))}
    </ul>
  );
}
