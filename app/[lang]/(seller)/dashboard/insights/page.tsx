import { ArrowUpRight, Download, Lock } from "lucide-react";
import type { Metadata } from "next";
import Link from "@/components/locale-link";
import { requireSeller } from "@/lib/auth";
import { makeName } from "@/lib/car-names";
import { cityName, count, fmt } from "@/lib/dictionary";
import type { Dictionary } from "@/lib/dictionaries";
import { formatDay } from "@/lib/format";
import { localizePath } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n-server";
import {
  breakdownBy,
  buildAttentionItems,
  getSellerInsights,
  INSIGHTS_TRACKING_SINCE,
  isInsightSort,
  sortListingInsights,
} from "@/lib/insights";
import { getSellerListings } from "@/lib/listings";
import { getPendingOfferCounts } from "@/lib/offers";
import { getListingQuota, hasInsightsReport, INSIGHTS_DAYS } from "@/lib/plans";
import { noIndex } from "@/lib/seo";
import { AttentionList } from "./attention-list";
import { BreakdownTable } from "./breakdown-table";
import { KpiTiles } from "./kpi-tiles";
import { ListingPerformance } from "./listing-performance";
import { PrintButton } from "./print-button";
import { RangeTabs } from "./range-tabs";
import { TrendChart } from "./trend-chart";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.insights.metaTitle, robots: noIndex };
}

const DEFAULT_RANGE = 30;

export default async function InsightsPage({ searchParams }: PageProps<"/[lang]/dashboard/insights">) {
  const { user, profile } = await requireSeller("/dashboard/insights");
  const { t, locale } = await getDictionary();
  const ranges = INSIGHTS_DAYS[profile.plan];
  if (ranges.length === 0) return <Teaser t={t} />;

  const params = await searchParams;
  const range =
    ranges.find((days) => String(days) === params.range) ??
    (ranges.includes(DEFAULT_RANGE) ? DEFAULT_RANGE : ranges[ranges.length - 1]);
  const sort = isInsightSort(params.sort) ? params.sort : "views";

  const [listings, quota, pendingOffers] = await Promise.all([
    getSellerListings(user.id),
    getListingQuota(),
    getPendingOfferCounts(user.id),
  ]);
  const insights = await getSellerInsights(listings, range);
  if (!insights) return <Teaser t={t} />;

  const rangeLabel = count(locale, insights.days, t.insights.range);
  const firstDay = insights.daily[0]?.day ?? INSIGHTS_TRACKING_SINCE;
  const lastDay = insights.daily[insights.daily.length - 1]?.day ?? INSIGHTS_TRACKING_SINCE;
  const attention = buildAttentionItems(
    listings,
    quota,
    [...pendingOffers.values()].reduce((total, n) => total + n, 0),
  );
  const report = hasInsightsReport(profile.plan);
  const buttonClass =
    "inline-flex min-h-10 items-center gap-2 rounded-full border border-line bg-white px-4 text-sm font-semibold text-zinc-800 shadow-sm transition-colors hover:border-forest/30 hover:bg-forest/5 focus-visible:ring-2 focus-visible:ring-forest/30 focus-visible:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800";

  return (
    <div data-print-report className="mx-auto w-full max-w-5xl print:max-w-none">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="hidden text-sm text-zinc-500 print:block">
            {[profile.business_name ?? profile.full_name, t.insights.report.title].filter(Boolean).join(" · ")}
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t.insights.title}</h1>
          <p className="mt-1.5 text-zinc-600 dark:text-zinc-400">
            {fmt(t.insights.subtitle, { range: rangeLabel })}{" "}
            <span className="whitespace-nowrap">
              ({fmt(t.insights.report.period, { from: formatDay(firstDay, locale), to: formatDay(lastDay, locale) })})
            </span>
          </p>
        </div>
        <RangeTabs ranges={ranges} active={insights.days} sort={sort} t={t} locale={locale} />
      </div>

      {report && (
        <div className="mt-4 flex flex-wrap gap-2 print:hidden">
          <PrintButton label={t.insights.report.print} className={buttonClass} />
          <a
            href={localizePath(locale, `/dashboard/insights/export?range=${insights.days}`)}
            download
            className={buttonClass}
          >
            <Download className="size-4" aria-hidden />
            {t.insights.report.csv}
          </a>
        </div>
      )}

      {firstDay < INSIGHTS_TRACKING_SINCE && (
        <p className="mt-5 rounded-md bg-sky-50 px-4 py-3 text-sm text-sky-900 dark:bg-sky-950 dark:text-sky-200">
          {fmt(t.insights.trackingSince, { date: formatDay(INSIGHTS_TRACKING_SINCE, locale) })}
        </p>
      )}

      <KpiTiles current={insights.current} previous={insights.previous} range={rangeLabel} t={t} locale={locale} />

      <section className="mt-6 rounded-2xl bg-card p-4 shadow-[0_2px_10px_rgba(20,30,25,.06)] ring-1 ring-black/5 break-inside-avoid sm:p-5 dark:ring-white/10">
        <h2 className="mb-3 text-lg font-semibold">{t.insights.chart.title}</h2>
        <TrendChart
          points={insights.daily.map(({ day, views, contacts }) => ({ day, views, contacts }))}
        />
      </section>

      <div className="mt-6 print:hidden">
        <AttentionList items={attention} t={t} locale={locale} />
      </div>

      <div className="mt-6">
        <ListingPerformance
          rows={sortListingInsights(insights.listings, sort)}
          sort={sort}
          range={insights.days}
          t={t}
          locale={locale}
        />
      </div>

      {report && insights.listings.length > 0 && (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <BreakdownTable
            title={t.insights.breakdown.make}
            rows={breakdownBy(insights.listings, "make")}
            name={(make) => makeName(locale, make)}
            t={t}
            locale={locale}
          />
          <BreakdownTable
            title={t.insights.breakdown.city}
            rows={breakdownBy(insights.listings, "city")}
            name={(city) => cityName(t, city)}
            t={t}
            locale={locale}
          />
        </div>
      )}
    </div>
  );
}

