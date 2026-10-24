import type { Metadata } from "next";
import Link from "@/components/locale-link";
import { requireSeller } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n-server";
import { getListingQuota, quotaReachedNote, quotaSummary } from "@/lib/plans";
import { createListing } from "../actions";
import { ListingForm } from "../listing-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.dashboard.newPage.metaTitle };
}

export default async function NewListingPage() {
  await requireSeller("/dashboard/listings/new");
  const quota = await getListingQuota();
  const { t, locale } = await getDictionary();
  const p = t.dashboard.newPage;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <Link href="/dashboard" className="text-sm text-zinc-600 dark:text-zinc-400">
        {t.dashboard.backToListings}
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{p.title}</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {p.intro}
      </p>
      {quota && (
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{quotaSummary(t, locale, quota)}</p>
      )}
      {quota?.remaining === 0 && (
        <p className="mt-6 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          {quotaReachedNote(t, quota)}{" "}
          <Link href="/pricing" className="font-medium underline">
            {p.seePlans}
          </Link>
        </p>
      )}
      <div className="mt-8">
        <ListingForm action={createListing} submitLabel={p.submit} />
      </div>
    </main>
  );
}
