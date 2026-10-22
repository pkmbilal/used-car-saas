"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cityHref, isCity } from "@/lib/cities";
import { SectionHeading } from "./section-heading";

type City = { name: string; count: number; listings: ReactNode };

// City tabs for the home page. Each city's cards are rendered on the server
// and passed in, so switching cities needs no fetch.
export function CityBrowser({ cities }: { cities: City[] }) {
  const id = useId();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const [selected, setSelected] = useState(cities[0]?.name);
  const currentIndex = Math.max(
    cities.findIndex((city) => city.name === selected),
    0,
  );
  const current = cities[currentIndex];
  if (!current) return null;

  // Left/right arrows (and Home/End) move between tabs, as in a native tablist.
  function onKeyDown(event: KeyboardEvent) {
    const moves: Record<string, number> = {
      ArrowRight: currentIndex + 1,
      ArrowLeft: currentIndex - 1,
      Home: 0,
      End: cities.length - 1,
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    const next = (moves[event.key] + cities.length) % cities.length;
    setSelected(cities[next].name);
    tabs.current[next]?.focus();
  }

  return (
    <>
      <SectionHeading
        eyebrow="BROWSE BY LOCATION"
        title="Cars Near You"
        link={{
          href: isCity(current.name) ? cityHref(current.name) : `/listings?city=${encodeURIComponent(current.name)}`,
          label: `View All in ${current.name}`,
        }}
      />
      <div
        role="tablist"
        aria-label="Cities"
        onKeyDown={onKeyDown}
        className="-mx-4 mt-6 flex gap-7 overflow-x-auto border-b border-line px-4 [scrollbar-width:none] sm:mx-0 sm:mt-8 sm:px-0"
      >
        {cities.map((city, i) => {
          const active = i === currentIndex;
          return (
            <button
              key={city.name}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              id={`${id}-tab-${i}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`${id}-panel`}
              tabIndex={active ? 0 : -1}
              onClick={() => setSelected(city.name)}
              className={`-mb-px flex shrink-0 items-baseline gap-1.5 border-b-2 pb-3 text-label font-semibold transition ${
                active ? "border-brand text-ink" : "border-transparent text-muted-foreground hover:text-ink"
              }`}
            >
              {city.name}
              <span className="text-eyebrow font-medium opacity-60">{city.count}</span>
            </button>
          );
        })}
      </div>
      <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${currentIndex}`} className="mt-8">
        {current.listings}
      </div>
    </>
  );
}
