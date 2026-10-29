"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, LocateFixed } from "lucide-react";
import { approxLocation } from "@/app/[lang]/(site)/listings/actions";
import { useDictionary } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { formatNear, isInSaudi, roundPoint, type GeoPoint } from "@/lib/cities";
import { localizePath } from "@/lib/i18n";

type Failure = "denied" | "outside" | "unavailable";

function browserLocation(): Promise<GeoPoint | Failure> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) return resolve("unavailable");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        resolve(isInSaudi(coords.latitude, coords.longitude) ? roundPoint(coords.latitude, coords.longitude) : "outside"),
      (error) => resolve(error.code === error.PERMISSION_DENIED ? "denied" : "unavailable"),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 2 * 60_000 },
    );
  });
}

// Finds the visitor (browser location, else their IP) and opens /listings
// around them. On /listings it keeps the other filters; a city is dropped
// since it would override "near me".
export function NearMeButton({ className, keepFilters = false }: { className?: string; keepFilters?: boolean }) {
  const { t, locale } = useDictionary();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState<Failure | null>(null);

  async function locate() {
    setPending(true);
    setFailed(null);
    const located = await browserLocation();
    // The IP fallback only works when deployed on Vercel.
    const point = typeof located === "string" ? await approxLocation().catch(() => null) : located;
    if (!point) {
      setPending(false);
      setFailed(located as Failure);
      return;
    }
    // Read at click time rather than via useSearchParams, which would need a Suspense boundary.
    const params = new URLSearchParams(keepFilters ? window.location.search : undefined);
    for (const key of ["city", "page", "sort", "loc"]) params.delete(key);
    params.set("near", formatNear(point));
    if (typeof located === "string") params.set("loc", "ip");
    router.push(localizePath(locale, `/listings?${params}`));
  }

  return (
    <div className={className}>
      <Button type="button" variant="outline" onClick={locate} disabled={pending} className="w-full gap-2 bg-white text-xs font-semibold max-sm:text-sm">
        {pending ? <LoaderCircle className="size-3.5 animate-spin" /> : <LocateFixed className="size-3.5 text-brand-600" />}
        {t.nearMe.button}
      </Button>
      {failed && (
        <p role="alert" className="mt-1.5 text-caption text-muted-foreground">
          {t.nearMe.failed[failed]}
        </p>
      )}
    </div>
  );
}
