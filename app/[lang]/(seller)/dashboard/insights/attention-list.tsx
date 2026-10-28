import { CircleCheck, Clock, HandCoins, ImagePlus, PhoneOff, Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "@/components/locale-link";
import { carName } from "@/lib/car-names";
import { count, fmt } from "@/lib/dictionary";
import type { Dictionary } from "@/lib/dictionaries";
import { formatDay } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { RECOMMENDED_PHOTOS, type AttentionItem } from "@/lib/insights";

const editHref = (id: string) => `/dashboard/listings/${id}/edit`;

export function AttentionList({ items, t, locale }: { items: AttentionItem[]; t: Dictionary; locale: Locale }) {
  const a = t.insights.attention;

  return (
    <section className="rounded-2xl bg-card p-4 shadow-[0_2px_10px_rgba(20,30,25,.06)] ring-1 ring-black/5 sm:p-5 dark:ring-white/10">
      <h2 className="text-lg font-semibold">{a.title}</h2>
      {items.length === 0 ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <CircleCheck className="size-4 text-emerald-600" aria-hidden />
          {a.none}
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800">
          {items.map((item) => {
            const { icon: Icon, text, href, action } = describe(item, t, locale);
            return (
              <li key={key(item)} className="flex items-start gap-3 py-3 first:pt-1 last:pb-0">
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                  <Icon className="size-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-zinc-800 dark:text-zinc-200">{text}</p>
                  <Link
                    href={href}
                    className="mt-1 inline-block text-sm font-medium text-forest underline-offset-2 hover:underline print:hidden dark:text-lime"
                  >
                    {action}
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
