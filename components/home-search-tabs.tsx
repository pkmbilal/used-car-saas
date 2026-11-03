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

  function select(index: number) {
    setActive(index);
    // Bring a part-hidden tab (e.g. the last one on phones) fully into view.
    refs.current[index]?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  function onKeyDown(event: React.KeyboardEvent) {
    const rtl = document.documentElement.dir === "rtl";
    const step = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 }[event.key];
    let next: number | undefined;
    if (step !== undefined) next = (active + step + tabs.length) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    select(next);
    refs.current[next]?.focus();
  }

  return (
    <>
      <div role="tablist" aria-label={label}
        onKeyDown={onKeyDown}
        className="relative flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
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
              onClick={() => select(index)}
              className={cn(
                // Phones: three equal columns, icon over a label that may wrap, so no
                // tab is cut off. sm+: natural-width row.
                "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-t-xl px-2 py-2 text-center text-[11px] leading-tight font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-lime/60 focus-visible:ring-inset sm:flex-none sm:shrink-0 sm:flex-row sm:gap-2 sm:px-5 sm:py-2.5 sm:text-sm sm:whitespace-nowrap [&_svg]:size-4 [&_svg]:shrink-0",
                current ? "bg-white text-ink [&_svg]:text-brand" : "bg-white/10 text-white/80 hover:bg-white/15 hover:text-white",
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>
      <div
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-tab-${tabs[active].key}`}
        // Flat top corners, so every tab joins the card the same way. From sm up
        // the tabs never reach the far (end) corner, so it stays rounded.
        className="[&>*]:rounded-t-none sm:[&>*]:rounded-se-2xl"
      >
        {tabs[active].panel}
      </div>
    </>
  );
}
