import type { Metadata } from "next";
import { makeName } from "@/lib/car-names";
import { count } from "@/lib/dictionary";
import { getDictionary, localeAlternates } from "@/lib/i18n-server";
import { getActiveFacetCounts } from "@/lib/listings";
import { MAKES } from "@/lib/makes";
import { BrandCard } from "../brand-card";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return {
    title: t.brands.metaTitle,
    description: t.brands.metaDescription,
    alternates: await localeAlternates("/brands"),
  };
}

export default async function BrandsPage() {
  const facets = await getActiveFacetCounts();
  const { t, locale } = await getDictionary();
  const b = t.brands;
  // Most listings first, then alphabetical by the displayed name.
  const brands = MAKES.filter((make) => make !== "Other").sort(
    (x, y) =>
      (facets.makes.get(y) ?? 0) - (facets.makes.get(x) ?? 0) ||
      makeName(locale, x).localeCompare(makeName(locale, y), locale),
  );

  return (
    <main className="light bg-canvas text-ink">
      <section className="relative overflow-hidden bg-charcoal">
        <div className="absolute inset-y-0 end-0 w-2/3 bg-[radial-gradient(ellipse_at_70%_60%,rgba(111,224,124,.16),transparent_60%)] rtl:bg-[radial-gradient(ellipse_at_30%_60%,rgba(111,224,124,.16),transparent_60%)]" />
        <div className="relative mx-auto w-full max-w-6xl px-4 pt-10 pb-14 sm:px-6">
          <p className="text-eyebrow font-bold tracking-[0.24em] text-[#5fd06e]">{b.eyebrow}</p>
          <h1 className="mt-2.5 max-w-md text-3xl leading-tight font-medium tracking-tight text-white md:text-4xl">
            {b.titleStart} <span className="text-lime">{b.titleHighlight}</span>
          </h1>
          <p className="mt-3.5 max-w-sm text-label leading-relaxed text-white/85">
            {b.intro}
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <p className="mb-4 text-label font-semibold">
          {count(locale, brands.length, b.count)}
          <span className="font-normal text-muted-foreground"> · {count(locale, facets.total, b.forSale)}</span>
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
