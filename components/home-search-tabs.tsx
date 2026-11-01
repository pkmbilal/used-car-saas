"use client";

import { useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type SearchTab = {
  key: string;
  label: string;
  icon: React.ReactNode;
  panel: React.ReactNode;
};

// Folder tabs on top of the home search card, styled like the /rentals tabs.
// Unlike those, switching doesn't navigate: the server renders every form and
// only the active one is mounted, so their field ids never clash.
export function HomeSearchTabs({ tabs, label }: { tabs: SearchTab[]; label: string }) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const id = useId();

  function onKeyDown(event: React.KeyboardEvent) {
    const rtl = document.documentElement.dir === "rtl";
    const step = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 }[event.key];
    let next: number | undefined;
    if (step !== undefined) next = (active + step + tabs.length) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    setActive(next);
    refs.current[next]?.focus();
  }

  return (
    <>
      <div role="tablist" aria-label={label} onKeyDown={onKeyDown} className="relative flex gap-1 overflow-x-auto">
        {tabs.map((tab, index) => {
          const current = index === active;
          return (
            <button
              key={tab.key}
              ref={(el) => {
                refs.current[index] = el;
              }}
              type="button"
              role="tab"
              id={`${id}-tab-${tab.key}`}
              aria-selected={current}
              aria-controls={`${id}-panel`}
              tabIndex={current ? 0 : -1}
              onClick={() => setActive(index)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-t-xl px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap transition outline-none focus-visible:ring-2 focus-visible:ring-lime/60 focus-visible:ring-inset sm:px-5 sm:text-sm [&_svg]:size-4",
                current ? "bg-white text-ink [&_svg]:text-brand" : "bg-white/10 text-white/80 hover:bg-white/15 hover:text-white",
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${tabs[active].key}`}>
        {tabs[active].panel}
      </div>
    </>
  );
}
