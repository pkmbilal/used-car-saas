import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MessageCircle, Phone } from "lucide-react";
import { cache } from "react";
import { DealerBadge, DealerLogo } from "@/components/dealer-logo";
import { ListingGrid } from "@/components/listing-card";
import { VerificationBadges } from "@/components/verification-badges";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
    title: `${name} | DriveLoop`,
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
    <main className="light bg-canvas text-ink">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        {storefront ? (
          <Card className="flex-col gap-6 rounded-xl p-6 shadow-[0_2px_12px_rgba(20,30,25,.06)] ring-0 sm:flex-row">
            <DealerLogo name={storefront.name} logoUrl={storefront.logoUrl} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight">{storefront.name}</h1>
                <DealerBadge />
                <VerificationBadges profile={profile} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{memberSince}</p>
              {storefront.showroomAddress && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Showroom: {storefront.showroomAddress}
                </p>
              )}
              {storefront.about && (
                <p className="mt-4 max-w-2xl whitespace-pre-line text-sm">{storefront.about}</p>
              )}
              {profile.phone && (
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button asChild className="hover:bg-brand-dark hover:text-white">
                    <a href={whatsappUrl(profile.phone, `Hi ${storefront.name}, I found you on DriveLoop.`)} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="size-4" />
                      WhatsApp dealer
                    </a>
                  </Button>
                  <Button asChild variant="outline" className="border-brand text-ink hover:bg-mint">
                    <a href={`tel:${profile.phone}`}>
                      <Phone className="size-4" />
                      Call dealer
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{profile.full_name ?? "Seller"}</h1>
              <VerificationBadges profile={profile} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{memberSince}</p>
          </>
        )}

        {featured.length > 0 && (
          <>
            <h2 className="mt-10 mb-4 text-lg font-semibold">Featured</h2>
            <ListingGrid listings={featured} empty="" favoriteIds={favoriteIds} />
          </>
        )}

        <h2 className="mt-10 mb-4 text-lg font-semibold">
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
      </div>
    </main>
  );
}
