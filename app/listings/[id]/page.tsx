import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { cache } from "react";
import { DealerBadge, DealerLogo } from "@/components/dealer-logo";
import { FavoriteButton } from "@/components/favorite-button";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Car,
  Clock,
  Fuel,
  Gauge,
  MapPin,
  MessageCircle,
  Palette,
  Phone,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { ListingGrid } from "@/components/listing-card";
import { ReportListingButton } from "@/components/report-listing-button";
import { VerificationBadges } from "@/components/verification-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getCurrentUser } from "@/lib/auth";
import { getFavoriteIds } from "@/lib/favorites";
import { formatKm, formatMonthYear, formatSAR, formatViews, whatsappUrl } from "@/lib/format";
import { bodyTypeLabel, capitalize } from "@/lib/listing-options";
import { getListingViews, getPublicListing, getSimilarListings, isFeatured } from "@/lib/listings";
import { getStorefront } from "@/lib/storefront";
import { Gallery } from "./gallery";
import { ListingDescription, ListingFeatures, SpecGrid } from "./listing-details";
import { ShareButton } from "./share-button";
import { ViewTracker } from "./view-tracker";

// Shared by generateMetadata and the page within one request.
const getListing = cache(getPublicListing);

export async function generateMetadata({
  params,
}: PageProps<"/listings/[id]">): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListing(id);
  if (!listing) return { title: "Listing not found" };
  return {
    title: `${listing.year} ${listing.make} ${listing.model} — ${formatSAR(listing.price)} | DriveLoop`,
  };
}

