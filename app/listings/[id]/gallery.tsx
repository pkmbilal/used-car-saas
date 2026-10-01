"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

type Props = {
  title: string;
  photos: { id: string; url: string }[];
  featured?: boolean;
};

const arrowClass =
  "absolute top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-brand shadow-[0_2px_8px_rgba(0,0,0,.2)] hover:bg-mint";

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
          <span className="absolute top-3.5 left-3.5 rounded-full bg-[#3fb85a] px-3 py-1 text-[11.5px] font-semibold text-white">
            Featured
          </span>
        )}
        {count > 1 && (
          <>
            <button type="button" aria-label="Previous photo" onClick={() => go(-1)} className={`${arrowClass} left-3.5`}>
              <ChevronLeftIcon size={14} strokeWidth={2.6} />
            </button>
            <button type="button" aria-label="Next photo" onClick={() => go(1)} className={`${arrowClass} right-3.5`}>
              <ChevronRightIcon size={14} strokeWidth={2.6} />
            </button>
          </>
        )}
        <span className="absolute bottom-3.5 left-3.5 rounded-md bg-black/60 px-2.5 py-1 text-[11.5px] font-medium text-white">
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
