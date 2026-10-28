import { ArrowUpRight, ChartLine, Crown, FileText, PlusCircle, Send, Star, Store } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "@/components/locale-link";
import { fmt } from "@/lib/dictionary";
import type { Dictionary } from "@/lib/dictionaries";
import { formatDay } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { DRAFT_LIMIT, hasInsights, isDealerPlan, type ListingQuota } from "@/lib/plans";
import { BuyExtraListings, type ExtraListingsOffer } from "./buy-extra-listings";

type Props = {
  quota: ListingQuota;
  openDrafts: number;
  t: Dictionary;
  locale: Locale;
  // null on plans without a listing limit.
  extraListings: ExtraListingsOffer | null;
};

export function PlanCard({ quota, openDrafts, t, locale, extraListings }: Props) {
  const c = t.dashboard.planCard;
  const linkClass =
    "inline-flex min-h-10 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition-colors";

  return (
    <section className="relative mt-5 overflow-hidden rounded-2xl bg-gradient-to-br from-forest via-forest to-brand p-4 text-white shadow-lg shadow-forest/20 sm:p-5">
      <span
        aria-hidden
        className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-lime/50 to-transparent"
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-lime/15 px-2.5 py-1 text-xs font-semibold tracking-wide text-lime uppercase ring-1 ring-lime/30">
            <Crown className="size-3.5" aria-hidden />
            {fmt(t.plans.summaryPlan, { plan: t.plans.labels[quota.plan] })}
          </span>
          {quota.planExpiresAt && (
            <p className="mt-2 text-sm text-white/70">
              {fmt(c.until, { date: formatDay(quota.planExpiresAt, locale) })}
            </p>
          )}
        </div>
        {quota.plan !== "showroom" && (
          <Link
            href="/pricing"
            className={`${linkClass} shrink-0 bg-gradient-to-b from-lime-light to-lime text-on-lime shadow-[inset_0_1px_0_rgba(255,255,255,.45)] hover:text-on-lime`}
          >
            {t.dashboard.upgrade}
            <ArrowUpRight className="size-4 rtl:-scale-x-100" aria-hidden />
          </Link>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
        <UsageTile
          icon={Send}
          label={c.published}
          used={quota.used}
          limit={quota.limit}
          t={t}
        />
        <UsageTile
          icon={FileText}
          label={c.drafts}
          used={openDrafts}
          limit={DRAFT_LIMIT[quota.plan]}
          t={t}
        />
        {quota.featuredAllowance !== null && (
          <UsageTile
            icon={Star}
            label={c.featured}
            used={quota.featuredUsed}
            limit={quota.featuredAllowance}
            t={t}
            className="max-sm:col-span-2"
          />
        )}
        {quota.listingCredits > 0 && (
          <div className="rounded-xl bg-white/[0.07] p-3 ring-1 ring-white/15 backdrop-blur-sm">
            <p className="flex items-center gap-1.5 text-xs text-white/70">
              <PlusCircle className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">{t.addons.credits}</span>
            </p>
            <p className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums">{quota.listingCredits}</p>
          </div>
        )}
      </div>

      {extraListings && (
        <div id="extra-listings" className="mt-3 scroll-mt-24 border-t border-white/10 pt-3">
          <BuyExtraListings offer={extraListings} />
        </div>
      )}

      {isDealerPlan(quota.plan) && (
        <div className="mt-3 flex flex-wrap gap-x-1 border-t border-white/10 pt-3">
          <Link
            href="/dashboard/storefront"
            className={`${linkClass} -ms-3.5 text-white/85 hover:bg-white/10 hover:text-white`}
          >
            <Store className="size-4" aria-hidden />
            {t.dashboard.editStorefront}
          </Link>
          {hasInsights(quota.plan) && (
            <Link href="/dashboard/insights" className={`${linkClass} text-white/85 hover:bg-white/10 hover:text-white`}>
              <ChartLine className="size-4" aria-hidden />
              {t.insights.open}
            </Link>
          )}
        </div>
      )}
    </section>
  );
}

function UsageTile({
  icon: Icon,
  label,
  used,
  limit,
  t,
  className = "",
}: {
  icon: LucideIcon;
  label: string;
  used: number;
  limit: number | null; // null = unlimited
  t: Dictionary;
  className?: string;
}) {
  const c = t.dashboard.planCard;
  const ratio = limit ? Math.min(1, used / limit) : 0;
  const barColor = ratio >= 1 ? "bg-red-400" : ratio >= 0.8 ? "bg-amber-300" : "bg-lime";

  return (
    <div className={`rounded-xl bg-white/[0.07] p-3 ring-1 ring-white/15 backdrop-blur-sm ${className}`}>
      <p className="flex items-center gap-1.5 text-xs text-white/70">
        <Icon className="size-3.5 shrink-0" aria-hidden />
        <span className="truncate">{label}</span>
      </p>
      <p className="mt-1.5 flex items-baseline gap-1 tabular-nums">
        <span className="text-2xl font-semibold tracking-tight">{used}</span>
        {limit !== null && <span className="text-sm text-white/55">/ {limit}</span>}
      </p>
      {limit === null ? (
        <p className="mt-2 text-xs font-medium text-lime">{c.unlimited}</p>
      ) : (
        <>
          <div
            role="progressbar"
            aria-label={label}
            aria-valuemin={0}
            aria-valuemax={limit}
            aria-valuenow={Math.min(used, limit)}
            className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-white/15"
          >
            <div className={`rounded-full ${barColor}`} style={{ width: `${ratio * 100}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-white/60">
            {fmt(c.left, { n: Math.max(0, limit - used) })}
          </p>
        </>
      )}
    </div>
  );
}
