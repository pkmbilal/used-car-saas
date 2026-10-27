import type { Metadata } from "next";
import Link from "@/components/locale-link";
import { ListingGrid } from "@/components/listing-card";
import { requireUser } from "@/lib/auth";
import { getFavoriteListings } from "@/lib/favorites";
import { getDictionary } from "@/lib/i18n-server";
import { noIndex } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.favorites.metaTitle, robots: noIndex };
}

export default async function FavoritesPage() {
  const { user } = await requireUser("/favorites");
  const listings = await getFavoriteListings(user.id);
  const { t } = await getDictionary();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">{t.favorites.title}</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {t.favorites.intro}
      </p>

      <div className="mt-8">
        {listings.length === 0 ? (
          <p className="py-12 text-center text-zinc-600 dark:text-zinc-400">
            {t.favorites.empty}{" "}
            <Link href="/listings" className="font-medium underline">
              {t.favorites.browseCars}
            </Link>
          </p>
        ) : (
          <ListingGrid
            listings={listings}
            favoriteIds={new Set(listings.map((listing) => listing.id))}
          />
        )}
      </div>
    </main>
  );
}
