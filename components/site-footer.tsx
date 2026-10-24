import Link from "@/components/locale-link";
import { BrandLink } from "@/components/brand";
import { makeName } from "@/lib/car-names";
import { cityHref, type City } from "@/lib/cities";
import { COMPANY_NAME } from "@/lib/contact";
import { cityName, fmt } from "@/lib/dictionary";
import { getDictionary } from "@/lib/i18n-server";

const TOP_MAKES = ["Toyota", "Hyundai", "Nissan", "Lexus"];
const TOP_CITIES: City[] = ["Riyadh", "Jeddah", "Dammam", "Khobar"];

export async function SiteFooter() {
  const { t, locale } = await getDictionary();
  const columns: { title: string; links: [string, string][] }[] = [
    {
      title: t.footer.buy,
      links: [
        [t.footer.browseCars, "/listings"],
        [t.footer.savedCars, "/favorites"],
        [t.footer.savedSearches, "/saved-searches"],
      ],
    },
    {
      title: t.footer.popularMakes,
      links: TOP_MAKES.map((make) => [makeName(locale, make), `/listings?make=${encodeURIComponent(make)}`]),
    },
    {
      title: t.footer.cities,
      links: [
        ...TOP_CITIES.map((city): [string, string] => [cityName(t, city), cityHref(city)]),
        [t.footer.allCities, "/locations"],
      ],
    },
    {
      title: t.footer.sell,
      links: [
        [t.footer.sellYourCar, "/account/become-seller"],
        [t.footer.pricing, "/pricing"],
        [t.footer.sellerDashboard, "/dashboard"],
        [t.footer.myAccount, "/account"],
      ],
    },
  ];

  return (
    <footer className="light mt-20 max-md:hidden bg-gradient-to-br from-forest to-forest-dark text-white">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.6fr_repeat(4,minmax(0,1fr))]">
        <div className="col-span-2 flex flex-col gap-4 md:col-span-1">
          <BrandLink />
          <p className="max-w-64 text-xs leading-relaxed max-sm:text-sm text-white/70">{t.footer.blurb}</p>
        </div>
        {columns.map((column) => (
          <div key={column.title} className="flex flex-col gap-3">
            <p className="mb-1 text-caption font-bold tracking-[0.15em] text-lime">{column.title}</p>
            {column.links.map(([label, href]) => (
              <Link key={href} href={href} className="text-xs text-white/70 max-sm:py-1 max-sm:text-sm hover:text-lime">
                {label}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-caption text-white/55 sm:px-6">
          <p>{fmt(t.footer.copyright, { year: new Date().getFullYear(), company: COMPANY_NAME })}</p>
          <nav className="flex gap-4">
            <Link href="/contact" className="hover:text-lime">
              {t.footer.contact}
            </Link>
            <Link href="/privacy" className="hover:text-lime">
              {t.footer.privacy}
            </Link>
            <Link href="/terms" className="hover:text-lime">
              {t.footer.terms}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