// Columns the listings table doesn't have yet (color, description). `select("*")` returns them automatically once a
// migration adds them, and the page starts showing them.
function optionalText(listing: object, key: string): string | null {
  const value = (listing as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim() ? capitalize(value.trim()) : null;
}

export default async function ListingPage({ params }: PageProps<"/listings/[id]">) {
  const { id } = await params;
  const [listing, current] = await Promise.all([getListing(id), getCurrentUser()]);
  if (!listing) notFound();

  const name = `${listing.make} ${listing.model}`;
  const title = `${listing.year} ${name}`;
  const isOwner = current?.user.id === listing.seller_id;
  const seller = listing.seller;
  const storefront = seller ? getStorefront(seller) : null;
  const featured = isFeatured(listing);
  const [views, favoriteIds, similar] = await Promise.all([
    isOwner ? getListingViews(listing.id) : null,
    current ? getFavoriteIds(current.user.id) : new Set<string>(),
    getSimilarListings(listing, 4),
  ]);
  const whatsappText = `Hi, I'm interested in your ${title} listed for ${formatSAR(listing.price)}: ${await listingUrl(listing.id)}`;
  const cover = listing.images[0];
  const transmission = listing.transmission ? capitalize(listing.transmission) : null;

  const specIcon = { className: "size-4", strokeWidth: 1.8 };
  const specs = [
    { label: "Make", value: listing.make, icon: <BadgeCheck {...specIcon} /> },
    { label: "Model", value: listing.model, icon: <Car {...specIcon} /> },
    { label: "Year", value: String(listing.year), icon: <CalendarDays {...specIcon} /> },
    { label: "Mileage", value: formatKm(listing.mileage), icon: <Gauge {...specIcon} /> },
    { label: "Fuel Type", value: capitalize(listing.fuel_type), icon: <Fuel {...specIcon} /> },
    { label: "Condition", value: capitalize(listing.condition), icon: <Sparkles {...specIcon} /> },
    { label: "Transmission", value: transmission, icon: <Gauge {...specIcon} /> },
    { label: "Body Style", value: listing.body_type && bodyTypeLabel(listing.body_type), icon: <Car {...specIcon} /> },
    { label: "Color", value: optionalText(listing, "color"), icon: <Palette {...specIcon} /> },
    { label: "City", value: listing.city, icon: <MapPin {...specIcon} /> },
    { label: "Listed", value: formatMonthYear(listing.created_at), icon: <Clock {...specIcon} /> },
  ];

  return (
    <main className="light bg-canvas text-ink">
      {!isOwner && listing.status === "active" && <ViewTracker listingId={listing.id} />}
      {isOwner && listing.status !== "active" && (
        <div className="bg-amber-50 text-sm text-amber-900">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-6">
            <span>
              {listing.status === "removed"
                ? `This listing was removed by moderators${listing.removed_reason ? `: ${listing.removed_reason}` : ""}.`
                : `This listing is ${listing.status === "draft" ? "a draft" : "marked as sold"} and is not visible to buyers.`}
            </span>
            <Link href={`/dashboard/listings/${listing.id}/edit`} className="font-medium underline">
              Edit listing
            </Link>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="relative overflow-hidden bg-charcoal text-white">
        {cover && (
          <div className="absolute inset-y-0 right-0 hidden w-[62%] [mask-image:linear-gradient(90deg,transparent,#000_30%)] md:block">
            <Image src={cover.url} alt="" fill sizes="62vw" className="object-cover" />
          </div>
        )}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#1b2125_0%,#1b2125_36%,rgba(27,33,37,.55)_48%,rgba(27,33,37,0)_62%)]" />
        <div className="relative mx-auto w-full max-w-6xl px-4 pt-7 pb-9 sm:px-6">
          <Link href="/listings" className="inline-flex items-center gap-2 text-xs font-medium text-white hover:text-lime">
            <ArrowLeft className="size-3" strokeWidth={2.4} />
            Back to Search
          </Link>
          <div className="mt-4 flex flex-wrap items-center gap-3.5">
            <h1 className="text-3xl font-semibold tracking-tight">{name}</h1>
            {featured && (
              <Badge className="h-6 bg-[#4fc35f] px-3 text-[0.6875rem] font-semibold">Featured</Badge>
            )}
          </div>
          <p className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.9375rem]">
            <span>{listing.year}</span>
            <span className="opacity-60">·</span>
            <span>{formatKm(listing.mileage)}</span>
            <span className="opacity-60">·</span>
            <span>{transmission ?? capitalize(listing.fuel_type)}</span>
            <span className="opacity-60">·</span>
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5" />
              {listing.city}
            </span>
          </p>
          <p className="mt-4 text-3xl font-bold text-lime">{formatSAR(listing.price)}</p>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-6xl items-start gap-8 px-4 pt-7 sm:px-6 lg:grid-cols-[minmax(0,1fr)_22.625rem]">
        <div className="flex min-w-0 flex-col gap-10">
          <Gallery
            title={title}
            photos={listing.images.map(({ id, url }) => ({ id, url }))}
            featured={featured}
          />
          <SpecGrid specs={specs} />
          <ListingFeatures features={listing.features} />
          <ListingDescription text={optionalText(listing, "description")} />
        </div>

        <aside className="flex flex-col gap-5">
          <Card className="gap-0 rounded-lg px-5 pt-4 pb-5 shadow-[0_2px_12px_rgba(20,30,25,.06)] ring-0">
            <p className="text-[1.6875rem] font-bold text-brand">{formatSAR(listing.price)}</p>
            {views !== null && <p className="mt-1 text-xs text-muted-foreground">{formatViews(views)}</p>}

            {seller?.phone && !isOwner && (
              <div className="mt-4 flex flex-col gap-2.5">
                <Button asChild className="h-11 text-[0.8125rem] font-semibold hover:bg-brand-dark hover:text-white">
                  <a href={`tel:${seller.phone}`}>
                    <Phone className="size-4" />
                    Call Seller
                  </a>
                </Button>
                <Button asChild variant="outline" className="h-11 border-brand text-[0.8125rem] font-semibold text-ink hover:bg-mint">
                  <a href={whatsappUrl(seller.phone, whatsappText)} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="size-4 text-brand" />
                    WhatsApp
                  </a>
                </Button>
              </div>
            )}
            <div className={`grid gap-2.5 ${isOwner ? "mt-4 grid-cols-1" : "mt-3 grid-cols-2"}`}>
              {!isOwner && <FavoriteButton listingId={listing.id} favorited={favoriteIds.has(listing.id)} variant="label" />}
              <ShareButton title={title} />
            </div>

            {seller && (
              <>
                <Separator className="mt-5" />
                <div className="flex items-center gap-3 pt-5">
                  {storefront ? (
                    <DealerLogo name={storefront.name} logoUrl={storefront.logoUrl} size="sm" />
                  ) : (
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-charcoal text-lime">
                      <ShieldCheck className="size-5" strokeWidth={1.8} />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-[0.9375rem] font-semibold">
                      {storefront?.name ?? seller.full_name ?? "Seller"}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {storefront && <DealerBadge />}
                      <VerificationBadges profile={seller} />
                    </div>
                  </div>
                </div>
                <Separator className="mt-4" />
                <div className="flex flex-col gap-3.5 pt-4 text-[0.71875rem] leading-relaxed text-ink/75">
                  <p className="flex items-start gap-3.5">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-brand" />
                    <span>
                      Location
                      <br />
                      {listing.city}, Saudi Arabia
                    </span>
                  </p>
                  <p className="flex items-start gap-3.5">
                    <CalendarDays className="mt-0.5 size-4 shrink-0 text-brand" />
                    <span>
                      Member since
                      <br />
                      {formatMonthYear(seller.created_at)}
                    </span>
                  </p>
                </div>
                <Button asChild variant="link" className="mt-3 h-auto justify-start px-0 text-xs font-semibold text-brand">
                  <Link href={`/sellers/${seller.id}`}>
                    {storefront ? "Visit dealer storefront →" : "View seller’s listings →"}
                  </Link>
                </Button>
              </>
            )}
          </Card>

          {!isOwner && listing.status === "active" && (
            <div className="px-1">
              <ReportListingButton listingId={listing.id} signedIn={!!current} />
            </div>
          )}
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="mx-auto mt-14 w-full max-w-6xl px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Similar Cars You May Like</h2>
            <Link
              href={`/listings?make=${encodeURIComponent(listing.make)}`}
              className="text-[0.6875rem] font-semibold text-brand"
            >
              View All →
            </Link>
          </div>
          <div className="mt-4">
            <ListingGrid listings={similar} favoriteIds={favoriteIds} />
          </div>
        </section>
      )}
    </main>
  );
}

// Absolute link for the prefilled WhatsApp message, from the current request.
async function listingUrl(id: string): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}/listings/${id}` : `/listings/${id}`;
}
