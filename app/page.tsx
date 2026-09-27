import Link from "next/link";
import { ListingGrid } from "@/components/listing-card";
import { getViewerFavoriteIds } from "@/lib/favorites";
import { getLatestListings } from "@/lib/listings";

export default async function Home() {
  const [listings, favoriteIds] = await Promise.all([
    getLatestListings(8),
    getViewerFavoriteIds(),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12">
      <section className="py-8">
        <h1 className="text-3xl font-semibold tracking-tight">Find your next car</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Used cars from sellers across Saudi Arabia.
        </p>
        <Link
          href="/listings"
          className="mt-6 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Browse all cars
        </Link>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium">Latest listings</h2>
          <Link href="/listings" className="text-sm font-medium">
            See all →
          </Link>
        </div>
        <ListingGrid listings={listings} empty="No cars listed yet." favoriteIds={favoriteIds} />
      </section>
    </main>
  );
}
