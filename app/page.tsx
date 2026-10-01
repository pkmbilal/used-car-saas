import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRightIcon,
  CarIcon,
  ChatIcon,
  CompareIcon,
  DocIcon,
  PlusIcon,
  SearchIcon,
  ShieldIcon,
  TagIcon,
  UsersIcon,
  WhatsAppIcon,
} from "@/components/icons";
import { ListingGrid } from "@/components/listing-card";
import { SearchBar } from "@/components/search-bar";
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
import { BrandLogo } from "./brand-logo";
import { CityBrowser } from "./city-browser";

// Shown when too few makes have listings to fill the row.
const DEFAULT_MAKES = ["Toyota", "Hyundai", "Nissan", "Lexus", "Mercedes-Benz", "BMW", "Ford", "Kia"];

function topKeys(counts: Map<string, number>, fallback: readonly string[], n: number): string[] {
  const keys = [...counts.keys()].filter((key) => key !== "Other");
  for (const key of fallback) if (!keys.includes(key)) keys.push(key);
  return keys.slice(0, n);
}

function SectionHeading({
  eyebrow,
  title,
  link,
}: {
  eyebrow: string;
  title: string;
  link?: { href: string; label: string };
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-[11px] font-bold tracking-[0.2em] text-brand-600">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h2>
      </div>
      {link && (
        <Link href={link.href} className="mb-1 flex shrink-0 items-center gap-2 text-[11px] font-semibold text-brand">
          {link.label}
          <ArrowRightIcon size={12} strokeWidth={2.4} />
        </Link>
      )}
    </div>
  );
}

