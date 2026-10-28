import type { Metadata } from "next";
import Link from "@/components/locale-link";
import { rich } from "@/components/rich-text";
import { requireUser } from "@/lib/auth";
import { fmt } from "@/lib/dictionary";
import { getDictionary } from "@/lib/i18n-server";
import { describeFilters, getSavedSearches, MAX_SAVED_SEARCHES } from "@/lib/saved-searches";
import { deleteSavedSearchAction, openSavedSearchAction } from "./actions";
import { noIndex } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.savedSearches.metaTitle, robots: noIndex };
}

export default async function SavedSearchesPage() {
  const { user } = await requireUser("/saved-searches");
  const searches = await getSavedSearches(user.id);
  const { t, locale } = await getDictionary();
  const s = t.savedSearches;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">{s.title}</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {rich(s.intro, {
          max: MAX_SAVED_SEARCHES,
          browse: (
            <Link href="/listings" className="underline">
              {s.browsePage}
            </Link>
          ),
        })}
      </p>

      {searches.length === 0 ? (
        <p className="py-12 text-center text-zinc-600 dark:text-zinc-400">
          {s.empty}{" "}
          <Link href="/listings" className="font-medium underline">
            {s.browseCars}
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
                      {fmt(s.newCount, { count: search.newCount })}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {describeFilters(search.filters, t, locale).join(" · ")}
                </p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <form action={openSavedSearchAction.bind(null, search.id)}>
                  <button
                    type="submit"
                    className="rounded-md bg-zinc-900 px-3 py-1.5 font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
                  >
                    {search.newCount > 0 ? s.seeNew : s.open}
                  </button>
                </form>
                <form action={deleteSavedSearchAction.bind(null, search.id)}>
                  <button type="submit" className="text-zinc-600 dark:text-zinc-400">
                    {s.delete}
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