// Free and Dealer: a blurred sample of the page with a link to /pricing.
function Teaser({ t }: { t: Dictionary }) {
  const teaser = t.insights.teaser;
  return (
    <div className="mx-auto w-full max-w-5xl">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t.insights.title}</h1>

      <div className="relative mt-6 overflow-hidden rounded-2xl ring-1 ring-black/5 dark:ring-white/10">
        <div aria-hidden className="pointer-events-none grid gap-3 p-4 blur-sm select-none sm:p-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[1240, 86, 31, 9].map((n) => (
              <div key={n} className="rounded-xl bg-card p-4 ring-1 ring-black/5 dark:ring-white/10">
                <div className="h-2.5 w-16 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                <p className="mt-3 text-2xl font-semibold tabular-nums">{n}</p>
              </div>
            ))}
          </div>
          <div className="h-40 rounded-xl bg-gradient-to-t from-[var(--viz-1)]/20 to-transparent ring-1 ring-black/5 dark:ring-white/10" />
        </div>

        <div className="absolute inset-0 grid place-items-center bg-white/60 p-6 text-center backdrop-blur-[2px] dark:bg-zinc-950/60">
          <div className="max-w-md">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-forest/5 px-2.5 py-1 text-xs font-semibold text-forest ring-1 ring-forest/15 dark:bg-lime/10 dark:text-lime dark:ring-lime/25">
              <Lock className="size-3.5" aria-hidden />
              {teaser.badge}
            </span>
            <h2 className="mt-3 text-xl font-bold sm:text-2xl">{teaser.title}</h2>
            <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">{teaser.body}</p>
            <Link
              href="/pricing"
              className="mt-4 inline-flex min-h-11 items-center gap-1.5 rounded-full bg-gradient-to-b from-brand to-forest px-5 text-sm font-semibold text-white shadow-md shadow-forest/25 hover:text-white hover:brightness-110"
            >
              {teaser.cta}
              <ArrowUpRight className="size-4 rtl:-scale-x-100" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

