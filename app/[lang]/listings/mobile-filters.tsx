"use client";

import { SlidersHorizontal } from "lucide-react";
import { useDictionary } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { dir } from "@/lib/i18n";

// The filter form in a slide-over on small screens.
export function MobileFilters({ children }: { children: React.ReactNode }) {
  const { t, locale } = useDictionary();
  const side = dir(locale) === "rtl" ? "right" : "left";
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="h-10 w-full bg-white text-sm font-semibold lg:hidden">
          <SlidersHorizontal className="size-4 text-brand-600" />
          {t.listings.filters.open}
        </Button>
      </SheetTrigger>
      <SheetContent side={side} className="light w-80 overflow-y-auto p-5">
        <SheetTitle className="sr-only">{t.listings.filters.open}</SheetTitle>
        {children}
      </SheetContent>
    </Sheet>
  );
}
