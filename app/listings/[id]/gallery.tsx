"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  title: string;
  photos: { id: string; url: string }[];
};

export function Gallery({ title, photos }: Props) {
  const [index, setIndex] = useState(0);
  const current = photos[index];

  if (!current) {
    return <div className="aspect-[4/3] rounded-lg bg-zinc-100 dark:bg-zinc-800" />;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
        <Image
          src={current.url}
          alt={`${title}, photo ${index + 1} of ${photos.length}`}
          fill
          priority
          sizes="(min-width: 1024px) 60vw, 100vw"
          className="object-cover"
        />
      </div>
      {photos.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((photo, i) => (
            <li key={photo.id} className="shrink-0">
              <button
                type="button"
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === index}
                onClick={() => setIndex(i)}
                className={`relative block aspect-[4/3] w-20 overflow-hidden rounded-md ${
                  i === index ? "ring-2 ring-zinc-900 dark:ring-zinc-100" : "opacity-70 hover:opacity-100"
                }`}
              >
                <Image src={photo.url} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
