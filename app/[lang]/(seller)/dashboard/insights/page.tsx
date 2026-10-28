import { ArrowUpRight, Crown, Download, Lock } from "lucide-react";
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
import { Notice } from "../notice";
import { PageHeader } from "../page-header";
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
      <p className="hidden text-sm text-zinc-500 print:block">
        {[profile.business_name ?? profile.full_name, t.insights.report.title].filter(Boolean).join(" · ")}
      </p>
      <PageHeader
        eyebrow={fmt(t.plans.summaryPlan, { plan: t.plans.labels[profile.plan] })}
        eyebrowIcon={Crown}
        title={t.insights.title}
        intro={
          <>
            {fmt(t.insights.subtitle, { range: rangeLabel })}{" "}
            <span className="whitespace-nowrap">
              ({fmt(t.insights.report.period, { from: formatDay(firstDay, locale), to: formatDay(lastDay, locale) })})
            </span>
          </>
        }
      />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <RangeTabs ranges={ranges} active={insights.days} sort={sort} t={t} locale={locale} />
        {report && (
          <div className="flex flex-wrap gap-2">
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
      </div>

      {firstDay < INSIGHTS_TRACKING_SINCE && (
        <Notice tone="info" className="mt-5">
          {fmt(t.insights.trackingSince, { date: formatDay(INSIGHTS_TRACKING_SINCE, locale) })}
        </Notice>
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
      <PageHeader eyebrow={teaser.badge} eyebrowIcon={Lock} title={t.insights.title} />

      <div className="relative mt-6 overflow-hidden rounded-2xl ring-1 ring-black/5 dark:ring-white/10">
        <div aria-hidden className="pointer-events-none grid gap-3 p-4 blur-sm select-none sm:p-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[1240, 86, 31, 9].map((n, i) => (
              <div
                key={n}
                className={`rounded-xl p-4 ring-1 ${
                  i === 0
                    ? "bg-gradient-to-br from-forest to-brand text-white ring-transparent"
                    : "bg-card ring-black/5 dark:ring-white/10"
                }`}
              >
                <div className={`h-2.5 w-16 rounded-full ${i === 0 ? "bg-white/30" : "bg-zinc-200 dark:bg-zinc-700"}`} />
                <p className="mt-3 text-3xl font-bold tabular-nums">{n}</p>
              </div>
            ))}
          </div>
          <div className="relative h-44 overflow-hidden rounded-xl bg-card ring-1 ring-black/5 dark:ring-white/10">
            <svg viewBox="0 0 400 120" preserveAspectRatio="none" className="absolute inset-0 size-full">
              <path d="M0,95 C40,90 60,70 100,72 S160,40 200,48 S270,20 310,30 S370,12 400,8 L400,120 L0,120 Z" fill="var(--viz-1)" opacity="0.15" />
              <path d="M0,95 C40,90 60,70 100,72 S160,40 200,48 S270,20 310,30 S370,12 400,8" fill="none" stroke="var(--viz-1)" strokeWidth="2.5" />
              <path d="M0,110 C50,108 90,100 140,102 S230,88 280,90 S360,78 400,74" fill="none" stroke="var(--viz-3)" strokeWidth="2.5" />
            </svg>
          </div>
        </div>

        <div className="absolute inset-0 grid place-items-center bg-white/55 p-6 text-center backdrop-blur-[2px] dark:bg-zinc-950/60">
          <div className="relative max-w-md overflow-hidden rounded-2xl bg-gradient-to-br from-forest via-forest to-brand p-6 text-white shadow-xl shadow-forest/25">
            <span
              aria-hidden
              className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-lime/50 to-transparent"
            />
            <span className="inline-flex items-center gap-1.5 rounded-full bg-lime/15 px-2.5 py-1 text-xs font-semibold text-lime ring-1 ring-lime/30">
              <Lock className="size-3.5" aria-hidden />
              {teaser.badge}
            </span>
            <h2 className="mt-3 text-xl font-bold sm:text-2xl">{teaser.title}</h2>
            <p className="mt-2 text-sm text-white/80">{teaser.body}</p>
            <Link
              href="/pricing"
              className="mt-5 inline-flex min-h-11 items-center gap-1.5 rounded-full bg-gradient-to-b from-lime-light to-lime px-5 text-sm font-semibold text-on-lime shadow-[inset_0_1px_0_rgba(255,255,255,.45)] hover:text-on-lime hover:brightness-105"
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
