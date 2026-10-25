import type { Metadata } from "next";
import Image from "next/image";
import Link from "@/components/locale-link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { cache } from "react";
import { DealerBadge, DealerLogo } from "@/components/dealer-logo";
import { FavoriteButton } from "@/components/favorite-button";
import {
  BadgeCheck,
  CalendarDays,
  Car,
  Clock,
  Cog,
  Fuel,
  Gauge,
  MapPin,
  Palette,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { ListingGrid } from "@/components/listing-card";
import { ReportListingButton } from "@/components/report-listing-button";
import { SafetyTips } from "@/components/safety-tips";
import { VerificationBadges } from "@/components/verification-badges";
import { RiyalPrice } from "@/components/riyal-price";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getCurrentUser } from "@/lib/auth";
import { carName, makeName, modelName } from "@/lib/car-names";
import { cityName, fmt, optionLabel, translateMessage } from "@/lib/dictionary";
import { getFavoriteIds } from "@/lib/favorites";
import { localizePath } from "@/lib/i18n";
import { getDictionary, localeAlternates } from "@/lib/i18n-server";
import {
  formatDay,
  formatKm,
  formatMonthYear,
  formatListingStats,
  formatRelativeDays,
  formatSAR,
} from "@/lib/format";
import { capitalize } from "@/lib/listing-options";
import { breadcrumbJsonLd, jsonLdScript, listingDescription, listingJsonLd } from "@/lib/listing-seo";
import { getListingStats, getPublicListing, getSimilarListings, isFeatured } from "@/lib/listings";
import { getListingQuota, SELF_FEATURE_DAYS } from "@/lib/plans";
import { siteUrl } from "@/lib/site";
import { getStorefront } from "@/lib/storefront";
import { BackLink } from "./back-link";
import { Breadcrumbs, type Crumb } from "./breadcrumbs";
import { ContactButtons } from "./contact-buttons";
import { Gallery } from "./gallery";
import { ListingDescription, ListingFeatures, SpecGrid } from "./listing-details";
import { OwnerActions } from "./owner-actions";
import { ShareButton } from "./share-button";
import { ViewTracker } from "./view-tracker";

// Shared by generateMetadata and the page within one request.
const getListing = cache(getPublicListing);

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/listings/[id]">): Promise<Metadata> {
  const { id } = await params;
  const { t, locale } = await getDictionary();
  const listing = await getListing(id);
  if (!listing) return { title: t.listingPage.notFoundTitle };
  const title = fmt(t.listingPage.metaTitle, {
    year: listing.year,
    make: makeName(locale, listing.make),
    model: modelName(locale, listing.make, listing.model),
    price: formatSAR(listing.price, locale),
  });
  const description = listingDescription(listing, t, locale);
  const cover = listing.images[0];
  return {
    title,
    description,
    alternates: await localeAlternates(`/listings/${listing.id}`),
    openGraph: { title, description, url: localizePath(locale, `/listings/${listing.id}`), ...(cover && { images: [cover.url] }) },
  };
}

