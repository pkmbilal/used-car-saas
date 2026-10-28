import { ArrowUpRight, CircleCheck, Clock, HandCoins, ImagePlus, PhoneOff, Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "@/components/locale-link";
import { carName } from "@/lib/car-names";
import { count, fmt } from "@/lib/dictionary";
import type { Dictionary } from "@/lib/dictionaries";
import { formatDay } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { RECOMMENDED_PHOTOS, type AttentionItem } from "@/lib/insights";

const editHref = (id: string) => `/dashboard/listings/${id}/edit`;

const TINTS: Record<AttentionItem["kind"], string> = {
  pendingOffers: "bg-mint text-brand dark:bg-lime/10 dark:text-lime",
  featuredEnding: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  unusedFeatured: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  noContacts: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  fewPhotos: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
};

export function AttentionList({ items, t, locale }: { items: AttentionItem[]; t: Dictionary; locale: Locale }) {
  const a = t.insights.attention;

  return (
    <section className="rounded-2xl bg-card p-4 shadow-[0_2px_10px_rgba(20,30,25,.06)] ring-1 ring-black/5 sm:p-5 dark:ring-white/10">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        {a.title}
        {items.length > 0 && (
          <span className="grid min-w-6 place-items-center rounded-full bg-amber-100 px-1.5 text-xs leading-6 font-semibold text-amber-800 tabular-nums dark:bg-amber-950 dark:text-amber-200">
            {items.length}
          </span>
        )}
      </h2>
      {items.length === 0 ? (
        <p className="mt-3 flex items-center gap-3 rounded-xl bg-mint px-4 py-3 text-sm font-medium text-forest dark:bg-lime/10 dark:text-lime">
          <CircleCheck className="size-5 shrink-0" aria-hidden />
          {a.none}
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800">
          {items.map((item) => {
            const { icon: Icon, text, href, action } = describe(item, t, locale);
            return (
              <li key={key(item)} className="flex items-start gap-3 py-3.5 first:pt-1 last:pb-0">
                <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${TINTS[item.kind]}`}>
                  <Icon className="size-4" aria-hidden />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <p className="text-sm text-zinc-800 dark:text-zinc-200">{text}</p>
                  <Link
                    href={href}
                    className="inline-flex min-h-9 shrink-0 items-center gap-1 self-start rounded-full border border-line bg-white px-3.5 text-sm font-semibold text-zinc-800 shadow-sm transition-colors hover:border-forest/30 hover:bg-forest/5 print:hidden sm:self-auto dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  >
                    {action}
                    <ArrowUpRight className="size-3.5 rtl:-scale-x-100" aria-hidden />
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function key(item: AttentionItem): string {
  return "listing" in item ? `${item.kind}:${item.listing.id}` : item.kind;
}

function describe(
  item: AttentionItem,
  t: Dictionary,
  locale: Locale,
): { icon: LucideIcon; text: string; href: string; action: string } {
  const a = t.insights.attention;
  switch (item.kind) {
    case "pendingOffers":
      return { icon: HandCoins, text: count(locale, item.count, a.pendingOffers), href: "/dashboard/offers", action: a.reviewOffers };
    case "featuredEnding":
      return {
        icon: Clock,
        text: fmt(a.featuredEnding, {
          car: carName(locale, item.listing.make, item.listing.model, item.listing.year),
          date: formatDay(item.until, locale),
        }),
        href: editHref(item.listing.id),
        action: a.editListing,
      };
    case "unusedFeatured":
      return { icon: Star, text: count(locale, item.count, a.unusedFeatured), href: "/dashboard/listings", action: a.featureListing };
    case "noContacts":
      return {
        icon: PhoneOff,
        text: fmt(a.noContacts, {
          car: carName(locale, item.listing.make, item.listing.model, item.listing.year),
          days: item.days,
        }),
        href: editHref(item.listing.id),
        action: a.editListing,
      };
    case "fewPhotos":
      return {
        icon: ImagePlus,
        text: count(locale, item.photos, a.fewPhotos, {
          car: carName(locale, item.listing.make, item.listing.model, item.listing.year),
          min: RECOMMENDED_PHOTOS,
        }),
        href: editHref(item.listing.id),
        action: a.editListing,
      };
  }
}
