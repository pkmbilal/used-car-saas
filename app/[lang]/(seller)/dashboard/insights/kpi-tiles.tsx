import { ArrowDownRight, ArrowUpRight, Bookmark, Eye, HandCoins, MessageCircle, Percent } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { fmt, formatNumber } from "@/lib/dictionary";
import type { Dictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";
import { contactRate, type InsightsTotals } from "@/lib/insights";

export function formatRate(locale: Locale, rate: number | null): string {
  if (rate === null) return "–";
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA-u-nu-latn" : "en-US", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(rate);
}

export function KpiTiles({
  current,
  previous,
  range,
  t,
  locale,
}: {
  current: InsightsTotals;
  previous: InsightsTotals;
  range: string; // "30 days", already counted
  t: Dictionary;
  locale: Locale;
}) {
  const k = t.insights.kpi;
  const rate = contactRate(current.contacts, current.views);
  const previousRate = contactRate(previous.contacts, previous.views);
  const tiles: { icon: LucideIcon; label: string; value: string; change: Change; detail?: string }[] = [
    {
      icon: Eye,
      label: k.views,
      value: formatNumber(locale, current.views),
      change: change(current.views, previous.views),
    },
    {
      icon: MessageCircle,
      label: k.contacts,
      value: formatNumber(locale, current.contacts),
      change: change(current.contacts, previous.contacts),
      detail: fmt(k.contactsDetail, {
        calls: formatNumber(locale, current.calls),
        whatsapps: formatNumber(locale, current.whatsapps),
      }),
    },
    {
      icon: Percent,
      label: k.contactRate,
      value: formatRate(locale, rate),
      change: rate === null || previousRate === null ? { kind: "none" } : change(rate, previousRate),
      detail: k.contactRateDetail,
    },
    {
      icon: Bookmark,
      label: k.saves,
      value: formatNumber(locale, current.saves),
      change: change(current.saves, previous.saves),
    },
    {
      icon: HandCoins,
      label: k.offers,
      value: formatNumber(locale, current.offers),
      change: change(current.offers, previous.offers),
    },
  ];

  return (
    <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {tiles.map(({ icon: Icon, label, value, change, detail }, i) => {
        // Views lead the row in the brand panel style.
        const hero = i === 0;
        return (
          <li
            key={label}
            className={`relative overflow-hidden rounded-2xl p-4 break-inside-avoid ${
              hero
                ? "bg-gradient-to-br from-forest via-forest to-brand text-white shadow-lg shadow-forest/20 max-sm:col-span-2 print:bg-none print:text-ink print:shadow-none print:ring-1 print:ring-black/10"
                : "bg-card shadow-[0_2px_10px_rgba(20,30,25,.06)] ring-1 ring-black/5 dark:ring-white/10"
            }`}
          >
            {hero && (
              <span
                aria-hidden
                className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-lime/50 to-transparent"
              />
            )}
            <p
              className={`flex items-center gap-2 text-xs font-medium ${
                hero ? "text-white/75 print:text-zinc-600" : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              <span
                className={`grid size-7 shrink-0 place-items-center rounded-lg ${
                  hero ? "bg-white/10 text-lime ring-1 ring-white/15" : "bg-mint text-brand dark:bg-lime/10 dark:text-lime"
                }`}
              >
                <Icon className="size-3.5" aria-hidden />
              </span>
              <span className="truncate">{label}</span>
            </p>
            <p className="mt-3 text-3xl font-bold tracking-tight tabular-nums">{value}</p>
            <ChangeNote change={change} range={range} hero={hero} t={t} locale={locale} />
            {detail && (
              <p className={`mt-1.5 text-xs ${hero ? "text-white/65" : "text-zinc-500 dark:text-zinc-400"}`}>{detail}</p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

type Change = { kind: "none" } | { kind: "new" } | { kind: "same" } | { kind: "ratio"; value: number };

function change(current: number, previous: number): Change {
  if (current === previous) return current === 0 ? { kind: "none" } : { kind: "same" };
  if (previous === 0) return { kind: "new" };
  return { kind: "ratio", value: (current - previous) / previous };
}

function ChangeNote({
  change,
  range,
  hero,
  t,
  locale,
}: {
  change: Change;
  range: string;
  hero: boolean;
  t: Dictionary;
  locale: Locale;
}) {
  if (change.kind === "none") return null;
  const label =
    change.kind === "new"
      ? t.insights.newActivity
      : change.kind === "same"
        ? t.insights.noChange
        : formatRate(locale, Math.abs(change.value));
  const up = change.kind === "new" || (change.kind === "ratio" && change.value > 0);
  const down = change.kind === "ratio" && change.value < 0;
  const Arrow = down ? ArrowDownRight : ArrowUpRight;
  const chip = hero
    ? up
      ? "bg-lime/20 text-lime ring-lime/30"
      : down
        ? "bg-red-400/20 text-red-100 ring-red-300/30"
        : "bg-white/10 text-white/80 ring-white/15"
    : up
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-900"
      : down
        ? "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950 dark:text-red-300 dark:ring-red-900"
        : "bg-zinc-100 text-zinc-600 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700";

  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs">
      <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold ring-1 ${chip}`}>
        {(up || down) && <Arrow className="size-3.5 rtl:-scale-x-100" aria-hidden />}
        {label}
      </span>
      <span className={hero ? "text-white/65 print:text-zinc-500" : "text-zinc-500 dark:text-zinc-400"}>
        {fmt(t.insights.vsPrevious, { range })}
      </span>
    </p>
  );
}
