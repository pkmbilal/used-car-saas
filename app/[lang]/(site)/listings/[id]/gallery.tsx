"use client";

import Image from "next/image";
import { useRef, useState, type KeyboardEvent, type TouchEvent } from "react";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { useDictionary } from "@/components/i18n-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { fmt } from "@/lib/dictionary";

type Props = {
  title: string;
  photos: { id: string; url: string }[];
  featured?: boolean;
};

const arrowClass =
  "absolute top-[calc(50%-18px)] size-9 rounded-full bg-white text-brand shadow-[0_2px_8px_rgba(0,0,0,.2)] hover:bg-mint";

// Lighter on phones so the controls don't cover the photo.
const mobileFadeClass = "opacity-60 hover:opacity-100 focus-visible:opacity-100 sm:opacity-100";

const aspectClass ="aspect-[4/3] sm:aspect-[16/10]";

// On RTL pages the next photo is to the left.
function forward(): number {
  return document.documentElement.dir === "rtl" ? -1 : 1;
}

export function Gallery({ title, photos, featured = false }: Props) {
  const { t } = useDictionary();
  const g = t.listingPage.gallery;
  const [index, setIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const current = photos[index];
  const count = photos.length;

  if (!current) {
    return <div className={`${aspectClass} rounded-lg bg-mint`} />;
  }

  const go = (step: number) => setIndex((i) => (i + step + count) % count);

  function onArrowKey(event: KeyboardEvent) {
    if (count < 2) return;
    if (event.key === "ArrowLeft") go(-forward());
    if (event.key === "ArrowRight") go(forward());
  }

  function onTouchStart(event: TouchEvent) {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }

  // A horizontal swipe of 50px or more moves one photo, like the arrow keys.
  function onTouchEnd(event: TouchEvent) {
    const start = touchStartX.current;
    touchStartX.current = null;
    const end = event.changedTouches[0]?.clientX;
    if (start === null || end === undefined || count < 2) return;
    const delta = end - start;
    if (Math.abs(delta) < 50) return;
    go(delta < 0 ? forward() : -forward());
  }

  const alt = fmt(g.photoAlt, { title, index: index + 1, count });

  return (
    <div
      className="flex flex-col gap-2.5 outline-none"
      tabIndex={count > 1 ? 0 : undefined}
      aria-label={count > 1 ? g.label : undefined}
      onKeyDown={onArrowKey}
    >
      <div className={`relative ${aspectClass} overflow-hidden rounded-lg bg-charcoal`}>
        <button
          type="button"
          aria-label={g.fullscreen}
          onClick={() => setFullscreen(true)}
          className="absolute inset-0 cursor-zoom-in"
        >
          <Image
            src={current.url}
            alt={alt}
            fill
            preload
            sizes="(min-width: 1024px) 760px, 100vw"
            className="object-cover"
          />
        </button>
        {featured && (
          <Badge className="absolute top-3.5 start-3.5 h-6 bg-[#3fb85a] px-3 text-caption font-semibold">{t.common.featured}</Badge>
        )}
        <Button
          size="icon"
          variant="secondary"
          aria-label={g.fullscreen}
          onClick={() => setFullscreen(true)}
          className={`absolute top-3.5 end-3.5 size-9 rounded-full bg-white text-brand shadow-[0_2px_8px_rgba(0,0,0,.2)] hover:bg-mint ${mobileFadeClass}`}
        >
          <Maximize2 strokeWidth={2.2} />
        </Button>
        {count > 1 && (
          <>
            <Button size="icon" variant="secondary" aria-label={g.previous} onClick={() => go(-1)} className={`${arrowClass} ${mobileFadeClass} start-3.5`}>
              <ChevronLeft strokeWidth={2.6} />
            </Button>
            <Button size="icon" variant="secondary" aria-label={g.next} onClick={() => go(1)} className={`${arrowClass} ${mobileFadeClass} end-3.5`}>
              <ChevronRight strokeWidth={2.6} />
            </Button>
          </>
        )}
        <span className="pointer-events-none absolute bottom-3.5 start-3.5 rounded-md bg-black/60 px-2.5 py-1 text-caption font-medium text-white">
          <bdi dir="ltr">{index + 1} / {count}</bdi>
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

      <Dialog open={fullscreen} onOpenChange={setFullscreen}>
        <DialogContent
          showCloseButton={false}
          onKeyDown={(event) => {
            // React bubbles portal events to the gallery's own handler too.
            event.stopPropagation();
            onArrowKey(event);
          }}
          className="top-0 left-0 flex h-dvh w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 bg-black p-0 text-white ring-0 sm:max-w-none"
        >
          <DialogTitle className="sr-only">{title}</DialogTitle>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-caption font-medium text-white/80">
              <bdi dir="ltr">{index + 1} / {count}</bdi>
            </span>
            <DialogClose asChild>
              <Button size="icon" variant="ghost" aria-label={g.close} className="size-10 rounded-full text-white hover:bg-white/15 hover:text-white">
                <X className="size-5" />
              </Button>
            </DialogClose>
          </div>
          <div className="relative min-h-0 flex-1" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            <Image src={current.url} alt={alt} fill sizes="100vw" className="object-contain" />
            {count > 1 && (
              <>
                <Button size="icon" variant="secondary" aria-label={g.previous} onClick={() => go(-1)} className={`${arrowClass} start-3 sm:start-5`}>
                  <ChevronLeft strokeWidth={2.6} />
                </Button>
                <Button size="icon" variant="secondary" aria-label={g.next} onClick={() => go(1)} className={`${arrowClass} end-3 sm:end-5`}>
                  <ChevronRight strokeWidth={2.6} />
                </Button>
              </>
            )}
          </div>
          {count > 1 && (
            <ul className="flex gap-2 overflow-x-auto px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
              {photos.map((photo, i) => (
                <li key={photo.id} className="shrink-0">
                  <button
                    type="button"
                    aria-label={fmt(g.show, { index: i + 1 })}
                    aria-current={i === index}
                    onClick={() => setIndex(i)}
                    className={`relative block h-14 w-20 overflow-hidden rounded-md border-2 ${
                      i === index ? "border-[#4fc35f]" : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <Image src={photo.url} alt="" fill sizes="80px" className="object-cover" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
