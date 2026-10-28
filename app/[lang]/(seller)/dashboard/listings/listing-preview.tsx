"use client";

import Image from "next/image";
import { Camera, Car, Check, Fuel, MapPin } from "lucide-react";
import { useDictionary } from "@/components/i18n-provider";
import { carName } from "@/lib/car-names";
import { cityName, optionLabel } from "@/lib/dictionary";
import { formatAmount, formatKm } from "@/lib/format";
import type { ListingInput } from "@/lib/listings";

export type PreviewData = {
  make: string;
  model: string;
  year: string;
  mileage: string;
  price: string;
  city: string;
  fuel_type: string;
  transmission: string;
  body_type: string;
  color: string;
  description: string;
  features: string[];
};

const DETAILED_DESCRIPTION = 80;
const ENOUGH_FEATURES = 3;

export function previewFromListing(listing?: ListingInput): PreviewData {
  return {
    make: listing?.make ?? "",
    model: listing?.model ?? "",
    year: listing?.year?.toString() ?? "",
    mileage: listing?.mileage?.toString() ?? "",
    price: listing?.price?.toString() ?? "",
    city: listing?.city ?? "",
    fuel_type: listing?.fuel_type ?? "",
    transmission: listing?.transmission ?? "",
    body_type: listing?.body_type ?? "",
    color: listing?.color ?? "",
    description: listing?.description ?? "",
    features: listing?.features ?? [],
  };
}

export function previewFromForm(form: HTMLFormElement): PreviewData {
  const data = new FormData(form);
  const text = (name: string) => {
    const value = data.get(name);
    return typeof value === "string" ? value.trim() : "";
  };
  return {
    make: text("make"),
    model: text("model"),
    year: text("year"),
    mileage: text("mileage"),
    price: text("price"),
    city: text("city"),
    fuel_type: text("fuel_type"),
    transmission: text("transmission"),
    body_type: text("body_type"),
    color: text("color"),
    description: text("description"),
    features: data.getAll("features").filter((value): value is string => typeof value === "string"),
  };
}

function positive(value: string): number | null {
  const number = Number(value);
  return value !== "" && Number.isFinite(number) && number >= 0 ? number : null;
}

function Skeleton({ className }: { className: string }) {
  return <span aria-hidden className={`inline-block rounded-full bg-zinc-200/80 dark:bg-zinc-800 ${className}`} />;
}

// A client-side copy of components/listing-card.tsx (a server component), fed
// from the form as the seller types.
export function ListingPreview({ data, cover }: { data: PreviewData; cover?: string }) {
  const { t, locale } = useDictionary();
  const f = t.dashboard.form;
  const year = positive(data.year);
  const mileage = positive(data.mileage);
  const price = positive(data.price);
  const name = data.make ? carName(locale, data.make, data.model) : "";

  const checks = [
    { label: f.strength.description, done: data.description.length >= DETAILED_DESCRIPTION },
    { label: f.strength.features, done: data.features.length >= ENOUGH_FEATURES },
    { label: f.strength.color, done: data.color !== "" },
  ];
  const done = checks.filter((check) => check.done).length;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-semibold">{f.previewTitle}</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{f.previewHint}</p>
      </div>

      <div className="overflow-hidden rounded-lg bg-white text-ink shadow-[0_10px_24px_rgba(20,30,25,.1)] dark:bg-zinc-900 dark:text-zinc-100">
        <div className="relative flex aspect-[3/2] flex-col items-center justify-center gap-2 bg-mint text-forest/60 dark:bg-zinc-800 dark:text-zinc-400">
          {cover ? (
            <Image src={cover} alt={name} fill sizes="340px" className="object-cover" />
          ) : (
            <>
              <Camera className="size-7" aria-hidden />
              <span className="text-xs font-medium">{f.photosAfterSave}</span>
            </>
          )}
        </div>
        <div className="flex flex-col px-4 pt-3.5 pb-4">
          <p className="truncate text-sm font-semibold">{name || <Skeleton className="h-3.5 w-36" />}</p>
          <p className="mt-2 flex flex-wrap items-center gap-x-2 text-caption text-muted-foreground">
            {year !== null ? <span>{year}</span> : <Skeleton className="h-2.5 w-8" />}
            <span aria-hidden>·</span>
            {mileage !== null ? <span>{formatKm(mileage, locale)}</span> : <Skeleton className="h-2.5 w-14" />}
            {data.transmission && (
              <>
                <span aria-hidden>·</span>
                <span>{optionLabel(t.options.transmission, data.transmission)}</span>
              </>
            )}
          </p>
          <p className="mt-3 text-base font-bold text-brand dark:text-lime">
            {price !== null ? (
              <span className="inline-flex items-baseline gap-[0.2em] whitespace-nowrap rtl:flex-row-reverse">
                <span
                  aria-hidden
                  className="inline-block h-[0.8em] w-[0.715em] shrink-0 bg-current [mask:url(/riyal-symbol.png)_center/contain_no-repeat]"
                />
                <span className="sr-only">{t.common.sarSr}</span>
                {formatAmount(price)}
              </span>
            ) : (
              <Skeleton className="h-4 w-20" />
            )}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-muted-foreground">
            {data.body_type && (
              <span className="flex items-center gap-1.5">
                <Car className="size-3" aria-hidden />
                {optionLabel(t.options.bodyType, data.body_type)}
              </span>
            )}
            {data.fuel_type && (
              <span className="flex items-center gap-1.5">
                <Fuel className="size-3" aria-hidden />
                {optionLabel(t.options.fuel, data.fuel_type)}
              </span>
            )}
            {data.city ? (
              <span className="flex items-center gap-1.5">
                <MapPin className="size-3" aria-hidden />
                {cityName(t, data.city)}
              </span>
            ) : (
              <Skeleton className="h-2.5 w-16" />
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold">{f.strengthTitle}</span>
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {done} / {checks.length}
          </span>
        </div>
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand to-lime transition-[width] duration-500 rtl:bg-gradient-to-l"
            style={{ width: `${(done / checks.length) * 100}%` }}
          />
        </div>
        <ul className="mt-3 flex flex-col gap-2">
          {checks.map((check) => (
            <li key={check.label} className="flex items-center gap-2 text-sm">
              <span
                className={`grid size-4.5 place-items-center rounded-full transition ${
                  check.done
                    ? "bg-brand text-white dark:bg-lime dark:text-on-lime"
                    : "border border-zinc-300 dark:border-zinc-700"
                }`}
              >
                {check.done && <Check className="size-3" strokeWidth={3} aria-hidden />}
              </span>
              <span className={check.done ? "" : "text-zinc-500 dark:text-zinc-400"}>{check.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
