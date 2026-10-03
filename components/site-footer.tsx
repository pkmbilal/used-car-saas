import Link from "next/link";
import { BrandLink } from "@/components/brand";
import { cityHref, type City } from "@/lib/cities";

const TOP_MAKES = ["Toyota", "Hyundai", "Nissan", "Lexus"];
const TOP_CITIES: City[] = ["Riyadh", "Jeddah", "Dammam", "Khobar"];

const columns: { title: string; links: [string, string][] }[] = [
  {
    title: "BUY",
    links: [
      ["Browse Cars", "/listings"],
      ["Saved Cars", "/favorites"],
      ["Saved Searches", "/saved-searches"],
    ],
  },
  {
    title: "POPULAR MAKES",
    links: TOP_MAKES.map((make) => [make, `/listings?make=${encodeURIComponent(make)}`]),
  },
  {
    title: "CITIES",
    links: [...TOP_CITIES.map((city): [string, string] => [city, cityHref(city)]), ["All Cities", "/locations"]],
  },
  {
    title: "SELL",
    links: [
      ["Sell Your Car", "/account/become-seller"],
      ["Pricing", "/pricing"],
      ["Seller Dashboard", "/dashboard"],
      ["My Account", "/account"],
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="light mt-20 bg-gradient-to-br from-forest to-forest-dark text-white">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.6fr_repeat(4,minmax(0,1fr))]">
        <div className="flex flex-col gap-4">
          <BrandLink />
          <p className="max-w-64 text-xs leading-relaxed text-white/70">
            Saudi Arabia&apos;s marketplace for used cars. Buy and sell directly with sellers.
          </p>
        </div>
        {columns.map((column) => (
          <div key={column.title} className="flex flex-col gap-3">
            <p className="mb-1 text-[0.6875rem] font-bold tracking-[0.15em] text-lime">{column.title}</p>
            {column.links.map(([label, href]) => (
              <Link key={href} href={href} className="text-xs text-white/70 hover:text-lime">
                {label}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto w-full max-w-6xl px-4 py-5 text-[0.6875rem] text-white/55 sm:px-6">
          © {new Date().getFullYear()} DriveLoop. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
