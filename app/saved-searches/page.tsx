import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { describeFilters, getSavedSearches, MAX_SAVED_SEARCHES } from "@/lib/saved-searches";
import { deleteSavedSearchAction, openSavedSearchAction } from "./actions";

export const metadata: Metadata = {
  title: "Saved searches | DriveLoop",
};

export default async function SavedSearchesPage() {
  const { user } = await requireUser("/saved-searches");
  const searches = await getSavedSearches(user.id);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Saved searches</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        New cars matching your searches show up here. Save up to {MAX_SAVED_SEARCHES} from the{" "}
        <Link href="/listings" className="underline">
          browse page
        </Link>
        .
      </p>

      {searches.length === 0 ? (
        <p className="py-12 text-center text-zinc-600 dark:text-zinc-400">
          No saved searches yet.{" "}
          <Link href="/listings" className="font-medium underline">
            Browse cars
          </Link>
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {searches.map((search) => (
            <li key={search.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{search.name}</p>
                  {search.newCount > 0 && (
                    <span className="rounded-full bg-green-600 px-2 py-0.5 text-xs font-medium text-white">
                      {search.newCount} new
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {describeFilters(search.filters).join(" · ")}
                </p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <form action={openSavedSearchAction.bind(null, search.id)}>
                  <button
                    type="submit"
                    className="rounded-md bg-zinc-900 px-3 py-1.5 font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
                  >
                    {search.newCount > 0 ? "See new cars" : "Open"}
                  </button>
                </form>
                <form action={deleteSavedSearchAction.bind(null, search.id)}>
                  <button type="submit" className="text-zinc-600 dark:text-zinc-400">
                    Delete
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
