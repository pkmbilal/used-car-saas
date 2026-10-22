import Link from "next/link";
import { BrandLogo } from "./brand-logo";

export function BrandCard({ make, count }: { make: string; count: number }) {
  return (
    <Link
      href={`/listings?make=${encodeURIComponent(make)}`}
      className="group flex flex-col items-center gap-3 rounded-xl bg-white px-2.5 pt-6 pb-4 text-ink shadow-[0_1px_2px_rgba(15,34,25,.04)] ring-1 ring-line/60 transition duration-300 hover:-translate-y-0.5 hover:text-ink hover:shadow-[0_18px_40px_-16px_rgba(15,34,25,.22)] hover:ring-transparent"
    >
      <span className="flex h-12 items-center opacity-80 grayscale transition duration-300 group-hover:opacity-100 group-hover:grayscale-0">
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
