import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MessageCircle, ShieldCheck, type LucideIcon } from "lucide-react";
import { ListingGrid } from "@/components/listing-card";
import { SearchBar } from "@/components/search-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CITIES } from "@/lib/cities";
import { getViewerFavoriteIds } from "@/lib/favorites";
import { capitalize, FUEL_TYPES } from "@/lib/listing-options";
import {
  getActiveFacetCounts,
  getFeaturedListings,
  getLatestByCities,
  getLatestListings,
  parseListingFilters,
} from "@/lib/listings";
import { isMake } from "@/lib/makes";
import { BrandCard } from "./brand-card";
import { CityBrowser } from "./city-browser";
import { Eyebrow, SectionHeading } from "./section-heading";

// Shown when too few makes have listings to fill the row.
const DEFAULT_MAKES = ["Toyota", "Hyundai", "Nissan", "Lexus", "Mercedes-Benz", "BMW", "Ford", "Kia"];

function topKeys(counts: Map<string, number>, fallback: readonly string[], n: number): string[] {
  const keys = [...counts.keys()].filter((key) => key !== "Other");
  for (const key of fallback) if (!keys.includes(key)) keys.push(key);
  return keys.slice(0, n);
}

const sectionClass = "mx-auto mt-14 w-full max-w-6xl px-4 sm:px-6 md:mt-20";

