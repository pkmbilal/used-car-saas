import type { Metadata } from "next";
import Link from "@/components/locale-link";
import { notFound } from "next/navigation";
import { requireSeller } from "@/lib/auth";
import { carName } from "@/lib/car-names";
import { getDictionary } from "@/lib/i18n-server";
import { getSellerListing } from "@/lib/listings";
import { updateListing } from "../../actions";
import { ListingActions } from "../../listing-actions";
import { ListingForm } from "../../listing-form";
import { StatusBadge } from "../../status-badge";
import { PhotoManager } from "./photo-manager";
import { noIndex } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.dashboard.editPage.metaTitle, robots: noIndex };
}

export default async function EditListingPage({
  params,
}: PageProps<"/[lang]/dashboard/listings/[id]/edit">) {
  const { id } = await params;
  const { user } = await requireSeller(`/dashboard/listings/${id}/edit`);
  const listing = await getSellerListing(user.id, id);
  if (!listing) notFound();
  const { t, locale } = await getDictionary();
  const p = t.dashboard.editPage;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12">
      <Link href="/dashboard" className="text-sm text-zinc-600 dark:text-zinc-400">
        {t.dashboard.backToListings}
      </Link>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            {carName(locale, listing.make, listing.model, listing.year)}
          </h1>
          <StatusBadge status={listing.status} />
        </div>
        <ListingActions listingId={listing.id} status={listing.status} />
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-medium">{p.photos}</h2>
        <PhotoManager
          listingId={listing.id}
          photos={listing.images.map(({ id, url }) => ({ id, url }))}
        />
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-medium">{p.details}</h2>
        <ListingForm
          listing={listing}
          cover={listing.images[0]?.url}
          action={updateListing.bind(null, listing.id)}
          submitLabel={p.submit}
        />
      </section>
    </main>
  );
}
