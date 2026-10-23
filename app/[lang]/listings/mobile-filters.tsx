"use client";

import { SlidersHorizontal } from "lucide-react";
import { useLocale } from "@/components/locale-link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { dir } from "@/lib/i18n";

// The filter form in a slide-over on small screens.
export function MobileFilters({ children }: { children: React.ReactNode }) {
  const side = dir(useLocale()) === "rtl" ? "right" : "left";
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="h-10 w-full bg-white text-sm font-semibold lg:hidden">
          <SlidersHorizontal className="size-4 text-brand-600" />
          Filters
        </Button>
      </SheetTrigger>
      <SheetContent side={side} className="light w-80 overflow-y-auto p-5">
        <SheetTitle className="sr-only">Filters</SheetTitle>
        {children}
      </SheetContent>
    </Sheet>
  );
}
