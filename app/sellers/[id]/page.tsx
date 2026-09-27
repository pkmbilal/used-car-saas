import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ListingGrid } from "@/components/listing-card";
import { getViewerFavoriteIds } from "@/lib/favorites";
import { formatMonthYear } from "@/lib/format";
import { getSellerProfile } from "@/lib/listings";

const getSeller = cache(getSellerProfile);

export async function generateMetadata({
  params,
}: PageProps<"/sellers/[id]">): Promise<Metadata> {
  const { id } = await params;
  const seller = await getSeller(id);
  return {
    title: seller
      ? `${seller.profile.full_name ?? "Seller"} | Used Car Marketplace`
      : "Seller not found",
  };
}

export default async function SellerPage({ params }: PageProps<"/sellers/[id]">) {
  const { id } = await params;
  const [seller, favoriteIds] = await Promise.all([getSeller(id), getViewerFavoriteIds()]);
  if (!seller) notFound();

  const { profile, listings } = seller;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">{profile.full_name ?? "Seller"}</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {profile.city ? `${profile.city} · ` : ""}Member since{" "}
        {formatMonthYear(profile.created_at)}
      </p>

      <h2 className="mt-10 mb-4 text-lg font-medium">
        {listings.length === 1 ? "1 car for sale" : `${listings.length} cars for sale`}
      </h2>
      <ListingGrid
        listings={listings}
        empty="No cars for sale right now."
        favoriteIds={favoriteIds}
      />
    </main>
  );
}
