import type { Metadata } from "next";
import { AlertTriangle, ChevronLeft } from "lucide-react";
import Link from "@/components/locale-link";
import { requireSeller } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n-server";
import {
  draftLimitMessage,
  getDraftUsage,
  getListingQuota,
  quotaReachedNote,
  quotaSummary,
} from "@/lib/plans";
import { createListing } from "../actions";
import { ListingForm } from "../listing-form";
import { noIndex } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.dashboard.newPage.metaTitle, robots: noIndex };
}

const noticeClass =
  "mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950 dark:text-amber-200";

export default async function NewListingPage() {
  const { user, profile } = await requireSeller("/dashboard/listings/new");
  const [quota, drafts] = await Promise.all([
    getListingQuota(),
    getDraftUsage(user.id, profile.plan),
  ]);
  const { t, locale } = await getDictionary();
  const p = t.dashboard.newPage;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <Link
        href="/dashboard/listings"
        className="inline-flex items-center gap-1 text-sm text-zinc-600 transition-colors hover:text-forest dark:text-zinc-400 dark:hover:text-lime"
      >
        <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden />
        {t.dashboard.backToListings}
      </Link>

      <div className="mt-4">
        {quota && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-forest/5 px-2.5 py-1 text-xs font-semibold tracking-wide text-forest ring-1 ring-forest/15 dark:bg-lime/10 dark:text-lime dark:ring-lime/25">
            <span className="size-1.5 rounded-full bg-brand dark:bg-lime" aria-hidden />
            {quotaSummary(t, locale, quota)}
          </span>
        )}
        <h1 className="mt-2.5 text-3xl font-bold tracking-tight sm:text-4xl">{p.title}</h1>
        <span
          aria-hidden
          className="mt-3 block h-1 w-12 rounded-full bg-gradient-to-r from-brand to-lime rtl:bg-gradient-to-l"
        />
        <p className="mt-4 max-w-2xl text-zinc-600 dark:text-zinc-400">{p.intro}</p>
      </div>

      {drafts.remaining === 0 && (
        <p className={noticeClass}>
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            {draftLimitMessage(t, drafts)}{" "}
            <Link href="/dashboard/listings" className="font-medium underline">
              {t.dashboard.backToListings}
            </Link>
          </span>
        </p>
      )}
      {quota?.remaining === 0 && (
        <p className={noticeClass}>
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            {quotaReachedNote(t, quota)}{" "}
            <Link href="/dashboard#extra-listings" className="font-medium underline">
              {t.addons.buyExtra}
            </Link>
            {" · "}
            <Link href="/pricing" className="font-medium underline">
              {p.seePlans}
            </Link>
          </span>
        </p>
      )}

      <div className="mt-8">
        <ListingForm action={createListing} submitLabel={p.submit} />
      </div>
    </div>
  );
}
