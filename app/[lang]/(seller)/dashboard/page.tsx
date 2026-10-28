import { ArrowUpRight, ChartLine, Lock, Plus, Store, Upload, type LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "@/components/locale-link";
import { getMyPendingAddons } from "@/lib/addons";
import { requireSeller } from "@/lib/auth";
import { carName } from "@/lib/car-names";
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
import { PlanSummary } from "./plan-summary";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.sellerCenter.metaTitle, robots: noIndex };
}

const OVERVIEW_DAYS = 7;
const STATUSES = ["active", "draft", "sold", "removed"] as const;
const cardClass =
  "rounded-2xl bg-card p-4 shadow-[0_2px_10px_rgba(20,30,25,.06)] ring-1 ring-black/5 sm:p-5 dark:ring-white/10";
const linkClass =
  "inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline dark:text-lime";

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
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        {name ? fmt(o.greeting, { name }) : s.title}
      </h1>
      <p className="mt-1.5 text-zinc-600 dark:text-zinc-400">{o.intro}</p>

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
        <section className="mt-6">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-lg font-semibold">{o.last7}</h2>
            <Link href="/dashboard/insights" className={linkClass}>
              {o.fullInsights}
              <ArrowUpRight className="size-4 rtl:-scale-x-100" aria-hidden />
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
            <TrendChart points={insights.daily.map(({ day, views, contacts }) => ({ day, views, contacts }))} />
          </div>
        </section>
      ) : (
        <InsightsTeaser t={t} />
      )}

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section className={cardClass}>
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-lg font-semibold">{o.listingsTitle}</h2>
            <Link href="/dashboard/listings" className={linkClass}>
              {o.manage}
            </Link>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3">
            {STATUSES.map((status) => (
              <div key={status} className="rounded-xl bg-canvas px-3 py-2.5 dark:bg-zinc-900">
                <dt className="text-xs text-muted-foreground">{o.status[status]}</dt>
                <dd className="mt-0.5 text-2xl font-semibold tabular-nums">
                  {formatNumber(locale, listings.filter((listing) => listing.status === status).length)}
                </dd>
              </div>
            ))}
          </dl>
        </section>

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

function TopListings({ rows, t, locale }: { rows: ListingInsight[]; t: Dictionary; locale: Locale }) {
  const o = t.sellerCenter.overview;
  const shown = rows.filter((row) => row.views > 0);
  return (
    <section className={cardClass}>
      <h2 className="text-lg font-semibold">{o.topTitle}</h2>
      {shown.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">{o.topEmpty}</p>
      ) : (
        <ol className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800">
          {shown.map(({ listing, views }) => {
            const cover = listing.images[0];
            return (
              <li key={listing.id}>
                <Link
                  href={`/listings/${listing.id}`}
                  className="flex items-center gap-3 py-2.5 hover:text-brand dark:hover:text-lime"
                >
                  <span className="relative aspect-[4/3] w-16 shrink-0 overflow-hidden rounded-lg bg-mint dark:bg-zinc-800">
                    {cover && <Image src={cover.url} alt="" fill sizes="64px" className="object-cover" />}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {carName(locale, listing.make, listing.model, listing.year)}
                  </span>
                  <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
                    {count(locale, views, o.views)}
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
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {actions.map(({ href, label, icon: Icon, flip }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium ring-1 ring-line transition-colors hover:bg-forest/5 hover:ring-forest/30 dark:ring-zinc-700 dark:hover:bg-zinc-800"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-mint text-brand dark:bg-lime/10 dark:text-lime">
                <Icon className={`size-4 ${flip ? "rtl:-scale-x-100" : ""}`} aria-hidden />
              </span>
              {label}
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
    <section className="relative mt-6 overflow-hidden rounded-2xl bg-gradient-to-br from-forest via-forest to-brand p-5 text-white shadow-lg shadow-forest/20">
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
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 self-start rounded-full bg-lime px-5 text-sm font-semibold text-forest hover:text-forest hover:brightness-105 sm:self-auto"
        >
          {teaser.cta}
          <ArrowUpRight className="size-4 rtl:-scale-x-100" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
