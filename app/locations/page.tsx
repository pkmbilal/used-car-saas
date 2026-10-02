import type { Metadata } from "next";
import { CityCard } from "@/components/city-card";
import { citiesByCount, CITIES } from "@/lib/cities";
import { getActiveFacetCounts } from "@/lib/listings";

export const metadata: Metadata = {
  title: "Used cars by city | DriveLoop",
  description: "Browse used cars for sale in Riyadh, Jeddah, Dammam and every other city across Saudi Arabia.",
};

export default async function LocationsPage() {
  const facets = await getActiveFacetCounts();
  const cities = citiesByCount(facets.cities);

  return (
    <main className="light bg-canvas text-ink">
      <section className="relative overflow-hidden bg-charcoal">
        <div className="absolute inset-y-0 right-0 w-2/3 bg-[radial-gradient(ellipse_at_70%_60%,rgba(111,224,124,.16),transparent_60%)]" />
        <div className="relative mx-auto w-full max-w-6xl px-4 pt-10 pb-14 sm:px-6">
          <p className="text-[0.65625rem] font-bold tracking-[0.24em] text-[#5fd06e]">LOCATIONS</p>
          <h1 className="mt-2.5 max-w-md text-3xl leading-tight font-medium tracking-tight text-white md:text-4xl">
            Browse Cars <span className="text-lime">by City</span>
          </h1>
          <p className="mt-3.5 max-w-sm text-[0.78125rem] leading-relaxed text-white/85">
            Find used cars for sale near you, from private sellers and dealers across the Kingdom.
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <p className="mb-4 text-[0.8125rem] font-semibold">
          {CITIES.length} Cities
          <span className="font-normal text-muted-foreground">
            {" "}
            · {facets.total} {facets.total === 1 ? "car" : "cars"} for sale
          </span>
        </p>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {cities.map((city) => (
            <li key={city}>
              <CityCard city={city} count={facets.cities.get(city) ?? 0} />
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
