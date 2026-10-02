"use client";

import Image from "next/image";
import { useState } from "react";

// Logos come from the public car-logos-dataset; fall back to the initial when a
// make isn't in it.
function logoUrl(make: string): string {
  const slug = make.toLowerCase().replace(/\s+/g, "-");
  return `https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/${slug}.png`;
}

export function BrandLogo({ make }: { make: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span aria-hidden className="flex size-12 items-center justify-center rounded-full bg-mint text-lg font-bold text-brand">
        {make[0]}
      </span>
    );
  }

  return (
    <Image
      src={logoUrl(make)}
      alt=""
      width={56}
      height={44}
      onError={() => setFailed(true)}
      className="h-11 w-14 object-contain"
    />
  );
}
