"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ArrowRight, ChevronRight, MapPin } from "lucide-react";
import { cityHref, isCity } from "@/lib/cities";

type City = { name: string; count: number; listings: ReactNode };

// City picker for the home page. Each city's cards are rendered on the server
// and passed in, so switching cities needs no fetch.
export function CityBrowser({ cities }: { cities: City[] }) {
  const [selected, setSelected] = useState(cities[0]?.name);
  const current = cities.find((city) => city.name === selected) ?? cities[0];
  if (!current) return null;

  return (
    <>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-caption font-bold tracking-[0.2em] text-brand-600">BROWSE BY LOCATION</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Cars Near You</h2>
        </div>
        <Link
          href={isCity(current.name) ? cityHref(current.name) : `/listings?city=${encodeURIComponent(current.name)}`}
          className="mb-1 flex shrink-0 items-center gap-2 text-caption font-semibold text-brand"
        >
          View All in {current.name}
          <ArrowRight className="size-3" strokeWidth={2.4} />
        </Link>
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-[16.25rem_minmax(0,1fr)]">
        <div
          role="tablist"
          aria-label="Cities"
          className="flex gap-1 overflow-x-auto rounded-xl bg-gradient-to-br from-forest to-[#11261d] p-2.5 lg:flex-col"
        >
          {cities.map((city) => {
            const active = city.name === current.name;
            return (
              <button
                key={city.name}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSelected(city.name)}
                className={`flex shrink-0 items-center gap-3 rounded-lg px-3.5 py-2 text-left transition lg:flex-1 ${
                  active ? "bg-lime text-on-lime" : "text-white hover:bg-white/5"
                }`}
              >
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${active ? "bg-on-lime/10" : "bg-white/10"}`}
                >
                  <MapPin className="size-3.5" />
                </span>
                <span className="flex flex-1 flex-col gap-0.5">
                  <span className="text-label font-semibold">{city.name}</span>
                  <span className="text-eyebrow opacity-70">
                    {city.count} {city.count === 1 ? "car" : "cars"}
                  </span>
                </span>
                <ChevronRight className={`size-3 ${active ? "max-lg:hidden" : "invisible"}`} strokeWidth={2.4} />
              </button>
            );
          })}
        </div>
        <div role="tabpanel">{current.listings}</div>
      </div>
    </>
  );
}
