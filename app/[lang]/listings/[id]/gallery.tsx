"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useDictionary } from "@/components/i18n-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fmt } from "@/lib/dictionary";

type Props = {
  title: string;
  photos: { id: string; url: string }[];
  featured?: boolean;
};

const arrowClass =
  "absolute top-[calc(50%-18px)] size-9 rounded-full bg-white text-brand shadow-[0_2px_8px_rgba(0,0,0,.2)] hover:bg-mint";

export function Gallery({ title, photos, featured = false }: Props) {
  const { t } = useDictionary();
  const g = t.listingPage.gallery;
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
      aria-label={count > 1 ? g.label : undefined}
      onKeyDown={(event) => {
        if (count < 2) return;
        // On RTL pages the next photo is to the left.
        const forward = document.documentElement.dir === "rtl" ? -1 : 1;
        if (event.key === "ArrowLeft") go(-forward);
        if (event.key === "ArrowRight") go(forward);
      }}
    >
      <div className="relative aspect-[2/1] overflow-hidden rounded-lg bg-charcoal">
        <Image
          src={current.url}
          alt={fmt(g.photoAlt, { title, index: index + 1, count })}
          fill
          preload
          sizes="(min-width: 1024px) 700px, 100vw"
          className="object-cover"
        />
        {featured && (
          <Badge className="absolute top-3.5 start-3.5 h-6 bg-[#3fb85a] px-3 text-caption font-semibold">{t.common.featured}</Badge>
        )}
        {count > 1 && (
          <>
            <Button size="icon" variant="secondary" aria-label={g.previous} onClick={() => go(-1)} className={`${arrowClass} start-3.5`}>
              <ChevronLeft strokeWidth={2.6} />
            </Button>
            <Button size="icon" variant="secondary" aria-label={g.next} onClick={() => go(1)} className={`${arrowClass} end-3.5`}>
              <ChevronRight strokeWidth={2.6} />
            </Button>
          </>
        )}
        <span className="absolute bottom-3.5 start-3.5 rounded-md bg-black/60 px-2.5 py-1 text-caption font-medium text-white">
          {index + 1} / {count}
        </span>
      </div>
      {count > 1 && (
        <ul className="grid grid-cols-5 gap-2.5">
          {photos.slice(0, 10).map((photo, i) => (
            <li key={photo.id}>
              <button
                type="button"
                aria-label={fmt(g.show, { index: i + 1 })}
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
