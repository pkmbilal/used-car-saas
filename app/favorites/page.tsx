import type { Metadata } from "next";
import Link from "next/link";
import { ListingGrid } from "@/components/listing-card";
import { requireUser } from "@/lib/auth";
import { getFavoriteListings } from "@/lib/favorites";

export const metadata: Metadata = {
  title: "Saved cars | Used Car Marketplace",
};

export default async function FavoritesPage() {
  const { user } = await requireUser("/favorites");
  const listings = await getFavoriteListings(user.id);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Saved cars</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Cars that are sold or no longer listed drop off this list.
      </p>

      <div className="mt-8">
        {listings.length === 0 ? (
          <p className="py-12 text-center text-zinc-600 dark:text-zinc-400">
            No saved cars yet.{" "}
            <Link href="/listings" className="font-medium underline">
              Browse cars
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
