"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Props = {
  title: string;
  photos: { id: string; url: string }[];
  featured?: boolean;
};

const arrowClass =
  "absolute top-[calc(50%-18px)] size-9 rounded-full bg-white text-brand shadow-[0_2px_8px_rgba(0,0,0,.2)] hover:bg-mint";

export function Gallery({ title, photos, featured = false }: Props) {
  const [index, setIndex] = useState(0);
  const current = photos[index];
  const count = photos.length;

  if (!current) {
    return <div className="aspect-[2/1] rounded-lg bg-mint" />;
  }

  const go = (step: number) => setIndex((i) => (i + step + count) % count);

  return (
    <div
      className="flex flex-col gap-2.5 outline-none"
      tabIndex={count > 1 ? 0 : undefined}
      aria-label={count > 1 ? "Photo gallery, use arrow keys to browse" : undefined}
      onKeyDown={(event) => {
        if (count < 2) return;
        if (event.key === "ArrowLeft") go(-1);
        if (event.key === "ArrowRight") go(1);
      }}
    >
      <div className="relative aspect-[2/1] overflow-hidden rounded-lg bg-charcoal">
        <Image
          src={current.url}
          alt={`${title}, photo ${index + 1} of ${count}`}
          fill
          priority
          sizes="(min-width: 1024px) 700px, 100vw"
          className="object-cover"
        />
        {featured && (
          <Badge className="absolute top-3.5 left-3.5 h-6 bg-[#3fb85a] px-3 text-[0.71875rem] font-semibold">Featured</Badge>
        )}
        {count > 1 && (
          <>
            <Button size="icon" variant="secondary" aria-label="Previous photo" onClick={() => go(-1)} className={`${arrowClass} left-3.5`}>
              <ChevronLeft strokeWidth={2.6} />
            </Button>
            <Button size="icon" variant="secondary" aria-label="Next photo" onClick={() => go(1)} className={`${arrowClass} right-3.5`}>
              <ChevronRight strokeWidth={2.6} />
            </Button>
          </>
        )}
        <span className="absolute bottom-3.5 left-3.5 rounded-md bg-black/60 px-2.5 py-1 text-[0.71875rem] font-medium text-white">
          {index + 1} / {count}
        </span>
      </div>
      {count > 1 && (
        <ul className="grid grid-cols-5 gap-2.5">
          {photos.slice(0, 10).map((photo, i) => (
            <li key={photo.id}>
              <button
                type="button"
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === index}
                onClick={() => setIndex(i)}
                className={`relative block aspect-[127/75] w-full overflow-hidden rounded-md border-2 ${
                  i === index ? "border-[#4fc35f]" : "border-transparent opacity-80 hover:opacity-100"
                }`}
              >
                <Image src={photo.url} alt="" fill sizes="140px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
