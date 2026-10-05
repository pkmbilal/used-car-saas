import Link from "next/link";
import { CarFront } from "lucide-react";
import { Button } from "@/components/ui/button";

// Shown for unknown IDs and for listings that were sold, removed or unpublished.
export default function ListingNotFound() {
  return (
    <main className="light flex flex-1 flex-col items-center bg-canvas px-4 py-24 text-center text-ink">
      <span className="flex size-14 items-center justify-center rounded-full bg-mint text-brand">
        <CarFront className="size-7" strokeWidth={1.6} />
      </span>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight">This car is no longer available</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        It may have been sold or taken down by the seller. There are plenty more to choose from.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button asChild className="h-10 px-5 text-xs max-sm:text-sm font-semibold">
          <Link href="/listings">Browse cars</Link>
        </Button>
        <Button asChild variant="outline" className="h-10 bg-white px-5 text-xs max-sm:text-sm font-semibold">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </main>
  );
}
