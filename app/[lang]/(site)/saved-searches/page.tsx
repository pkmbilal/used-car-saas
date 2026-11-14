import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Bell,
  Bookmark,
  Car,
  Heart,
  Info,
  KeyRound,
  Layers,
  Search,
  SlidersHorizontal,
  Trash2,
  Truck,
} from "lucide-react";
import Link from "@/components/locale-link";
import { rich } from "@/components/rich-text";
import { requireUser } from "@/lib/auth";
import { count, fmt, formatNumber } from "@/lib/dictionary";
import type { Dictionary } from "@/lib/dictionaries";
import { formatRelativeDays } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n-server";
import { describeFilters, getSavedSearches, MAX_SAVED_SEARCHES, type SavedSearch } from "@/lib/saved-searches";
import { noIndex } from "@/lib/seo";
import { deleteSavedSearchAction, openSavedSearchAction } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.savedSearches.metaTitle, robots: noIndex };
}

export default async function SavedSearchesPage() {
  const { user } = await requireUser("/saved-searches");
  const searches = await getSavedSearches(user.id);
  const { t, locale } = await getDictionary();
  const s = t.savedSearches;

  // Searches with new cars first; Array.sort is stable, so newest-saved order holds within each group.
  const sorted = [...searches].sort((a, b) => Number(b.newCount > 0) - Number(a.newCount > 0));
  const totalNew = searches.reduce((sum, search) => sum + search.newCount, 0);
  const slotsLeft = Math.max(0, MAX_SAVED_SEARCHES - searches.length);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-forest/5 px-2.5 py-1 text-xs font-semibold tracking-wide text-forest ring-1 ring-forest/15 dark:bg-lime/10 dark:text-lime dark:ring-lime/25">
            <Bookmark className="size-3.5 fill-current" aria-hidden />
            {searches.length > 0 ? count(locale, searches.length, s.savedCount) : s.eyebrow}
          </span>
          <h1 className="mt-2.5 text-3xl font-bold tracking-tight sm:text-4xl">{s.title}</h1>
          <span
            aria-hidden
            className="mt-3 block h-1 w-12 rounded-full bg-gradient-to-r from-brand to-lime rtl:bg-gradient-to-l"
          />
          <p className="mt-4 max-w-2xl text-zinc-600 dark:text-zinc-400">
            {rich(s.intro, {
              max: formatNumber(locale, MAX_SAVED_SEARCHES),
              browse: (
                <Link
                  href="/listings"
                  className="font-medium text-forest underline decoration-forest/30 underline-offset-2 hover:decoration-forest dark:text-lime dark:decoration-lime/40"
                >
                  {s.browsePage}
                </Link>
              ),
            })}
          </p>
        </div>
        {searches.length > 0 && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <PillLink href="/favorites" icon={Heart} label={s.favorites} />
            <PillLink href="/listings" icon={Search} label={s.browseCars} />
          </div>
        )}
      </div>

      {searches.length === 0 ? (
        <EmptySavedSearches t={t} />
      ) : (
        <>
          <section className="relative mt-6 overflow-hidden rounded-2xl bg-gradient-to-br from-forest via-forest to-brand p-3 text-white shadow-lg shadow-forest/20 sm:p-5">
            <span
              aria-hidden
              className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-lime/50 to-transparent"
            />
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <StatTile icon={Bell} label={s.statNew} highlight>
                {formatNumber(locale, totalNew)}
              </StatTile>
              <StatTile icon={Bookmark} label={s.statSaved}>
                {fmt(s.statSavedValue, {
                  count: formatNumber(locale, searches.length),
                  max: formatNumber(locale, MAX_SAVED_SEARCHES),
                })}
              </StatTile>
              <StatTile icon={Layers} label={s.statSlotsLeft}>
                {formatNumber(locale, slotsLeft)}
              </StatTile>
            </div>
          </section>

          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {sorted.map((search) => (
              <SearchCard key={search.id} search={search} t={t} locale={locale} />
            ))}
          </ul>

          <p className="mt-8 flex items-center justify-center gap-2 text-center text-sm text-zinc-500 dark:text-zinc-400">
            <Info className="size-4 shrink-0" aria-hidden />
            {s.footnote}
          </p>
        </>
      )}
    </main>
  );
}

function SearchIcon({ search }: { search: SavedSearch }) {
  if (search.filters.category === "equipment") return <Truck className="size-5" aria-hidden />;
  if (search.filters.type === "rent") return <KeyRound className="size-5" aria-hidden />;
  return <Car className="size-5" aria-hidden />;
}