export default async function Home() {
  const [featured, latest, facets, favoriteIds] = await Promise.all([
    getFeaturedListings(parseListingFilters({}), 4),
    getLatestListings(4),
    getActiveFacetCounts(),
    getViewerFavoriteIds(),
  ]);

  const showcase = featured.length > 0 ? featured : latest;
  const heroImage = showcase.find((listing) => listing.images[0])?.images[0];
  const makes = topKeys(facets.makes, DEFAULT_MAKES.filter(isMake), 8);
  const cityNames = topKeys(facets.cities, CITIES, 6);
  const byCity = await getLatestByCities(cityNames, 3);

  return (
    <main className="bg-canvas text-ink">
      {/* Hero */}
      <section className="relative overflow-hidden bg-charcoal">
        {heroImage && (
          <div className="absolute inset-y-0 right-0 hidden w-[58%] md:block">
            <Image src={heroImage.url} alt="" fill priority sizes="58vw" className="object-cover" />
          </div>
        )}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#1b2125_0%,#1b2125_40%,rgba(27,33,37,.6)_55%,rgba(27,33,37,.1)_75%)]" />
        <div className="relative mx-auto w-full max-w-6xl px-4 pt-14 pb-32 sm:px-6 md:pt-20 md:pb-36">
          <p className="text-[11px] font-bold tracking-[0.25em] text-[#5fd06e]">USED CARS IN SAUDI ARABIA</p>
          <h1 className="mt-3 max-w-lg text-4xl leading-[1.08] font-medium tracking-tight text-white md:text-[47px]">
            Find Your Next Ride with <span className="font-semibold text-accent">Confidence</span>
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/80">
            Browse used cars from private sellers and dealers across the Kingdom, and talk to them directly.
          </p>
          <div className="mt-7 flex flex-wrap gap-x-8 gap-y-3 text-xs text-white">
            <span className="flex items-center gap-2.5">
              <ShieldIcon size={20} strokeWidth={1.8} className="text-[#5fd06e]" />
              Verified seller badges
            </span>
            <span className="flex items-center gap-2.5">
              <WhatsAppIcon size={20} strokeWidth={1.8} className="text-[#5fd06e]" />
              Contact sellers on WhatsApp
            </span>
          </div>
        </div>
      </section>

      <div className="relative mx-auto -mt-20 w-full max-w-6xl px-4 sm:px-6">
        <SearchBar />
      </div>

      {/* Popular brands */}
      <section className="mx-auto mt-16 w-full max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="QUICK BROWSE"
          title="Popular Brands"
          link={{ href: "/listings", label: "All Cars" }}
        />
        <div className="mt-6 grid grid-cols-2 gap-3.5 sm:grid-cols-4 lg:grid-cols-8">
          {makes.map((make) => {
            const count = facets.makes.get(make) ?? 0;
            return (
              <Link
                key={make}
                href={`/listings?make=${encodeURIComponent(make)}`}
                className="flex flex-col items-center gap-3 rounded-lg border border-line bg-white px-2.5 pt-5 pb-3.5 text-ink transition hover:-translate-y-0.5 hover:border-accent hover:text-ink hover:shadow-[0_8px_20px_rgba(20,30,25,.08)]"
              >
                <span className="flex h-12 items-center">
                  <BrandLogo make={make} />
                </span>
                <span className="text-center">
                  <span className="block text-xs font-semibold">{make}</span>
                  <span className="mt-0.5 block text-[10px] text-muted">
                    {count} {count === 1 ? "car" : "cars"}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <span className="mr-1.5 text-[11px] font-semibold text-ink/70">Fuel Type</span>
          {FUEL_TYPES.map((fuel) => (
            <Link
              key={fuel}
              href={`/listings?fuel_type=${fuel}`}
              className="flex h-8 items-center gap-1.5 rounded-full border border-line bg-white px-3.5 text-[11px] font-medium text-ink hover:border-brand hover:bg-brand hover:text-white"
            >
              {capitalize(fuel)}
              <span className="text-[10px] opacity-60">{facets.fuelTypes.get(fuel) ?? 0}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto mt-14 w-full max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow={featured.length > 0 ? "FEATURED CARS" : "JUST LISTED"}
          title={featured.length > 0 ? "Handpicked for You" : "Latest Cars"}
          link={{ href: "/listings", label: "View All Cars" }}
        />
        <div className="mt-6">
          <ListingGrid listings={showcase} empty="No cars listed yet." favoriteIds={favoriteIds} />
        </div>
      </section>

      {/* Cars near you */}
      {facets.total > 0 && (
        <section className="mx-auto mt-14 w-full max-w-6xl px-4 sm:px-6">
          <CityBrowser
            cities={cityNames.map((name) => ({
              name,
              count: facets.cities.get(name) ?? 0,
              listings: (
                <ListingGrid
                  listings={byCity[name] ?? []}
                  columns={3}
                  empty={`No cars listed in ${name} yet.`}
                  favoriteIds={favoriteIds}
                />
              ),
            }))}
          />
        </section>
      )}

      {/* How it works */}
      <section className="mx-auto mt-14 w-full max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow="HOW IT WORKS" title="Simple Steps, Either Way" />
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <HowItWorksCard
            tone="light"
            tag="BUY"
            title="For Buyers"
            intro="Find, compare and buy a used car without the guesswork."
            note={`${facets.total} ${facets.total === 1 ? "car" : "cars"} available now`}
            cta={{ href: "/listings", label: "Browse Cars" }}
            steps={[
              [<SearchIcon key="i" size={22} strokeWidth={1.8} />, "Search", "Filter listings by make, price, year, fuel type and city."],
              [<CompareIcon key="i" size={22} strokeWidth={1.8} />, "Compare", "Save cars you like and compare their specs, mileage and price."],
              [<ChatIcon key="i" size={22} strokeWidth={1.8} />, "Contact Seller", "Message the seller on WhatsApp or call them to arrange a viewing."],
              [<CarIcon key="i" size={22} strokeWidth={1.8} />, "Buy Your Car", "Inspect the car, agree on a price and drive away."],
            ]}
          />
          <HowItWorksCard
            tone="dark"
            tag="SELL"
            title="For Sellers"
            intro="List your car in minutes and reach buyers across Saudi Arabia."
            note="Free plan available. Dealer plans for bigger inventories."
            cta={{ href: "/account/become-seller", label: "Start Listing" }}
            steps={[
              [<PlusIcon key="i" size={22} strokeWidth={1.8} />, "Create Listing", "Sign up as a seller and start a listing."],
              [<DocIcon key="i" size={22} strokeWidth={1.8} />, "Add Details", "Upload photos and add mileage, condition and your asking price."],
              [<UsersIcon key="i" size={22} strokeWidth={1.8} />, "Get Buyer Leads", "Buyers contact you directly by WhatsApp or phone."],
              [<TagIcon key="i" size={22} strokeWidth={1.8} />, "Sell Your Car", "Agree on a price, hand over the keys and mark it as sold."],
            ]}
          />
        </div>
      </section>

      {/* Sell CTA */}
      <section className="mx-auto mt-12 w-full max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 rounded-xl bg-gradient-to-r from-forest to-[#1f5a3f] px-8 py-9 text-white sm:flex-row sm:items-center">
          <div>
            <p className="text-[10px] font-bold tracking-[0.15em] text-accent">READY TO SELL?</p>
            <p className="mt-2 text-2xl font-semibold">Turn Your Car into Cash</p>
            <p className="mt-2 max-w-md text-xs leading-relaxed text-white/80">
              List your car in minutes and reach buyers in {cityNames.slice(0, 3).join(", ")} and beyond.
            </p>
          </div>
          <Link
            href="/account/become-seller"
            className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-accent px-6 text-xs font-semibold text-on-accent hover:bg-accent-light hover:text-on-accent"
          >
            Sell Your Car
            <ArrowRightIcon size={12} strokeWidth={2.6} />
          </Link>
        </div>
      </section>
    </main>
  );
}

function HowItWorksCard({
  tone,
  tag,
  title,
  intro,
  note,
  cta,
  steps,
}: {
  tone: "light" | "dark";
  tag: string;
  title: string;
  intro: string;
  note: string;
  cta: { href: string; label: string };
  steps: [ReactNode, string, string][];
}) {
  const dark = tone === "dark";

  return (
    <div
      className={`overflow-hidden rounded-xl shadow-[0_4px_18px_rgba(20,30,25,.06)] ${
        dark ? "bg-gradient-to-br from-forest to-[#11261d] text-white" : "border border-line bg-white text-ink"
      }`}
    >
      <div className={`px-7 pt-7 pb-6 ${dark ? "" : "bg-charcoal text-white"}`}>
        <span className="inline-flex h-6 items-center rounded-full bg-accent/20 px-3 text-[9.5px] font-bold tracking-[0.15em] text-accent">
          {tag}
        </span>
        <p className="mt-3 text-[22px] font-semibold tracking-tight">{title}</p>
        <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-white/80">{intro}</p>
      </div>
      <div className="px-7 pt-6 pb-7">
        <ol className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
          {steps.map(([icon, label, desc], i) => {
            const last = i === steps.length - 1;
            return (
              <li key={label} className="flex items-start gap-3.5">
                <span
                  className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
                    last
                      ? dark
                        ? "bg-accent text-on-accent"
                        : "bg-brand text-white shadow-[0_8px_18px_rgba(31,125,60,.28)]"
                      : dark
                        ? "bg-white/10 text-accent"
                        : "bg-mint text-brand"
                  }`}
                >
                  {icon}
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold ${dark ? "text-accent" : "text-brand-600"}`}>
                      0{i + 1}
                    </span>
                    <span className="text-[13px] font-semibold">{label}</span>
                  </p>
                  <p className={`mt-1 text-[11px] leading-relaxed ${dark ? "text-white/70" : "text-muted"}`}>{desc}</p>
                </div>
              </li>
            );
          })}
        </ol>
        <div
          className={`mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-4 ${dark ? "border-white/10" : "border-line"}`}
        >
          <span className={`text-[11px] ${dark ? "text-white/70" : "text-muted"}`}>{note}</span>
          <Link
            href={cta.href}
            className={`flex h-9 items-center gap-2 rounded-full px-5 text-[11px] font-semibold ${
              dark
                ? "bg-accent text-on-accent hover:bg-accent-light hover:text-on-accent"
                : "bg-brand text-white hover:bg-brand-dark hover:text-white"
            }`}
          >
            {cta.label}
            <ArrowRightIcon size={11} strokeWidth={2.6} />
          </Link>
        </div>
      </div>
    </div>
  );
}
