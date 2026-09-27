import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSeller } from "@/lib/auth";
import { getSellerListing } from "@/lib/listings";
import { updateListing } from "../../actions";
import { ListingActions } from "../../listing-actions";
import { ListingForm } from "../../listing-form";
import { StatusBadge } from "../../status-badge";
import { PhotoManager } from "./photo-manager";

export default async function EditListingPage({
  params,
}: PageProps<"/dashboard/listings/[id]/edit">) {
  const { id } = await params;
  const { user } = await requireSeller(`/dashboard/listings/${id}/edit`);
  const listing = await getSellerListing(user.id, id);
  if (!listing) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <Link href="/dashboard" className="text-sm text-zinc-600 dark:text-zinc-400">
        ← Your listings
      </Link>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            {listing.year} {listing.make} {listing.model}
          </h1>
          <StatusBadge status={listing.status} />
        </div>
        <ListingActions listingId={listing.id} status={listing.status} />
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-medium">Photos</h2>
        <PhotoManager
          listingId={listing.id}
          photos={listing.images.map(({ id, url }) => ({ id, url }))}
        />
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-medium">Details</h2>
        <ListingForm
          listing={listing}
          action={updateListing.bind(null, listing.id)}
          submitLabel="Save changes"
        />
      </section>
    </main>
  );
}
