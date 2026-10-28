"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { useDictionary } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { fmt } from "@/lib/dictionary";

// Catches errors in Seller Center pages, so the sidebar and tab bar stay.
export default function SellerCenterError({
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
    <div className="flex flex-col items-center py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-mint text-brand">
        <TriangleAlert className="size-7" strokeWidth={1.6} />
      </span>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight">{e.title}</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{e.text}</p>
      {error.digest && <p className="mt-2 text-caption text-muted-foreground">{fmt(e.reference, { digest: error.digest })}</p>}
      <Button onClick={() => retry()} className="mt-6 h-10 px-5 text-sm font-semibold">
        {e.retry}
      </Button>
    </div>
  );
}
