import type { Metadata } from "next";
import { getActiveFacetCounts } from "@/lib/listings";
import { MAKES } from "@/lib/makes";
import { BrandCard } from "../brand-card";

export const metadata: Metadata = {
  title: "Used cars by brand | KarSouq",
  description: "Browse used Toyota, Hyundai, Nissan, Lexus and every other car brand for sale across Saudi Arabia.",
};

export default async function BrandsPage() {
  const facets = await getActiveFacetCounts();
  // Most listings first, then alphabetical.
  const brands = MAKES.filter((make) => make !== "Other").sort(
    (a, b) => (facets.makes.get(b) ?? 0) - (facets.makes.get(a) ?? 0) || a.localeCompare(b),
  );

  return (
    <main className="light bg-canvas text-ink">
      <section className="relative overflow-hidden bg-charcoal">
        <div className="absolute inset-y-0 end-0 w-2/3 bg-[radial-gradient(ellipse_at_70%_60%,rgba(111,224,124,.16),transparent_60%)]" />
        <div className="relative mx-auto w-full max-w-6xl px-4 pt-10 pb-14 sm:px-6">
          <p className="text-eyebrow font-bold tracking-[0.24em] text-[#5fd06e]">BRANDS</p>
          <h1 className="mt-2.5 max-w-md text-3xl leading-tight font-medium tracking-tight text-white md:text-4xl">
            Browse Cars <span className="text-lime">by Brand</span>
          </h1>
          <p className="mt-3.5 max-w-sm text-label leading-relaxed text-white/85">
            Find used cars from every major make, sold by private sellers and dealers across the Kingdom.
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <p className="mb-4 text-label font-semibold">
          {brands.length} Brands
          <span className="font-normal text-muted-foreground">
            {" "}
            · {facets.total} {facets.total === 1 ? "car" : "cars"} for sale
          </span>
        </p>
        <ul className="grid grid-cols-2 gap-3.5 sm:grid-cols-4 lg:grid-cols-6">
          {brands.map((make) => (
            <li key={make}>
              <BrandCard make={make} count={facets.makes.get(make) ?? 0} />
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
