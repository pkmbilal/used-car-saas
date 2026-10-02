import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cityHref, type City } from "@/lib/cities";

export function CityCard({ city, count }: { city: City; count: number }) {
  const empty = count === 0;

  return (
    <Card
      className={`group h-full gap-0 rounded-lg py-0 text-ink shadow-[0_2px_10px_rgba(20,30,25,.05)] ring-0 transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(20,30,25,.1)] ${
        empty ? "opacity-60" : ""
      }`}
    >
      <Link href={cityHref(city)} className="flex h-full items-center gap-3.5 p-4 hover:text-ink">
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
            empty ? "bg-line/60 text-muted-foreground" : "bg-mint text-brand"
          }`}
        >
          <MapPin className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{city}</span>
          <span className="mt-0.5 block text-[0.6875rem] text-muted-foreground">
            {count} {count === 1 ? "car" : "cars"}
          </span>
        </span>
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-ink/80 transition group-hover:border-brand group-hover:bg-brand group-hover:text-white">
          <ArrowRight className="size-2.5" strokeWidth={2.6} />
        </span>
      </Link>
    </Card>
  );
}
