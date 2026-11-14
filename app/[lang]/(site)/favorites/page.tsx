import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import { Bookmark, Heart, Info, MapPin, Search, Tag } from "lucide-react";
import Link from "@/components/locale-link";
import { ListingGrid } from "@/components/listing-card";
import { RiyalPrice } from "@/components/riyal-price";
import { requireUser } from "@/lib/auth";
import { count, formatNumber } from "@/lib/dictionary";
import type { Dictionary } from "@/lib/dictionaries";
import { getFavoriteListings } from "@/lib/favorites";
import { getDictionary } from "@/lib/i18n-server";
import { isRental } from "@/lib/listings";
import { noIndex } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.favorites.metaTitle, robots: noIndex };
}

export default async function FavoritesPage() {
  const { user } = await requireUser("/favorites");
  const listings = await getFavoriteListings(user.id);
  const { t, locale } = await getDictionary();
  const f = t.favorites;

  // Rental prices are daily rates, so "starting from" only compares cars for sale.
  const salePrices = listings.filter((listing) => !isRental(listing)).map((listing) => listing.price);
  const lowestPrice = salePrices.length > 0 ? Math.min(...salePrices) : null;
  const cities = new Set(listings.map((listing) => listing.city)).size;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-forest/5 px-2.5 py-1 text-xs font-semibold tracking-wide text-forest ring-1 ring-forest/15 dark:bg-lime/10 dark:text-lime dark:ring-lime/25">
            <Heart className="size-3.5 fill-current" aria-hidden />
            {listings.length > 0 ? count(locale, listings.length, f.savedCount) : f.eyebrow}
          </span>
          <h1 className="mt-2.5 text-3xl font-bold tracking-tight sm:text-4xl">{f.title}</h1>
          <span
            aria-hidden
            className="mt-3 block h-1 w-12 rounded-full bg-gradient-to-r from-brand to-lime rtl:bg-gradient-to-l"
          />
          <p className="mt-4 max-w-2xl text-zinc-600 dark:text-zinc-400">{f.intro}</p>
        </div>
        {listings.length > 0 && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <PillLink href="/saved-searches" icon={Bookmark} label={f.savedSearches} />
            <PillLink href="/listings" icon={Search} label={f.browseMore} />
          </div>
        )}
      </div>

      {listings.length === 0 ? (
        <EmptyFavorites t={t} />
      ) : (
        <>
          <section className="relative mt-6 overflow-hidden rounded-2xl bg-gradient-to-br from-forest via-forest to-brand p-3 text-white shadow-lg shadow-forest/20 sm:p-5">
            <span
              aria-hidden
              className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-lime/50 to-transparent"
            />
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <StatTile icon={Heart} label={f.statSaved} highlight>
                {formatNumber(locale, listings.length)}
              </StatTile>
              <StatTile icon={Tag} label={f.statFrom}>
                {lowestPrice === null ? "—" : <RiyalPrice amount={lowestPrice} />}
              </StatTile>
              <StatTile icon={MapPin} label={f.statCities}>
                {formatNumber(locale, cities)}
              </StatTile>
            </div>
          </section>

          <div className="mt-8">
            <ListingGrid listings={listings} favoriteIds={new Set(listings.map((listing) => listing.id))} />
          </div>

          <p className="mt-8 flex items-center justify-center gap-2 text-center text-sm text-zinc-500 dark:text-zinc-400">
            <Info className="size-4 shrink-0" aria-hidden />
            {f.footnote}
          </p>
        </>
      )}
    </main>
  );
}

function StatTile({
  icon: Icon,
  label,
  highlight = false,
  children,
}: {
  icon: LucideIcon;
  label: string;
  highlight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`min-w-0 rounded-xl p-2.5 ring-1 backdrop-blur-sm sm:p-3 ${
        highlight ? "bg-lime/15 ring-lime/40" : "bg-white/[0.07] ring-white/15"
      }`}
    >
      <p className="flex items-center gap-1.5 text-xs text-white/70">
        <Icon className={`size-3.5 shrink-0 ${highlight ? "text-lime" : ""}`} aria-hidden />
        <span className="truncate">{label}</span>
      </p>
      <p className="mt-1.5 truncate text-lg font-semibold tracking-tight tabular-nums sm:text-3xl">{children}</p>
    </div>
  );
}

function PillLink({ href, icon: Icon, label }: { href: string; icon: LucideIcon; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-zinc-700 shadow-sm ring-1 ring-zinc-200 transition-colors hover:bg-zinc-50 hover:text-zinc-900 dark:bg-zinc-900 dark:text-zinc-200 dark:ring-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-white"
    >
      <Icon className="size-4" aria-hidden />
      {label}
    </Link>
  );
}

const ctaClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-gradient-to-b from-brand to-forest px-5 text-sm font-semibold text-white shadow-md shadow-forest/25 transition-all hover:text-white hover:shadow-lg hover:shadow-forest/30 hover:brightness-110 focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:outline-none motion-safe:hover:-translate-y-px dark:focus-visible:ring-offset-zinc-950";

function EmptyFavorites({ t }: { t: Dictionary }) {
  const f = t.favorites;
  return (
    <div className="mt-8 flex flex-col items-center rounded-2xl border-2 border-dashed border-line px-6 py-14 text-center dark:border-zinc-800">
      <span className="grid size-16 place-items-center rounded-full bg-mint text-brand dark:bg-lime/10 dark:text-lime">
        <Heart className="size-8" aria-hidden />
      </span>
      <h2 className="mt-5 text-xl font-semibold tracking-tight">{f.emptyTitle}</h2>
      <p className="mt-2 max-w-sm text-zinc-600 dark:text-zinc-400">{f.emptyText}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link href="/listings" className={ctaClass}>
          <Search className="size-4" aria-hidden />
          {f.browseCars}
        </Link>
        <PillLink href="/saved-searches" icon={Bookmark} label={f.savedSearches} />
      </div>
    </div>
  );
}
