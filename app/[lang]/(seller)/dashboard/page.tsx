import { ArrowUpRight, ChartLine, ChevronRight, Crown, Lock, Plus, Store, Upload, type LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "@/components/locale-link";
import { getMyPendingAddons } from "@/lib/addons";
import { requireSeller } from "@/lib/auth";
import { listingName } from "@/lib/car-names";
import { count, fmt, formatNumber } from "@/lib/dictionary";
import type { Dictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n-server";
import { buildAttentionItems, getSellerInsights, sortListingInsights, type ListingInsight } from "@/lib/insights";
import { getSellerListings } from "@/lib/listings";
import { getPendingOfferCounts } from "@/lib/offers";
import { getListingQuota, hasInsights, isDealerPlan } from "@/lib/plans";
import { noIndex } from "@/lib/seo";
import { AttentionList } from "./insights/attention-list";
import { KpiTiles } from "./insights/kpi-tiles";
import { TrendChart } from "./insights/trend-chart";
import { PageHeader } from "./page-header";
import { PlanSummary } from "./plan-summary";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.sellerCenter.metaTitle, robots: noIndex };
}

const OVERVIEW_DAYS = 7;
const STATUSES = ["active", "draft", "sold", "removed"] as const;
const STATUS_COLORS: Record<(typeof STATUSES)[number], string> = {
  active: "bg-brand dark:bg-lime",
  draft: "bg-amber-400",
  sold: "bg-sky-500",
  removed: "bg-zinc-300 dark:bg-zinc-600",
};
const cardClass =
  "rounded-2xl bg-card p-4 shadow-[0_2px_10px_rgba(20,30,25,.06)] ring-1 ring-black/5 sm:p-5 dark:ring-white/10";
const pillLinkClass =
  "inline-flex min-h-9 shrink-0 items-center gap-1 rounded-full border border-line bg-white px-3.5 text-sm font-semibold text-zinc-800 shadow-sm transition-colors hover:border-forest/30 hover:bg-forest/5 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800";

export default async function OverviewPage() {
  const { user, profile } = await requireSeller();
  const { t, locale } = await getDictionary();
  const s = t.sellerCenter;
  const o = s.overview;
  const [listings, quota, pendingAddons, pendingOffers] = await Promise.all([
    getSellerListings(user.id),
    getListingQuota(),
    getMyPendingAddons(),
    getPendingOfferCounts(user.id),
  ]);
  const insights = hasInsights(profile.plan) ? await getSellerInsights(listings, OVERVIEW_DAYS) : null;
  const attention = buildAttentionItems(
    listings,
    quota,
    [...pendingOffers.values()].reduce((total, n) => total + n, 0),
  );
  const dealer = isDealerPlan(profile.plan);
  const name = (profile.business_name || profile.full_name || "").trim();

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        eyebrow={fmt(t.plans.summaryPlan, { plan: t.plans.labels[profile.plan] })}
        eyebrowIcon={Crown}
        title={name ? fmt(o.greeting, { name }) : s.title}
        intro={o.intro}
      />

      <PlanSummary
        listings={listings}
        quota={quota}
        pendingAddons={pendingAddons}
        suspended={!!profile.suspended_at}
        showCard={!insights}
        t={t}
        locale={locale}
      />

      {insights ? (
        <section className="mt-8">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{o.last7}</h2>
            <Link href="/dashboard/insights" className={pillLinkClass}>
              {o.fullInsights}
              <ArrowUpRight className="size-3.5 rtl:-scale-x-100" aria-hidden />
            </Link>
          </div>
          <KpiTiles
            current={insights.current}
            previous={insights.previous}
            range={count(locale, insights.days, t.insights.range)}
            t={t}
            locale={locale}
          />
          <div className={`mt-4 ${cardClass}`}>
            <h3 className="mb-3 text-base font-semibold">{t.insights.chart.title}</h3>
            <TrendChart points={insights.daily.map(({ day, views, contacts }) => ({ day, views, contacts }))} />
          </div>
        </section>
      ) : (
        <InsightsTeaser t={t} />
      )}

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <ListingsSummary listings={listings} t={t} locale={locale} />

        {insights ? (
          <TopListings rows={sortListingInsights(insights.listings, "views").slice(0, 3)} t={t} locale={locale} />
        ) : (
          <QuickActions dealer={dealer} sellerId={user.id} t={t} />
        )}
      </div>

      <div className="mt-6">
        <AttentionList items={attention} t={t} locale={locale} />
      </div>

      {insights && (
        <div className="mt-6">
          <QuickActions dealer={dealer} sellerId={user.id} t={t} />
        </div>
      )}
    </div>
  );
}

