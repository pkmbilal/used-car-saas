import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { DealerBadge, DealerLogo } from "@/components/dealer-logo";
import { ListingGrid } from "@/components/listing-card";
import { VerificationBadges } from "@/components/verification-badges";
import { getViewerFavoriteIds } from "@/lib/favorites";
import { formatMonthYear, whatsappUrl } from "@/lib/format";
import { getSellerProfile, isFeatured } from "@/lib/listings";
import { getStorefront } from "@/lib/storefront";

const getSeller = cache(getSellerProfile);

export async function generateMetadata({
  params,
}: PageProps<"/sellers/[id]">): Promise<Metadata> {
  const { id } = await params;
  const seller = await getSeller(id);
  if (!seller) return { title: "Seller not found" };

  const storefront = getStorefront(seller.profile);
  const name = storefront?.name ?? seller.profile.full_name ?? "Seller";
  return {
    title: `${name} | Used Car Marketplace`,
    description: storefront?.about?.slice(0, 160),
  };
}

export default async function SellerPage({ params }: PageProps<"/sellers/[id]">) {
  const { id } = await params;
  const [seller, favoriteIds] = await Promise.all([getSeller(id), getViewerFavoriteIds()]);
  if (!seller) notFound();

  const { profile, listings } = seller;
  const storefront = getStorefront(profile);
  const memberSince = `${profile.city ? `${profile.city} · ` : ""}Member since ${formatMonthYear(profile.created_at)}`;

  // Dealers get their boosted cars pinned above the rest.
  const featured = storefront ? listings.filter(isFeatured) : [];
  const others = storefront ? listings.filter((listing) => !isFeatured(listing)) : listings;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12">
      {storefront ? (
        <div className="flex flex-col gap-6 rounded-lg border border-zinc-200 p-6 dark:border-zinc-800 sm:flex-row">
          <DealerLogo name={storefront.name} logoUrl={storefront.logoUrl} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{storefront.name}</h1>
              <DealerBadge />
              <VerificationBadges profile={profile} />
            </div>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{memberSince}</p>
            {storefront.showroomAddress && (
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Showroom: {storefront.showroomAddress}
              </p>
            )}
            {storefront.about && (
              <p className="mt-4 max-w-2xl whitespace-pre-line text-sm">{storefront.about}</p>
            )}
            {profile.phone && (
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={whatsappUrl(profile.phone, `Hi ${storefront.name}, I found you on Used Car Marketplace.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  WhatsApp dealer
                </a>
                <a
                  href={`tel:${profile.phone}`}
                  className="rounded-md border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
                >
                  Call dealer
                </a>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{profile.full_name ?? "Seller"}</h1>
            <VerificationBadges profile={profile} />
          </div>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{memberSince}</p>
        </>
      )}

      {featured.length > 0 && (
        <>
          <h2 className="mt-10 mb-4 text-lg font-medium">Featured</h2>
          <ListingGrid listings={featured} empty="" favoriteIds={favoriteIds} />
        </>
      )}

      <h2 className="mt-10 mb-4 text-lg font-medium">
        {featured.length > 0
          ? "More cars for sale"
          : listings.length === 1
            ? "1 car for sale"
            : `${listings.length} cars for sale`}
      </h2>
      <ListingGrid
        listings={others}
        empty={featured.length > 0 ? "No other cars for sale right now." : "No cars for sale right now."}
        favoriteIds={favoriteIds}
      />
    </main>
  );
}
