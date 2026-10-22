import Link from "next/link";
import { BrandLogo } from "./brand-logo";

export function BrandCard({ make, count }: { make: string; count: number }) {
  return (
    <Link
      href={`/listings?make=${encodeURIComponent(make)}`}
      className="flex flex-col items-center gap-3 rounded-lg border border-line bg-white px-2.5 pt-5 pb-3.5 text-ink transition hover:-translate-y-0.5 hover:border-lime hover:text-ink hover:shadow-[0_8px_20px_rgba(20,30,25,.08)]"
    >
      <span className="flex h-12 items-center">
        <BrandLogo make={make} />
      </span>
      <span className="text-center">
        <span className="block text-xs font-semibold">{make}</span>
        <span className="mt-0.5 block text-eyebrow text-muted-foreground">
          {count} {count === 1 ? "car" : "cars"}
        </span>
      </span>
    </Link>
  );
}