export default async function Home() {
  const [featured, latest, facets, favoriteIds, byCity] = await Promise.all([
    getFeaturedListings(parseListingFilters({}), 4),
    getLatestListings(4),
    getActiveFacetCounts(),
    getViewerFavoriteIds(),
    // Runs while the queries above are in flight.
    getActiveFacetCounts().then((counts) => getLatestByCities(topKeys(counts.cities, CITIES, 6), 4)),
  ]);

  const showcase = featured.length > 0 ? featured : latest;
  const heroImage = showcase.find((listing) => listing.images[0])?.images[0];
  const makes = topKeys(facets.makes, DEFAULT_MAKES.filter(isMake), 8);
  const cityNames = topKeys(facets.cities, CITIES, 6);

  return (
    <main className="light bg-canvas text-ink">
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-forest-dark">
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_top_right,rgba(31,125,60,.28),transparent_60%)]" />
        {heroImage && (
          <Image src={heroImage.url} alt="" fill priority sizes="100vw" className="-z-20 object-cover" />
        )}
        <div className="absolute inset-0 -z-10 bg-forest-dark/75 md:hidden" />
        <div className="absolute inset-0 -z-10 hidden bg-[linear-gradient(90deg,rgba(15,34,25,.97)_0%,rgba(15,34,25,.88)_35%,rgba(15,34,25,.4)_68%,rgba(15,34,25,.15)_100%)] md:block" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-t from-forest-dark to-transparent" />
        <div className="mx-auto flex min-h-[34rem] w-full max-w-6xl flex-col justify-end px-4 pt-16 pb-30 sm:px-6 md:min-h-[40rem]">
          <Eyebrow tone="dark">USED CARS IN SAUDI ARABIA</Eyebrow>
          <h1 className="mt-5 max-w-2xl font-display text-5xl leading-[1.05] font-medium tracking-tight text-white md:text-7xl">
            Find your next ride with <span className="font-bold text-lime">confidence</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-white/70 sm:text-[0.9375rem]">
            Browse used cars from private sellers and dealers across the Kingdom, and talk to them directly.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              asChild
              className="h-11 rounded-full bg-lime px-6 text-xs font-semibold text-on-lime hover:bg-lime-light hover:text-on-lime max-sm:text-sm"
            >
              <Link href="/listings">
                Browse Cars
                <ArrowRight className="size-3" strokeWidth={2.6} />
              </Link>
            </Button>
            <Button
              asChild
              className="h-11 rounded-full border border-white/30 bg-transparent px-6 text-xs font-semibold text-white hover:bg-white/10 hover:text-white max-sm:text-sm"
            >
              <Link href="/account/become-seller">Sell Your Car</Link>
            </Button>
          </div>
          <TrustBand
            items={[
              [ShieldCheck, "Verified Sellers", "Phone & ID-verified badges"],
              [MessageCircle, "Direct on WhatsApp", "Talk to sellers, no middlemen"],
            ]}
          />
        </div>
      </section>

      <div className="relative mx-auto -mt-20 w-full max-w-6xl px-4 sm:px-6">
        <SearchBar variant="hero" total={facets.total} />
      </div>

      {/* Popular brands */}
      <section className={sectionClass}>
        <SectionHeading eyebrow="QUICK BROWSE" title="Popular Brands" link={{ href: "/brands", label: "All Brands" }} />
        <div className="mt-6 grid grid-cols-2 gap-3.5 sm:mt-8 sm:grid-cols-4 lg:grid-cols-8">
          {makes.map((make) => (
            <BrandCard key={make} make={make} count={facets.makes.get(make) ?? 0} />
          ))}
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-2.5">
          <span className="mr-1.5 text-eyebrow font-semibold tracking-[0.2em] text-muted-foreground">FUEL TYPE</span>
          {FUEL_TYPES.map((fuel) => (
            <Badge
              key={fuel}
              asChild
              variant="outline"
              className="h-8 gap-1.5 rounded-full border-line bg-transparent px-4 text-caption font-medium text-ink hover:border-brand hover:bg-brand hover:text-white"
            >
              <Link href={`/listings?fuel_type=${fuel}`}>
                {capitalize(fuel)}
                <span className="text-eyebrow opacity-60">{facets.fuelTypes.get(fuel) ?? 0}</span>
              </Link>
            </Badge>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="mt-14 bg-white py-12 md:mt-20 md:py-16">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <SectionHeading
            eyebrow={featured.length > 0 ? "FEATURED CARS" : "JUST LISTED"}
            title={featured.length > 0 ? "Handpicked for You" : "Latest Cars"}
            link={{ href: "/listings", label: "View All Cars" }}
          />
          <div className="mt-6 sm:mt-8">
            <ListingGrid listings={showcase} empty="No cars listed yet." favoriteIds={favoriteIds} />
          </div>
        </div>
      </section>

      {/* Cars near you */}
      {facets.total > 0 && (
        <section className={sectionClass}>
          <CityBrowser
            cities={cityNames.map((name) => ({
              name,
              count: facets.cities.get(name) ?? 0,
              listings: (
                <ListingGrid
                  listings={byCity[name] ?? []}
                  empty={`No cars listed in ${name} yet.`}
                  favoriteIds={favoriteIds}
                />
              ),
            }))}
          />
        </section>
      )}

      {/* How it works */}
      <section className={sectionClass}>
        <SectionHeading eyebrow="HOW IT WORKS" title="Simple Steps, Either Way" />
        <div className="mt-8 grid gap-4 sm:mt-10 lg:grid-cols-2 lg:gap-6">
          <HowItWorksColumn
            tag="FOR BUYERS"
            intro="Find, compare and buy a used car without the guesswork."
            cta={{ href: "/listings", label: "Browse Cars" }}
            steps={[
              ["Search", "Filter listings by make, price, year, fuel type and city."],
              ["Compare", "Save cars you like and compare their specs, mileage and price."],
              ["Contact Seller", "Message the seller on WhatsApp or call them to arrange a viewing."],
              ["Buy Your Car", "Inspect the car, agree on a price and drive away."],
            ]}
            className="border border-line bg-white"
          />
          <HowItWorksColumn
            tag="FOR SELLERS"
            intro="List your car in minutes and reach buyers across Saudi Arabia."
            note="Free plan available. Dealer plans for bigger inventories."
            cta={{ href: "/account/become-seller", label: "Start Listing" }}
            steps={[
              ["Create Listing", "Sign up as a seller and start a listing."],
              ["Add Details", "Upload photos and add mileage, condition and your asking price."],
              ["Get Buyer Leads", "Buyers contact you directly by WhatsApp or phone."],
              ["Sell Your Car", "Agree on a price, hand over the keys and mark it as sold."],
            ]}
            className="border border-transparent bg-mint"
          />
        </div>
      </section>

      {/* Sell CTA */}
      <section className={`${sectionClass} mb-14 md:mb-20`}>
        <div className="relative isolate overflow-hidden rounded-2xl bg-forest-dark px-8 py-14 text-white md:px-14 md:py-20">
          {heroImage && (
            <Image src={heroImage.url} alt="" fill sizes="(min-width: 72rem) 72rem, 100vw" className="-z-20 object-cover opacity-30" />
          )}
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(15,34,25,.95)_0%,rgba(15,34,25,.75)_55%,rgba(15,34,25,.4)_100%)]" />
          <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-end">
            <div>
              <Eyebrow tone="dark">READY TO SELL?</Eyebrow>
              <p className="mt-4 font-display text-4xl font-medium tracking-tight md:text-5xl">
                Turn your car into <span className="font-bold text-lime">cash</span>
              </p>
              <p className="mt-4 max-w-md text-xs leading-relaxed text-white/70 max-sm:text-sm">
                List your car in minutes and reach buyers in {cityNames.slice(0, 3).join(", ")} and beyond.
              </p>
            </div>
            <Button
              asChild
              className="h-11 shrink-0 rounded-full bg-lime px-6 text-xs font-semibold text-on-lime hover:bg-lime-light hover:text-on-lime max-sm:text-sm"
            >
              <Link href="/account/become-seller">
                Sell Your Car
                <ArrowRight className="size-3" strokeWidth={2.6} />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

function TrustBand({ items }: { items: [LucideIcon, string, string][] }) {
  return (
    <ul className="relative mt-10 grid w-full max-w-lg grid-cols-2 divide-x divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_20px_40px_-20px_rgba(0,0,0,.5)] backdrop-blur-md">
      {/* Hairline highlight along the top edge */}
      <span aria-hidden className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-lime/50 to-transparent" />
      {items.map(([Icon, title, desc]) => (
        <li key={title} className="flex items-center gap-3 px-4 py-3.5 sm:gap-3.5 sm:px-5 sm:py-4">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-b from-lime/25 to-lime/5 ring-1 ring-lime/30 sm:size-10">
            <Icon className="size-4 text-lime sm:size-[1.125rem]" strokeWidth={1.8} />
          </span>
          <span className="min-w-0">
            <span className="block text-caption font-semibold tracking-wide text-white max-sm:text-xs">{title}</span>
            <span className="mt-0.5 block text-eyebrow leading-snug text-white/55 max-sm:hidden">{desc}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function HowItWorksColumn({
  tag,
  intro,
  note,
  cta,
  steps,
  className = "",
}: {
  tag: string;
  intro: string;
  note?: string;
  cta: { href: string; label: string };
  steps: [string, string][];
  className?: string;
}) {
  return (
    <div className={`rounded-2xl p-6 sm:p-8 xl:p-10 ${className}`}>
      <Eyebrow>{tag}</Eyebrow>
      <p className="mt-3 max-w-sm font-display text-2xl font-medium tracking-tight max-sm:text-xl lg:max-w-md">{intro}</p>
      <ol className="mt-8 grid gap-x-8 gap-y-7 sm:grid-cols-2">
        {steps.map(([label, desc], i) => (
          <li key={label} className="border-t border-line pt-4">
            <span className="font-display text-2xl font-bold text-brand">0{i + 1}</span>
            <p className="mt-2 text-label font-semibold">{label}</p>
            <p className="mt-1 text-caption leading-relaxed text-muted-foreground">{desc}</p>
          </li>
        ))}
      </ol>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        {note && <span className="text-caption text-muted-foreground">{note}</span>}
        <Button asChild className="h-9 rounded-full px-5 text-caption font-semibold text-white hover:bg-brand-dark hover:text-white">
          <Link href={cta.href}>
            {cta.label}
            <ArrowRight className="size-3" strokeWidth={2.6} />
          </Link>
        </Button>
      </div>
    </div>
  );
}
