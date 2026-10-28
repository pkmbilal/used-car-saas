import Link from "@/components/locale-link";
import { count } from "@/lib/dictionary";
import type { Dictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";

export function RangeTabs({
  ranges,
  active,
  sort,
  t,
  locale,
}: {
  ranges: readonly number[];
  active: number;
  sort: string;
  t: Dictionary;
  locale: Locale;
}) {
  return (
    <nav
      aria-label={t.insights.rangeLabel}
      className="inline-flex gap-1 rounded-full bg-white p-1 shadow-sm ring-1 ring-zinc-200 print:hidden dark:bg-zinc-900 dark:ring-zinc-700"
    >
      {ranges.map((days) => {
        const current = days === active;
        return (
          <Link
            key={days}
            href={`/dashboard/insights?range=${days}&sort=${sort}`}
            aria-current={current ? "page" : undefined}
            className={`inline-flex min-h-9 items-center rounded-full px-3.5 text-sm font-medium whitespace-nowrap transition-colors ${
              current
                ? "bg-zinc-900 text-white hover:text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            }`}
          >
            {count(locale, days, t.insights.range)}
          </Link>
        );
      })}
    </nav>
  );
}
