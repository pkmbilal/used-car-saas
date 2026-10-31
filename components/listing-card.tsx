import Image from "next/image";
import Link from "@/components/locale-link";
import { FavoriteButton } from "@/components/favorite-button";
import { ArrowRight, BadgeCheck, Car, Construction, Fuel, MapPin } from "lucide-react";
import { RiyalPrice } from "@/components/riyal-price";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { listingName } from "@/lib/car-names";
import { equipmentTypeName } from "@/lib/equipment";
import { formatHours, formatKm } from "@/lib/format";
import { getDictionary } from "@/lib/i18n-server";
import { isFeatured, isRental, type ListingWithImages } from "@/lib/listings";
import { cityName, optionLabel } from "@/lib/dictionary";

type CardProps = {
  listing: ListingWithImages;
  // Omit to hide the save button (e.g. the seller's own dashboard).
  favorited?: boolean;
  sizes?: string;
};

export async function ListingCard({ listing, favorited, sizes }: CardProps) {
  const { t, locale } = await getDictionary();
  const cover = listing.images[0];

  return (
    <div className="group relative h-full">
      <Card className="h-full gap-0 rounded-lg py-0 text-ink shadow-[0_2px_10px_rgba(20,30,25,.05)] ring-0 transition group-hover:-translate-y-0.5 group-hover:shadow-[0_10px_24px_rgba(20,30,25,.1)]">
        <Link
          href={`/listings/${listing.id}`}
          className="flex h-full flex-col hover:text-ink"
        >
          <div className="relative aspect-[3/2] bg-mint">
            {cover && (
              <Image
                src={cover.url}
                alt={listingName(locale, listing, listing.year)}
                fill
                sizes={
                  sizes ??
                  "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                }
                className="object-cover"
              />
            )}
            {(listing.sellerType || listing.sellerIdVerified) && (
              <div className="absolute bottom-3 start-3 flex flex-wrap gap-1.5">
                {listing.sellerType && (
                  <Badge
                    className={`text-caption font-semibold ${
                      listing.sellerType === "dealer" ? "bg-charcoal text-lime" : "bg-white/90 text-ink"
                    }`}
                  >
                    {listing.sellerType === "dealer" ? t.common.dealer : t.common.privateSeller}
                  </Badge>
                )}
                {listing.sellerIdVerified && (
                  <Badge title={t.verification.idVerifiedTitle} className="bg-mint text-caption font-semibold text-brand">
                    <BadgeCheck />
                    {t.verification.idVerified}
                  </Badge>
                )}
              </div>
            )}
            {(isFeatured(listing) || isRental(listing)) && (
              <div className="absolute top-3 start-3 flex gap-1.5">
                {isFeatured(listing) && (
                  <Badge className="bg-lime text-caption font-semibold text-on-lime">{t.common.featured}</Badge>
                )}
                {isRental(listing) && (
                  <Badge className="bg-brand text-caption font-semibold text-white">{t.rentals.rentBadge}</Badge>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-1 flex-col px-4 pt-3.5 pb-4">
            <p className="truncate text-sm font-semibold">
              {listingName(locale, listing)}
            </p>
            <p className="mt-2 flex flex-wrap gap-x-2 text-caption text-muted-foreground">
              <span>{listing.year}</span>
              {listing.mileage !== null && (
                <>
                  <span aria-hidden>·</span>
                  <span>{formatKm(listing.mileage, locale)}</span>
                </>
              )}
              {listing.operating_hours !== null && (
                <>
                  <span aria-hidden>·</span>
                  <span>{formatHours(listing.operating_hours, locale)}</span>
                </>
              )}
              {listing.operator_included && (
                <>
                  <span aria-hidden>·</span>
                  <span>{t.equipment.withOperator}</span>
                </>
              )}
              {listing.transmission && (
                <>
                  <span aria-hidden>·</span>
                  <span>{optionLabel(t.options.transmission, listing.transmission)}</span>
                </>
              )}
            </p>
            <p className="mt-3 text-base font-bold sm:text-[0.9375rem] text-brand">
              <RiyalPrice amount={listing.price} />
              {isRental(listing) && (
                <span className="ms-1 text-caption font-medium text-muted-foreground">{t.rentals.perDay}</span>
              )}
            </p>
            <div className="mt-auto flex items-center gap-4 pt-3 text-caption text-muted-foreground">
              {listing.equipment_type && (
                <span className="flex items-center gap-1.5">
                  <Construction className="size-3.5 sm:size-3" />
                  {equipmentTypeName(locale, listing.equipment_type)}
                </span>
              )}
              {listing.body_type && (
                <span className="flex items-center gap-1.5">
                  <Car className="size-3.5 sm:size-3" />
                  {optionLabel(t.options.bodyType, listing.body_type)}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Fuel className="size-3.5 sm:size-3" />
                {optionLabel(t.options.fuel, listing.fuel_type)}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="size-3.5 sm:size-3" />
                {cityName(t, listing.city)}
              </span>
              <span className="ms-auto flex size-5 items-center justify-center rounded-full border border-ink/80 transition group-hover:border-brand group-hover:bg-brand group-hover:text-white">
                <ArrowRight className="size-2.5" strokeWidth={2.6} />
              </span>
            </div>
          </div>
        </Link>
      </Card>
      {favorited !== undefined && (
        <FavoriteButton
          listingId={listing.id}
          favorited={favorited}
          className="absolute top-2.5 end-2.5"
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

export async function ListingGrid({
  listings,
  empty,
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
    // Pass "" to render nothing.
    const { t } = await getDictionary();
    const message = empty ?? t.listing.noMatches;
    return message ? <p className="py-12 text-center text-muted-foreground">{message}</p> : null;
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
