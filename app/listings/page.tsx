import type { Metadata } from "next";
import Link from "next/link";
import { ListingGrid } from "@/components/listing-card";
import { PAGE_SIZE, parseListingFilters, searchListings } from "@/lib/listings";
import { Filters } from "./filters";

export const metadata: Metadata = {
  title: "Browse used cars | Used Car Marketplace",
};

export default async function ListingsPage({ searchParams }: PageProps<"/listings">) {
  const params = await searchParams;
  const filters = parseListingFilters(params);
  const { listings, total } = await searchListings(filters);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Keep the current filters when paging.
  function pageHref(page: number) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "string" && value !== "" && key !== "page") query.set(key, value);
    }
    if (page > 1) query.set("page", String(page));
    const search = query.toString();
    return search ? `/listings?${search}` : "/listings";
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Used cars for sale</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {total === 1 ? "1 car" : `${total} cars`}
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[16rem_1fr]">
        <aside>
          <Filters filters={filters} />
        </aside>
        <section>
          <ListingGrid listings={listings} />
          {pageCount > 1 && (
            <nav className="mt-10 flex items-center justify-center gap-6 text-sm">
              {filters.page > 1 ? (
                <Link href={pageHref(filters.page - 1)} className="font-medium">
                  ← Previous
                </Link>
              ) : (
                <span className="text-zinc-400">← Previous</span>
              )}
              <span className="text-zinc-600 dark:text-zinc-400">
                Page {filters.page} of {pageCount}
              </span>
              {filters.page < pageCount ? (
                <Link href={pageHref(filters.page + 1)} className="font-medium">
                  Next →
                </Link>
              ) : (
                <span className="text-zinc-400">Next →</span>
              )}
            </nav>
          )}
        </section>
      </div>
    </main>
  );
}
