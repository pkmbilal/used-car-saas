"use client";

import { useEffect, useState } from "react";

// The sticky glass <header>; it firms up and tightens once the page scrolls.
export function HeaderShell({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 8);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <header
      data-scrolled={scrolled || undefined}
      className="group light pt-safe sticky top-0 z-30 bg-charcoal text-white transition-[background-color,box-shadow] duration-300 data-scrolled:bg-charcoal/90 data-scrolled:backdrop-blur-xl data-scrolled:backdrop-saturate-150 data-scrolled:shadow-[0_8px_30px_-12px_rgb(0_0_0/0.5)]"
    >
      {children}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-lime/30 to-transparent transition-opacity duration-300 group-data-scrolled:via-lime/50"
      />
    </header>
  );
}
