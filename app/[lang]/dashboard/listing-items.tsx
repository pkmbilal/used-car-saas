import Image from "next/image";
import { Eye, Gauge, MapPin, MessageCircle, Phone } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { RiyalPrice } from "@/components/riyal-price";
import Link from "@/components/locale-link";
import { carName } from "@/lib/car-names";
import { cityName, count, fmt, translateMessage } from "@/lib/dictionary";
import type { Dictionary } from "@/lib/dictionaries";
import { formatDay, formatKm, formatListingStats } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { isFeatured, type ListingStats, type ListingWithImages } from "@/lib/listings";
import { SELF_FEATURE_DAYS } from "@/lib/plans";
import { ListingActions } from "./listings/listing-actions";
import { StatusBadge } from "./listings/status-badge";

type Props = {
  listing: ListingWithImages & { stats: ListingStats };
  featureSlots: number;
  t: Dictionary;
  locale: Locale;
};

const editHref = (id: string) => `/dashboard/listings/${id}/edit`;

export function ListingCardItem({ listing, featureSlots, t, locale }: Props) {
  const cover = listing.images[0];
  const featured = listing.status === "active" && isFeatured(listing);
  const stats: [LucideIcon, string][] = [
    [Eye, count(locale, listing.stats.views, t.common.stats.views)],
    [Phone, count(locale, listing.stats.calls, t.common.stats.calls)],
    [MessageCircle, count(locale, listing.stats.whatsapps, t.common.stats.whatsapps)],
  ];

  return (
    <li className="flex h-full flex-col overflow-hidden rounded-2xl bg-card shadow-[0_2px_10px_rgba(20,30,25,.06)] ring-1 ring-black/5 transition hover:shadow-[0_10px_24px_rgba(20,30,25,.1)] dark:ring-white/10">
      <Link
        href={editHref(listing.id)}
        className="relative block aspect-[3/2] w-full overflow-hidden bg-mint dark:bg-zinc-800"
      >
        {cover && (
          <Image
            src={cover.url}
            alt=""
            fill
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        )}
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/30 to-transparent"
        />
        <span className="absolute top-3 start-3 shadow-sm">
          <StatusBadge status={listing.status} />
        </span>
        {featured && (
          <span className="absolute top-3 end-3 rounded-full bg-lime px-2 py-0.5 text-xs font-semibold text-on-lime shadow-sm">
            {t.common.featured}
          </span>
        )}
      </Link>

      <div className="min-w-0 px-4 pt-3.5">
        <Link href={editHref(listing.id)} className="block truncate font-semibold">
          {carName(locale, listing.make, listing.model, listing.year)}
        </Link>
        <p className="mt-1 text-lg font-bold text-brand">
          <RiyalPrice amount={listing.price} />
        </p>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-600 dark:text-zinc-400">
          <span className="flex items-center gap-1.5">
            <Gauge className="size-3.5" aria-hidden />
            {formatKm(listing.mileage, locale)}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="size-3.5" aria-hidden />
            {cityName(t, listing.city)}
          </span>
        </p>
        <ul className="mt-3 grid grid-cols-3 gap-2">
          {stats.map(([Icon, label]) => (
            <li
              key={label}
              className="flex flex-col items-center gap-1 rounded-xl bg-mint/70 px-1 py-2 text-center text-xs text-ink dark:bg-zinc-800 dark:text-zinc-200"
            >
              <Icon className="size-4 text-brand" aria-hidden />
              <span className="truncate tabular-nums">{label}</span>
            </li>
          ))}
        </ul>
        <ListingNotes listing={listing} t={t} locale={locale} card />
      </div>

      <div className="mt-auto px-4 pt-3.5 pb-3">
        <div className="border-t border-zinc-100 pt-3 dark:border-zinc-800">
          <ListingActions
            listingId={listing.id}
            status={listing.status}
            showEdit
            variant="card"
            featureSlots={featureSlots}
            featureDays={SELF_FEATURE_DAYS}
          />
        </div>
      </div>
    </li>
  );
}

export function ListingListItem({ listing, featureSlots, t, locale }: Props) {
  const cover = listing.images[0];

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-3 py-4">
      <Link
        href={editHref(listing.id)}
        className="relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-md bg-mint sm:w-28 dark:bg-zinc-800"
      >
        {cover && <Image src={cover.url} alt="" fill sizes="112px" className="object-cover" />}
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link href={editHref(listing.id)} className="truncate font-medium">
            {carName(locale, listing.make, listing.model, listing.year)}
          </Link>
          <StatusBadge status={listing.status} />
        </div>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          <RiyalPrice amount={listing.price} /> · {formatKm(listing.mileage, locale)} ·{" "}
          {cityName(t, listing.city)} · {formatListingStats(locale, listing.stats, t.common.stats)}
        </p>
        <ListingNotes listing={listing} t={t} locale={locale} />
      </div>
      <div className="max-sm:basis-full">
        <ListingActions
          listingId={listing.id}
          status={listing.status}
          showEdit
          featureSlots={featureSlots}
          featureDays={SELF_FEATURE_DAYS}
        />
      </div>
    </li>
  );
}

function ListingNotes({
  listing,
  t,
  locale,
  card = false,
}: Omit<Props, "featureSlots"> & { card?: boolean }) {
  const d = t.dashboard;
  return (
    <>
      {listing.status === "active" && listing.featured_until && isFeatured(listing) && (
        <p
          className={`text-amber-700 dark:text-amber-400 ${card ? "mt-3 inline-block rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium dark:bg-amber-950" : "mt-1 text-sm"}`}
        >
          {fmt(d.featuredUntil, { date: formatDay(listing.featured_until, locale) })}
        </p>
      )}
      {listing.status === "removed" && listing.removed_reason && (
        <p
          className={`text-red-700 dark:text-red-400 ${card ? "mt-3 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs dark:bg-red-950" : "mt-1 text-sm"}`}
        >
          {fmt(d.removedReason, { reason: translateMessage(t, listing.removed_reason) })}
        </p>
      )}
    </>
  );
}
