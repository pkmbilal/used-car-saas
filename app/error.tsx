"use client";

import Link from "next/link";
import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

// Catches errors thrown below the root layout, so the header and footer stay.
export default function RootError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="light flex flex-1 flex-col items-center bg-canvas px-4 py-24 text-center text-ink">
      <span className="flex size-14 items-center justify-center rounded-full bg-mint text-brand">
        <TriangleAlert className="size-7" strokeWidth={1.6} />
      </span>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        We couldn&apos;t load this page. Try again in a moment.
      </p>
      {error.digest && <p className="mt-2 text-caption text-muted-foreground">Reference: {error.digest}</p>}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button onClick={() => retry()} className="h-10 px-5 text-xs max-sm:text-sm font-semibold">
          Try again
        </Button>
        <Button asChild variant="outline" className="h-10 bg-white px-5 text-xs max-sm:text-sm font-semibold">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </main>
  );
}
