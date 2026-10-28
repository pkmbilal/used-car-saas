import { formatNumber } from "@/lib/dictionary";
import type { Dictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";
import type { Breakdown } from "@/lib/insights";

// Showroom: totals per make or per city, with a bar for share of views.
export function BreakdownTable({
  title,
  rows,
  name,
  t,
  locale,
}: {
  title: string;
  rows: Breakdown;
  name: (key: string) => string;
  t: Dictionary;
  locale: Locale;
}) {
  const b = t.insights.breakdown;
  const maxViews = Math.max(1, ...rows.map((row) => row.views));

  return (
    <section className="rounded-2xl bg-card p-4 shadow-[0_2px_10px_rgba(20,30,25,.06)] ring-1 ring-black/5 break-inside-avoid sm:p-5 dark:ring-white/10">
      <h2 className="text-lg font-semibold">{title}</h2>
      <table className="mt-3 w-full text-sm">
        <thead>
          <tr className="text-xs text-zinc-500 dark:text-zinc-400">
            <th scope="col" className="pb-2 text-start font-medium">
              {b.name}
            </th>
            <th scope="col" className="pb-2 text-end font-medium">
              {b.listings}
            </th>
            <th scope="col" className="pb-2 text-end font-medium">
              {b.views}
            </th>
            <th scope="col" className="pb-2 text-end font-medium">
              {b.contacts}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-t border-zinc-100 dark:border-zinc-800">
              <td className="py-2.5 pe-3">
                <span className="block truncate font-medium">{name(row.key)}</span>
                <span className="mt-1.5 block h-1 rounded-full bg-zinc-100 dark:bg-zinc-800" aria-hidden>
                  <span
                    className="block h-full rounded-full bg-[var(--viz-1)]"
                    style={{ width: `${(row.views / maxViews) * 100}%` }}
                  />
                </span>
              </td>
              <td className="py-2.5 text-end text-zinc-600 tabular-nums dark:text-zinc-400">
                {formatNumber(locale, row.listings)}
              </td>
              <td className="py-2.5 text-end font-semibold tabular-nums">{formatNumber(locale, row.views)}</td>
              <td className="py-2.5 text-end tabular-nums">{formatNumber(locale, row.contacts)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
