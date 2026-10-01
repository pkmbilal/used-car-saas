"use client";

import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

// The filter form in a slide-over on small screens.
export function MobileFilters({ children }: { children: React.ReactNode }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="h-10 w-full bg-white text-sm font-semibold lg:hidden">
          <SlidersHorizontal className="size-4 text-brand-600" />
          Filters
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="light w-80 overflow-y-auto p-5">
        <SheetTitle className="sr-only">Filters</SheetTitle>
        {children}
      </SheetContent>
    </Sheet>
  );
}