function ListingsSummary({
  listings,
  t,
  locale,
}: {
  listings: { status: string }[];
  t: Dictionary;
  locale: Locale;
}) {
  const o = t.sellerCenter.overview;
  const counts = STATUSES.map((status) => ({
    status,
    n: listings.filter((listing) => listing.status === status).length,
  }));
  const total = counts.reduce((sum, { n }) => sum + n, 0);

  return (
    <section className={cardClass}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{o.listingsTitle}</h2>
        <Link href="/dashboard/listings" className={pillLinkClass}>
          {o.manage}
          <ChevronRight className="size-3.5 rtl:-scale-x-100" aria-hidden />
        </Link>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">{count(locale, total, t.dashboard.listingCount)}</p>
      {/* The status mix, start to end in the order of the tiles below. */}
      <div aria-hidden className="mt-2 flex h-2 gap-0.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        {total > 0 &&
          counts
            .filter(({ n }) => n > 0)
            .map(({ status, n }) => (
              <span key={status} className={STATUS_COLORS[status]} style={{ width: `${(n / total) * 100}%` }} />
            ))}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3">
        {counts.map(({ status, n }) => (
          <div key={status} className="rounded-xl bg-canvas px-3 py-2.5 ring-1 ring-line/60 dark:bg-zinc-900 dark:ring-zinc-800">
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={`size-2 rounded-full ${STATUS_COLORS[status]}`} aria-hidden />
              {o.status[status]}
            </dt>
            <dd className="mt-1 text-2xl font-bold tracking-tight tabular-nums">{formatNumber(locale, n)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function TopListings({ rows, t, locale }: { rows: ListingInsight[]; t: Dictionary; locale: Locale }) {
  const o = t.sellerCenter.overview;
  const shown = rows.filter((row) => row.views > 0);
  const maxViews = Math.max(1, ...shown.map((row) => row.views));
  return (
    <section className={cardClass}>
      <h2 className="text-lg font-semibold">{o.topTitle}</h2>
      {shown.length === 0 ? (
        <div className="mt-4 flex flex-col items-center rounded-xl border-2 border-dashed border-line px-4 py-8 text-center dark:border-zinc-800">
          <span className="grid size-11 place-items-center rounded-full bg-mint text-brand dark:bg-lime/10 dark:text-lime">
            <ChartLine className="size-5" aria-hidden />
          </span>
          <p className="mt-3 max-w-xs text-sm text-zinc-600 dark:text-zinc-400">{o.topEmpty}</p>
        </div>
      ) : (
        <ol className="mt-3 flex flex-col gap-1">
          {shown.map(({ listing, views }, i) => {
            const cover = listing.images[0];
            return (
              <li key={listing.id}>
                <Link
                  href={`/listings/${listing.id}`}
                  className="group flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-canvas dark:hover:bg-zinc-900"
                >
                  <span className="relative aspect-[4/3] w-20 shrink-0 overflow-hidden rounded-lg bg-mint dark:bg-zinc-800">
                    {cover && (
                      <Image
                        src={cover.url}
                        alt=""
                        fill
                        sizes="80px"
                        className="object-cover transition-transform motion-safe:group-hover:scale-105"
                      />
                    )}
                    <span className="absolute start-1 top-1 grid size-5 place-items-center rounded-full bg-gradient-to-b from-brand to-forest text-[0.6875rem] font-bold text-white shadow-sm">
                      {formatNumber(locale, i + 1)}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold group-hover:text-brand dark:group-hover:text-lime">
                      {listingName(locale, listing, listing.year)}
                    </span>
                    <span className="mt-1.5 block h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800" aria-hidden>
                      <span
                        className="block h-full rounded-full bg-[var(--viz-1)]"
                        style={{ width: `${(views / maxViews) * 100}%` }}
                      />
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground tabular-nums">
                      {count(locale, views, o.views)}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function QuickActions({ dealer, sellerId, t }: { dealer: boolean; sellerId: string; t: Dictionary }) {
  const o = t.sellerCenter.overview;
  // flip: arrows point the other way on Arabic pages.
  const actions: { href: string; label: string; icon: LucideIcon; flip?: boolean }[] = [
    { href: "/dashboard/listings/new", label: o.actions.newListing, icon: Plus },
    ...(dealer
      ? [
          { href: "/dashboard/listings/import", label: o.actions.import, icon: Upload },
          { href: "/dashboard/storefront", label: o.actions.storefront, icon: Store },
          { href: `/sellers/${sellerId}`, label: o.actions.viewStorefront, icon: ArrowUpRight, flip: true },
        ]
      : []),
  ];
  return (
    <section className={cardClass}>
      <h2 className="text-lg font-semibold">{o.quickActions}</h2>
      <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
        {actions.map(({ href, label, icon: Icon, flip }, i) => (
          <li key={href}>
            <Link
              href={href}
              className="group flex min-h-14 items-center gap-3 rounded-xl bg-canvas px-3 py-2.5 text-sm font-semibold ring-1 ring-line/60 transition-all hover:bg-white hover:shadow-[0_8px_24px_rgba(20,30,25,.10)] hover:ring-forest/25 motion-safe:hover:-translate-y-px dark:bg-zinc-900 dark:ring-zinc-800 dark:hover:bg-zinc-800"
            >
              <span
                className={`grid size-9 shrink-0 place-items-center rounded-lg ${
                  i === 0
                    ? "bg-gradient-to-b from-brand to-forest text-white shadow-sm shadow-forest/25"
                    : "bg-mint text-brand dark:bg-lime/10 dark:text-lime"
                }`}
              >
                <Icon className={`size-4 ${flip ? "rtl:-scale-x-100" : ""}`} aria-hidden />
              </span>
              <span className="flex-1">{label}</span>
              <ChevronRight
                className="size-4 text-zinc-400 transition-transform rtl:-scale-x-100 motion-safe:group-hover:translate-x-0.5 motion-safe:rtl:group-hover:-translate-x-0.5"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

// Free and Dealer: a compact version of the Insights teaser.
function InsightsTeaser({ t }: { t: Dictionary }) {
  const teaser = t.insights.teaser;
  return (
    <section className="relative mt-6 overflow-hidden rounded-2xl bg-gradient-to-br from-forest via-forest to-brand p-5 text-white shadow-lg shadow-forest/20 sm:p-6">
      <span
        aria-hidden
        className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-lime/50 to-transparent"
      />
      {/* A faint sample trend line behind the text. */}
      <svg
        aria-hidden
        viewBox="0 0 400 120"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 w-full opacity-30 rtl:-scale-x-100"
      >
        <path d="M0,100 C50,96 80,80 130,82 S210,50 260,56 S340,22 400,14 L400,120 L0,120 Z" fill="currentColor" className="text-lime/30" />
        <path d="M0,100 C50,96 80,80 130,82 S210,50 260,56 S340,22 400,14" fill="none" stroke="currentColor" strokeWidth="2" className="text-lime" />
      </svg>
      <div className="relative">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-lime/15 px-2.5 py-1 text-xs font-semibold text-lime ring-1 ring-lime/30">
          <Lock className="size-3.5" aria-hidden />
          {teaser.badge}
        </span>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <ChartLine className="size-5 text-lime" aria-hidden />
              {teaser.title}
            </h2>
            <p className="mt-1.5 text-sm text-white/80">{teaser.body}</p>
          </div>
          <Link
            href="/pricing"
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 self-start rounded-full bg-gradient-to-b from-lime-light to-lime px-5 text-sm font-semibold text-on-lime shadow-[inset_0_1px_0_rgba(255,255,255,.45)] hover:text-on-lime hover:brightness-105 sm:self-auto"
          >
            {teaser.cta}
            <ArrowUpRight className="size-4 rtl:-scale-x-100" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