export default async function ListingPage({ params }: PageProps<"/[lang]/listings/[id]">) {
  const { id } = await params;
  const { t, locale } = await getDictionary();
  const p = t.listingPage;
  // Each query starts as soon as what it needs is known, rather than in rounds.
  const currentPromise = getCurrentUser();
  const favoritesPromise = currentPromise.then((c) => (c ? getFavoriteIds(c.user.id) : new Set<string>()));
  const listing = await getListing(id);
  if (!listing) notFound();
  const similarPromise = getSimilarListings(listing, 4);
  const current = await currentPromise;

  const name = carName(locale, listing.make, listing.model);
  const title = `${listing.year} ${name}`;
  const isOwner = current?.user.id === listing.seller_id;
  const seller = listing.seller;
  const storefront = seller ? getStorefront(seller) : null;
  const featured = isFeatured(listing);
  const [stats, quota, favoriteIds, similar] = await Promise.all([
    isOwner ? getListingStats(listing.id) : null,
    isOwner ? getListingQuota() : null,
    favoritesPromise,
    similarPromise,
  ]);
  const whatsappText = fmt(p.whatsappText, {
    title,
    price: formatSAR(listing.price, locale),
    url: await listingUrl(localizePath(locale, `/listings/${listing.id}`)),
  });
  const cover = listing.images[0];
  const transmission = listing.transmission ? optionLabel(t.options.transmission, listing.transmission) : null;
  const fuel = optionLabel(t.options.fuel, listing.fuel_type);
  const city = cityName(t, listing.city);
  const showContact = !isOwner && !!seller?.has_phone;
  const listedAgo = formatRelativeDays(listing.first_published_at ?? listing.created_at, locale);
  // Counting the model year itself, so a this-year car isn't divided by zero.
  const ageYears = Math.max(1, new Date().getFullYear() - listing.year + 1);
  const perYear = listing.mileage > 0 ? Math.round(listing.mileage / ageYears) : 0;
  const crumbs: Crumb[] = [
    { name: p.breadcrumbListings, href: "/listings" },
    { name: makeName(locale, listing.make), href: `/listings?${new URLSearchParams({ make: listing.make })}` },
    {
      name: modelName(locale, listing.make, listing.model),
      href: `/listings?${new URLSearchParams({ make: listing.make, model: listing.model })}`,
    },
  ];
  const absoluteUrl = (path: string) => new URL(localizePath(locale, path), siteUrl()).toString();

  const specIcon = { className: "size-4", strokeWidth: 1.8 };
  const specs = [
    { label: p.specs.make, value: makeName(locale, listing.make), icon: <BadgeCheck {...specIcon} /> },
    { label: p.specs.model, value: modelName(locale, listing.make, listing.model), icon: <Car {...specIcon} /> },
    { label: p.specs.year, value: String(listing.year), icon: <CalendarDays {...specIcon} /> },
    { label: p.specs.mileage, value: formatKm(listing.mileage, locale), icon: <Gauge {...specIcon} /> },
    {
      label: p.specs.perYear,
      value: perYear > 0 ? fmt(p.perYearValue, { km: formatKm(perYear, locale) }) : null,
      icon: <TrendingUp {...specIcon} />,
    },
    { label: p.specs.fuelType, value: fuel, icon: <Fuel {...specIcon} /> },
    { label: p.specs.condition, value: optionLabel(t.options.condition, listing.condition), icon: <Sparkles {...specIcon} /> },
    { label: p.specs.transmission, value: transmission, icon: <Cog {...specIcon} /> },
    {
      label: p.specs.bodyStyle,
      value: listing.body_type && optionLabel(t.options.bodyType, listing.body_type),
      icon: <Car {...specIcon} />,
    },
    // Free text from the seller, shown as typed.
    { label: p.specs.color, value: listing.color && capitalize(listing.color), icon: <Palette {...specIcon} /> },
    { label: p.specs.city, value: city, icon: <MapPin {...specIcon} /> },
    { label: p.specs.listed, value: formatMonthYear(listing.created_at, locale), icon: <Clock {...specIcon} /> },
  ];

  return (
    <main className={`light bg-canvas text-ink ${showContact ? "max-lg:pb-[calc(5rem+env(safe-area-inset-bottom))]" : ""}`}>
      {!isOwner && listing.status === "active" && <ViewTracker listingId={listing.id} />}
      {listing.status === "active" && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLdScript([
              listingJsonLd(
                listing,
                absoluteUrl(`/listings/${listing.id}`),
                listingDescription(listing, t, locale),
              ),
              breadcrumbJsonLd(crumbs.map((crumb) => ({ name: crumb.name, url: absoluteUrl(crumb.href) }))),
            ]),
          }}
        />
      )}
      {isOwner && listing.status !== "active" && (
        <div className="bg-amber-50 text-sm text-amber-900">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-6">
            <span>
              {listing.status === "removed"
                ? listing.removed_reason
                  ? fmt(p.removedByReason, { reason: translateMessage(t, listing.removed_reason) })
                  : p.removedBy
                : listing.status === "draft"
                  ? p.hiddenDraft
                  : p.hiddenSold}
            </span>
            <Link href={`/dashboard/listings/${listing.id}/edit`} className="font-medium underline">
              {p.editListing}
            </Link>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="relative overflow-hidden bg-charcoal text-white">
        {cover && (
          <div className="absolute inset-y-0 end-0 hidden w-[62%] [mask-image:linear-gradient(90deg,transparent,#000_30%)] rtl:[mask-image:linear-gradient(270deg,transparent,#000_30%)] md:block">
            <Image
              src={cover.url}
              alt=""
              fill
              loading="eager"
              fetchPriority="high"
              sizes="62vw"
              className="object-cover"
            />
          </div>
        )}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#1b2125_0%,#1b2125_36%,rgba(27,33,37,.55)_48%,rgba(27,33,37,0)_62%)] rtl:bg-[linear-gradient(270deg,#1b2125_0%,#1b2125_36%,rgba(27,33,37,.55)_48%,rgba(27,33,37,0)_62%)]" />
        <div className="relative mx-auto w-full max-w-6xl px-4 pt-7 pb-9 sm:px-6">
          <BackLink />
          <Breadcrumbs crumbs={crumbs} label={p.breadcrumbLabel} />
          <div className="mt-3 flex flex-wrap items-center gap-3.5">
            <h1 className="text-3xl font-semibold tracking-tight">{name}</h1>
            {featured && (
              <Badge className="h-6 bg-[#4fc35f] px-3 text-caption font-semibold">{t.common.featured}</Badge>
            )}
          </div>
          <p className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-base sm:text-[0.9375rem]">
            <span>{listing.year}</span>
            <span className="opacity-60">·</span>
            <span>{formatKm(listing.mileage, locale)}</span>
            <span className="opacity-60">·</span>
            <span>{transmission ?? fuel}</span>
            <span className="opacity-60">·</span>
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5" />
              {city}
            </span>
          </p>
          <p className="mt-4 text-3xl font-bold text-lime"><RiyalPrice amount={listing.price} /></p>
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
          <ListingDescription text={listing.description} />
        </div>

        <aside className="flex flex-col gap-5">
          <Card className="gap-0 rounded-lg px-5 pt-4 pb-5 shadow-[0_2px_12px_rgba(20,30,25,.06)] ring-0">
            <p className="text-[1.6875rem] font-bold text-brand"><RiyalPrice amount={listing.price} /></p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="size-3.5" />
              {fmt(p.listedAgo, { when: listedAgo })}
            </p>
            {stats && (
              <p className="mt-1 text-xs text-muted-foreground">
                {formatListingStats(locale, stats, t.common.stats)}
              </p>
            )}
            {isOwner && featured && listing.featured_until && (
              <p className="mt-3 flex items-center gap-1.5 rounded-md bg-mint px-3 py-2 text-xs font-medium text-brand-600">
                <Sparkles className="size-3.5" />
                {fmt(p.featuredUntil, { date: formatDay(listing.featured_until, locale) })}
              </p>
            )}

            {showContact && seller && (
              <ContactButtons sellerId={seller.id} listingId={listing.id} whatsappText={whatsappText} variant="sidebar" />
            )}
            {isOwner && (
              <OwnerActions
                listingId={listing.id}
                status={listing.status}
                featureSlots={featured ? 0 : (quota?.featuredRemaining ?? 0)}
                featureDays={SELF_FEATURE_DAYS}
                canUpgrade={!featured && !!quota && quota.plan !== "showroom"}
              />
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
                    <p className="truncate text-base font-semibold sm:text-[0.9375rem]">
                      {storefront?.name ?? seller.full_name ?? p.seller}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {storefront ? <DealerBadge /> : <Badge variant="outline">{t.common.privateSeller}</Badge>}
                      <VerificationBadges profile={seller} />
                    </div>
                  </div>
                </div>
                <Separator className="mt-4" />
                <div className="flex flex-col gap-3.5 pt-4 text-caption leading-relaxed text-ink/75">
                  <p className="flex items-start gap-3.5">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-brand" />
                    <span>
                      {p.location}
                      <br />
                      {fmt(p.locationValue, { city })}
                    </span>
                  </p>
                  <p className="flex items-start gap-3.5">
                    <CalendarDays className="mt-0.5 size-4 shrink-0 text-brand" />
                    <span>
                      {p.memberSince}
                      <br />
                      {formatMonthYear(seller.created_at, locale)}
                    </span>
                  </p>
                </div>
                <Button asChild variant="link" className="mt-3 h-auto justify-start max-sm:h-auto px-0 text-xs max-sm:text-sm font-semibold text-brand">
                  <Link href={`/sellers/${seller.id}`}>
                    {storefront ? p.visitStorefront : p.viewSellerListings}
                  </Link>
                </Button>
              </>
            )}
          </Card>

          {!isOwner && <SafetyTips />}

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
            <h2 className="text-lg font-semibold">{p.similar}</h2>
            <Link
              href={`/listings?${new URLSearchParams({ make: listing.make, model: listing.model })}`}
              className="text-caption font-semibold text-brand"
            >
              {p.viewAll}
            </Link>
          </div>
          <div className="mt-4">
            <ListingGrid listings={similar} favoriteIds={favoriteIds} />
          </div>
        </section>
      )}

      {/* On mobile the sidebar sits below the gallery and specs, so keep contact one tap away. */}
      {showContact && (
        <div className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur lg:hidden">
          <div className="mx-auto flex w-full max-w-6xl items-center gap-2.5 px-4 py-3 sm:px-6">
            <p className="me-auto min-w-0 truncate text-base font-bold text-brand">
              <RiyalPrice amount={listing.price} />
            </p>
            {seller && (
              <ContactButtons sellerId={seller.id} listingId={listing.id} whatsappText={whatsappText} variant="bar" />
            )}
          </div>
        </div>
      )}
    </main>
  );
}

// Absolute link for the prefilled WhatsApp message, from the current request.
async function listingUrl(path: string): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}${path}` : path;
}
