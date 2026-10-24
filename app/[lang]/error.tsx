"use client";

import Link from "@/components/locale-link";
import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { useDictionary } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { fmt } from "@/lib/dictionary";

// Catches errors thrown below the root layout, so the header and footer stay.
export default function RootError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const { t } = useDictionary();
  const e = t.errors;
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="light flex flex-1 flex-col items-center bg-canvas px-4 py-24 text-center text-ink">
      <span className="flex size-14 items-center justify-center rounded-full bg-mint text-brand">
        <TriangleAlert className="size-7" strokeWidth={1.6} />
      </span>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight">{e.title}</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {e.text}
      </p>
      {error.digest && <p className="mt-2 text-caption text-muted-foreground">{fmt(e.reference, { digest: error.digest })}</p>}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button onClick={() => retry()} className="h-10 px-5 text-xs max-sm:text-sm font-semibold">
          {e.retry}
        </Button>
        <Button asChild variant="outline" className="h-10 bg-white px-5 text-xs max-sm:text-sm font-semibold">
          <Link href="/">{e.home}</Link>
        </Button>
      </div>
    </main>
  );
}
