import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ContactButtons } from "@/app/[lang]/listings/[id]/contact-buttons";
import { DealerBadge, DealerLogo } from "@/components/dealer-logo";
import { ListingGrid } from "@/components/listing-card";
import { VerificationBadges } from "@/components/verification-badges";
import { Card } from "@/components/ui/card";
import { getViewerFavoriteIds } from "@/lib/favorites";
import { cityName, count, fmt } from "@/lib/dictionary";
import { formatMonthYear } from "@/lib/format";
import { getDictionary, localeAlternates } from "@/lib/i18n-server";
import { getSellerProfile, isFeatured } from "@/lib/listings";
import { getStorefront } from "@/lib/storefront";

const getSeller = cache(getSellerProfile);

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/sellers/[id]">): Promise<Metadata> {
  const { id } = await params;
  const { t } = await getDictionary();
  const seller = await getSeller(id);
  if (!seller) return { title: t.seller.notFound };

  const storefront = getStorefront(seller.profile);
  const name = storefront?.name ?? seller.profile.full_name ?? t.seller.seller;
  return {
    title: fmt(t.meta.titleSuffix, { title: name }),
    description: storefront?.about?.slice(0, 160),
    alternates: await localeAlternates(`/sellers/${id}`),
  };
}

export default async function SellerPage({ params }: PageProps<"/[lang]/sellers/[id]">) {
  const { id } = await params;
  const { t, locale } = await getDictionary();
  const s = t.seller;
  const [seller, favoriteIds] = await Promise.all([getSeller(id), getViewerFavoriteIds()]);
  if (!seller) notFound();

  const { profile, listings } = seller;
  const storefront = getStorefront(profile);
  const since = fmt(s.memberSince, { date: formatMonthYear(profile.created_at, locale) });
  const memberSince = profile.city ? `${cityName(t, profile.city)} · ${since}` : since;

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
                  {fmt(s.showroom, { address: storefront.showroomAddress })}
                </p>
              )}
              {storefront.about && (
                <p className="mt-4 max-w-2xl whitespace-pre-line text-sm">{storefront.about}</p>
              )}
              {profile.has_phone && (
                <ContactButtons
                  sellerId={profile.id}
                  whatsappText={fmt(s.whatsappText, { name: storefront.name })}
                  variant="dealer"
                />
              )}
            </div>
          </Card>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{profile.full_name ?? s.seller}</h1>
              <VerificationBadges profile={profile} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{memberSince}</p>
          </>
        )}

        {featured.length > 0 && (
          <>
            <h2 className="mt-10 mb-4 text-lg font-semibold">{s.featured}</h2>
            <ListingGrid listings={featured} empty="" favoriteIds={favoriteIds} />
          </>
        )}

        <h2 className="mt-10 mb-4 text-lg font-semibold">
          {featured.length > 0 ? s.moreCars : count(locale, listings.length, s.carsForSale)}
        </h2>
        <ListingGrid
          listings={others}
          empty={featured.length > 0 ? s.noOtherCars : s.noCars}
          favoriteIds={favoriteIds}
        />
      </div>
    </main>
  );
}
