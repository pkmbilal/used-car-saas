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
      {tiles.map(({ icon: Icon, label, value, change, detail }, i) => (
        <li
          key={label}
          className={`rounded-2xl bg-card p-4 shadow-[0_2px_10px_rgba(20,30,25,.06)] ring-1 ring-black/5 dark:ring-white/10 ${
            i === 0 ? "max-sm:col-span-2" : ""
          }`}
        >
          <p className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            <Icon className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{label}</span>
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
          <ChangeNote change={change} range={range} t={t} locale={locale} />
          {detail && <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{detail}</p>}
        </li>
      ))}
    </ul>
  );
}

type Change = { kind: "none" } | { kind: "new" } | { kind: "same" } | { kind: "ratio"; value: number };

function change(current: number, previous: number): Change {
  if (current === previous) return current === 0 ? { kind: "none" } : { kind: "same" };
  if (previous === 0) return { kind: "new" };
  return { kind: "ratio", value: (current - previous) / previous };
}

function ChangeNote({ change, range, t, locale }: { change: Change; range: string; t: Dictionary; locale: Locale }) {
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

  return (
    <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-xs">
      <span
        className={`inline-flex items-center gap-0.5 font-semibold ${
          up ? "text-emerald-700 dark:text-emerald-400" : down ? "text-red-700 dark:text-red-400" : "text-zinc-500"
        }`}
      >
        {(up || down) && <Arrow className="size-3.5 rtl:-scale-x-100" aria-hidden />}
        {label}
      </span>
      <span className="text-zinc-500 dark:text-zinc-400">{fmt(t.insights.vsPrevious, { range })}</span>
    </p>
  );
}
