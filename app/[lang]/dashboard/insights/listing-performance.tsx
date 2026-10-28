import Image from "next/image";
import { ArrowDown } from "lucide-react";
import Link from "@/components/locale-link";
import { carName } from "@/lib/car-names";
import { cityName, fmt, formatNumber } from "@/lib/dictionary";
import type { Dictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";
import type { InsightSort, ListingInsight } from "@/lib/insights";
import { StatusBadge } from "../listings/status-badge";
import { formatRate } from "./kpi-tiles";

export function ListingPerformance({
  rows,
  sort,
  range,
  t,
  locale,
}: {
  rows: ListingInsight[]; // already sorted
  sort: InsightSort;
  range: number;
  t: Dictionary;
  locale: Locale;
}) {
  const c = t.insights.table;
  const columns: { sort: InsightSort; label: string; value: (row: ListingInsight) => string }[] = [
    { sort: "views", label: c.views, value: (row) => formatNumber(locale, row.views) },
    { sort: "contacts", label: c.contacts, value: (row) => formatNumber(locale, row.contacts) },
    { sort: "rate", label: c.rate, value: (row) => formatRate(locale, row.contactRate) },
    { sort: "saves", label: c.saves, value: (row) => formatNumber(locale, row.saves) },
    { sort: "age", label: c.age, value: (row) => (row.daysLive === null ? "–" : formatNumber(locale, row.daysLive)) },
  ];

  return (
    <section className="rounded-2xl bg-card shadow-[0_2px_10px_rgba(20,30,25,.06)] ring-1 ring-black/5 dark:ring-white/10">
      <h2 className="px-4 pt-4 text-lg font-semibold sm:px-5 sm:pt-5">{c.title}</h2>
      {rows.length === 0 ? (
        <p className="px-4 pt-2 pb-5 text-sm text-zinc-600 sm:px-5 dark:text-zinc-400">{c.empty}</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-sm">
            <thead>
              <tr className="border-y border-zinc-100 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                <th scope="col" className="px-4 py-2.5 text-start font-medium sm:ps-5">
                  {c.listing}
                </th>
                {columns.map((column) => (
                  <th
                    key={column.sort}
                    scope="col"
                    aria-sort={column.sort === sort ? "descending" : undefined}
                    className="px-3 py-2.5 text-end font-medium last:pe-4 sm:last:pe-5"
                  >
                    <Link
                      href={`/dashboard/insights?range=${range}&sort=${column.sort}`}
                      scroll={false}
                      aria-label={fmt(c.sortBy, { column: column.label })}
                      className={`inline-flex items-center gap-1 whitespace-nowrap hover:text-zinc-900 dark:hover:text-zinc-100 ${
                        column.sort === sort ? "font-semibold text-zinc-900 dark:text-zinc-100" : ""
                      }`}
                    >
                      {column.label}
                      {column.sort === sort && <ArrowDown className="size-3" aria-hidden />}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {rows.map((row) => {
                const { listing } = row;
                const cover = listing.images[0];
                return (
                  <tr key={listing.id} className="break-inside-avoid">
                    <td className="px-4 py-3 sm:ps-5">
                      <Link
                        href={`/dashboard/listings/${listing.id}/edit`}
                        className="flex min-w-0 items-center gap-3 hover:text-forest dark:hover:text-lime"
                      >
                        <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-mint dark:bg-zinc-800">
                          {cover && <Image src={cover.url} alt="" fill sizes="44px" className="object-cover" />}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium">
                            {carName(locale, listing.make, listing.model, listing.year)}
                          </span>
                          <span className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                            <StatusBadge status={listing.status} />
                            {cityName(t, listing.city)}
                          </span>
                        </span>
                      </Link>
                    </td>
                    {columns.map((column) => (
                      <td
                        key={column.sort}
                        className={`px-3 py-3 text-end tabular-nums last:pe-4 sm:last:pe-5 ${
                          column.sort === sort ? "font-semibold" : "text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        {column.value(row)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