function SearchCard({ search, t, locale }: { search: SavedSearch; t: Dictionary; locale: Locale }) {
  const s = t.savedSearches;
  const hasNew = search.newCount > 0;
  const parts = describeFilters(search.filters, t, locale);

  return (
    <li
      className={`group flex flex-col rounded-2xl bg-white p-4 shadow-sm ring-1 transition-shadow hover:shadow-md sm:p-5 dark:bg-zinc-900 ${
        hasNew ? "ring-lime/60 dark:ring-lime/40" : "ring-zinc-200 dark:ring-zinc-800"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`grid size-11 shrink-0 place-items-center rounded-xl ${
            hasNew ? "bg-lime/20 text-forest dark:text-lime" : "bg-mint text-brand dark:bg-lime/10 dark:text-lime"
          }`}
        >
          <SearchIcon search={search} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="min-w-0 truncate text-base font-semibold tracking-tight sm:text-lg">{search.name}</h2>
            {hasNew && (
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-lime px-2.5 py-0.5 text-xs font-semibold text-forest">
                <span className="relative flex size-1.5" aria-hidden>
                  <span className="absolute inline-flex size-full rounded-full bg-forest/60 motion-safe:animate-ping" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-forest" />
                </span>
                {fmt(s.newCount, { count: formatNumber(locale, search.newCount) })}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            {fmt(s.savedAgo, { when: formatRelativeDays(search.createdAt, locale) })}
          </p>
        </div>
      </div>

      {parts.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {parts.map((part) => (
            <li
              key={part}
              className="inline-flex max-w-full items-center rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            >
              <span className="truncate">{part}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto flex items-center justify-end gap-2 pt-5">
        <form action={deleteSavedSearchAction.bind(null, search.id)}>
          <button
            type="submit"
            aria-label={s.delete}
            title={s.delete}
            className="grid size-10 place-items-center rounded-full text-zinc-500 ring-1 ring-zinc-200 transition-colors hover:bg-red-50 hover:text-red-600 hover:ring-red-200 dark:text-zinc-400 dark:ring-zinc-700 dark:hover:bg-red-950/40 dark:hover:text-red-400 dark:hover:ring-red-900"
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        </form>
        <form action={openSavedSearchAction.bind(null, search.id)}>
          <button type="submit" className={ctaClass}>
            {hasNew ? s.seeNew : s.open}
            <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden />
          </button>
        </form>
      </div>
    </li>
  );
}

function StatTile({
  icon: Icon,
  label,
  highlight = false,
  children,
}: {
  icon: LucideIcon;
  label: string;
  highlight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`min-w-0 rounded-xl p-2.5 ring-1 backdrop-blur-sm sm:p-3 ${
        highlight ? "bg-lime/15 ring-lime/40" : "bg-white/[0.07] ring-white/15"
      }`}
    >
      <p className="flex items-center gap-1.5 text-xs text-white/70">
        <Icon className={`size-3.5 shrink-0 ${highlight ? "text-lime" : ""}`} aria-hidden />
        <span className="truncate">{label}</span>
      </p>
      <p className="mt-1.5 truncate text-lg font-semibold tracking-tight tabular-nums sm:text-3xl">{children}</p>
    </div>
  );
}

function PillLink({ href, icon: Icon, label }: { href: string; icon: LucideIcon; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-zinc-700 shadow-sm ring-1 ring-zinc-200 transition-colors hover:bg-zinc-50 hover:text-zinc-900 dark:bg-zinc-900 dark:text-zinc-200 dark:ring-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-white"
    >
      <Icon className="size-4" aria-hidden />
      {label}
    </Link>
  );
}

const ctaClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-gradient-to-b from-brand to-forest px-5 text-sm font-semibold text-white shadow-md shadow-forest/25 transition-all hover:text-white hover:shadow-lg hover:shadow-forest/30 hover:brightness-110 focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:outline-none motion-safe:hover:-translate-y-px dark:focus-visible:ring-offset-zinc-950";

function EmptySavedSearches({ t }: { t: Dictionary }) {
  const s = t.savedSearches;
  const steps: { icon: LucideIcon; text: string }[] = [
    { icon: SlidersHorizontal, text: s.step1 },
    { icon: Bookmark, text: s.step2 },
    { icon: Bell, text: s.step3 },
  ];

  return (
    <div className="mt-8 flex flex-col items-center rounded-2xl border-2 border-dashed border-line px-6 py-14 text-center dark:border-zinc-800">
      <span className="grid size-16 place-items-center rounded-full bg-mint text-brand dark:bg-lime/10 dark:text-lime">
        <Bookmark className="size-8" aria-hidden />
      </span>
      <h2 className="mt-5 text-xl font-semibold tracking-tight">{s.emptyTitle}</h2>
      <p className="mt-2 max-w-sm text-zinc-600 dark:text-zinc-400">{s.emptyText}</p>

      <p className="mt-8 text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
        {s.howItWorks}
      </p>
      <ol className="mt-3 grid w-full max-w-2xl gap-3 sm:grid-cols-3">
        {steps.map(({ icon: Icon, text }, index) => (
          <li
            key={text}
            className="flex items-center gap-3 rounded-xl bg-white p-3 text-start text-sm shadow-sm ring-1 ring-zinc-200 sm:flex-col sm:text-center dark:bg-zinc-900 dark:ring-zinc-800"
          >
            <span className="relative grid size-9 shrink-0 place-items-center rounded-full bg-forest/5 text-forest dark:bg-lime/10 dark:text-lime">
              <Icon className="size-4" aria-hidden />
              <span className="absolute -end-1 -top-1 grid size-4 place-items-center rounded-full bg-forest text-[10px] font-bold text-white dark:bg-lime dark:text-forest">
                {index + 1}
              </span>
            </span>
            <span className="text-zinc-700 dark:text-zinc-300">{text}</span>
          </li>
        ))}
      </ol>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/listings" className={ctaClass}>
          <Search className="size-4" aria-hidden />
          {s.browseCars}
        </Link>
        <PillLink href="/favorites" icon={Heart} label={s.favorites} />
      </div>
    </div>
  );
}
