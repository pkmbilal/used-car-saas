import Link from "next/link";
import { requireSeller } from "@/lib/auth";
import { createListing } from "../actions";
import { ListingForm } from "../listing-form";

export default async function NewListingPage() {
  await requireSeller("/dashboard/listings/new");

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <Link href="/dashboard" className="text-sm text-zinc-600 dark:text-zinc-400">
        ← Your listings
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Sell your car</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Enter the details first. You&apos;ll add photos and publish on the next step.
      </p>
      <div className="mt-8">
        <ListingForm action={createListing} submitLabel="Continue to photos" />
      </div>
    </main>
  );
}
