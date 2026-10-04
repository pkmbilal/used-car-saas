import Link from "next/link";
import { requireSeller } from "@/lib/auth";
import { getListingQuota, quotaExceededMessage, quotaSummary } from "@/lib/plans";
import { createListing } from "../actions";
import { ListingForm } from "../listing-form";

export default async function NewListingPage() {
  await requireSeller("/dashboard/listings/new");
  const quota = await getListingQuota();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <Link href="/dashboard" className="text-sm text-zinc-600 dark:text-zinc-400">
        ← Your listings
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Sell your car</h1>
      {quota?.remaining === 0 ? (
        <p className="mt-6 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          {quotaExceededMessage(quota)}{" "}
          <Link href="/pricing" className="font-medium underline">
            See plans
          </Link>
        </p>
      ) : (
        <>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Enter the details first. You&apos;ll add photos and publish on the next step.
          </p>
          {quota && (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{quotaSummary(quota)}</p>
          )}
          <div className="mt-8">
            <ListingForm action={createListing} submitLabel="Continue to photos" />
          </div>
        </>
      )}
    </main>
  );
}
