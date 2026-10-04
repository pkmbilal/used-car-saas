import Link from "next/link";
import { RiyalPrice } from "@/components/riyal-price";
import {
  EXPIRING_WINDOW_DAYS,
  getExpiringPlans,
  getFeaturedGrants,
  getPayments,
  getPlanChanges,
} from "@/lib/admin";
import { formatDay, whatsappUrl } from "@/lib/format";
import { PAYMENT_METHODS } from "@/lib/payment-options";
import { PLAN_DURATION_OPTIONS, PLAN_LABELS, PLAN_PRICES } from "@/lib/plans";
import { extendUserPlanAction } from "../actions";
import { ExtendPlanForm } from "../admin-buttons";
import { PLAN_CHANGE_SOURCES } from "../labels";
import { pageParam, Pager } from "../pager";

const TABS = [
  { tab: "plans", label: "Plan changes" },
  { tab: "expiring", label: "Expiring" },
  { tab: "payments", label: "Payments" },
  { tab: "featured", label: "Featured grants" },
] as const;

type Tab = (typeof TABS)[number]["tab"];

function isTab(value: unknown): value is Tab {
  return TABS.some(({ tab }) => tab === value);
}

// Extending always adds a fixed number of months.
const extendDurations = PLAN_DURATION_OPTIONS.filter((option) => option.value !== "");

// Plan changes, plans about to expire, recorded payments and featured grants.
// This is the record of what was granted by hand until billing lands.
export default async function AdminPlansPage({ searchParams }: PageProps<"/admin/plans">) {
  const params = await searchParams;
  const tab: Tab = isTab(params.tab) ? params.tab : "plans";
  const page = pageParam(params);

  return (
    <>
      <nav className="flex flex-wrap gap-4 text-sm">
        {TABS.map(({ tab: target, label }) => (
          <Link
            key={target}
            href={target === "plans" ? "/admin/plans" : `/admin/plans?tab=${target}`}
            className={tab === target ? "font-semibold" : "underline"}
          >
            {label}
          </Link>
        ))}
      </nav>
      {tab === "plans" && <PlanChanges params={params} page={page} />}
      {tab === "expiring" && <ExpiringPlans />}
      {tab === "payments" && <Payments params={params} page={page} />}
      {tab === "featured" && <FeaturedGrants params={params} page={page} />}
    </>
  );
}

type ListProps = { params: Record<string, string | string[] | undefined>; page: number };

const rowClass = "flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3";
const metaClass = "text-sm text-zinc-600 dark:text-zinc-400";

async function PlanChanges({ params, page }: ListProps) {
  const { changes, total } = await getPlanChanges(page);

  return (
    <>
      <ul className="mt-6 divide-y divide-zinc-200 dark:divide-zinc-800">
        {changes.map((change) => (
          <li key={change.id} className={rowClass}>
            <div className="min-w-0">
              <p>
                <Link href={`/admin/users/${change.user_id}`} className="font-medium underline">
                  {change.user?.full_name ?? "Unnamed"}
                </Link>{" "}
                {PLAN_LABELS[change.from_plan]} → {PLAN_LABELS[change.to_plan]}
                {change.expires_at && ` until ${formatDay(change.expires_at)}`}
              </p>
              {change.note && <p className={metaClass}>{change.note}</p>}
            </div>
            <p className={metaClass}>
              {PLAN_CHANGE_SOURCES[change.source]}
              {change.changed_by_profile?.full_name && ` by ${change.changed_by_profile.full_name}`}
              {` · ${formatDay(change.created_at)}`}
            </p>
          </li>
        ))}
      </ul>
      {changes.length === 0 && <p className="mt-6 text-zinc-600 dark:text-zinc-400">No plan changes yet.</p>}
      <Pager basePath="/admin/plans" params={params} page={page} total={total} />
    </>
  );
}

async function FeaturedGrants({ params, page }: ListProps) {
  const { grants, total } = await getFeaturedGrants(page);

  return (
    <>
      <ul className="mt-6 divide-y divide-zinc-200 dark:divide-zinc-800">
        {grants.map((grant) => (
          <li key={grant.id} className={rowClass}>
            <p className="min-w-0">
              {grant.listing ? (
                <Link href={`/listings/${grant.listing.id}`} className="font-medium underline">
                  {grant.listing.year} {grant.listing.make} {grant.listing.model}
                </Link>
              ) : (
                <span className="font-medium">Deleted listing</span>
              )}{" "}
              · {grant.seller?.full_name ?? "Unnamed"} · {grant.days} days, until{" "}
              {formatDay(grant.featured_until)}
            </p>
            <p className={metaClass}>
              {grant.self_serve
                ? "Self-serve"
                : `By ${grant.granted_by_profile?.full_name ?? "admin"}`}
              {` · ${formatDay(grant.created_at)}`}
            </p>
          </li>
        ))}
      </ul>
      {grants.length === 0 && <p className="mt-6 text-zinc-600 dark:text-zinc-400">No featured grants yet.</p>}
      <Pager basePath="/admin/plans" params={params} page={page} total={total} />
    </>
  );
}

async function ExpiringPlans() {
  const profiles = await getExpiringPlans();

  return (
    <>
      <p className={`mt-6 ${metaClass}`}>
        Paid plans ending in the next {EXPIRING_WINDOW_DAYS} days. They move to Free automatically
        once the date passes. Extending adds months on top of the current end date.
      </p>
      <ul className="mt-4 divide-y divide-zinc-200 dark:divide-zinc-800">
        {profiles.map((profile) => {
          const endsOn = profile.plan_expires_at ? formatDay(profile.plan_expires_at) : "";
          return (
            <li key={profile.id} className="flex flex-wrap items-start justify-between gap-4 py-3">
              <div className="min-w-0">
                <Link href={`/admin/users/${profile.id}`} className="font-medium underline">
                  {profile.business_name ?? profile.full_name ?? "Unnamed"}
                </Link>
                <p className={metaClass}>
                  {PLAN_LABELS[profile.plan]} ·{" "}
                  <span className={profile.endsSoon ?"font-medium text-red-600" : ""}>ends {endsOn}</span>
                  {profile.phone && (
                    <>
                      {" · "}
                      <a
                        href={whatsappUrl(
                          profile.phone,
                          `Hi, your DriveLoop ${PLAN_LABELS[profile.plan]} plan ends on ${endsOn}.`,
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className="underline"
                      >
                        {profile.phone}
                      </a>
                    </>
                  )}
                </p>
              </div>
              <ExtendPlanForm
                plan={profile.plan}
                durations={extendDurations}
                prices={PLAN_PRICES}
                action={extendUserPlanAction.bind(null, profile.id)}
              />
            </li>
          );
        })}
      </ul>
      {profiles.length === 0 && <p className="mt-6 text-zinc-600 dark:text-zinc-400">No plans ending soon.</p>}
    </>
  );
}

async function Payments({ params, page }: ListProps) {
  const { payments, total } = await getPayments(page);

  return (
    <>
      <ul className="mt-6 divide-y divide-zinc-200 dark:divide-zinc-800">
        {payments.map((payment) => (
          <li key={payment.id} className={rowClass}>
            <div className="min-w-0">
              <p>
                <RiyalPrice amount={payment.amount} className="font-medium" /> ·{" "}
                {payment.user ? (
                  <Link href={`/admin/users/${payment.user.id}`} className="underline">
                    {payment.user.full_name ?? "Unnamed"}
                  </Link>
                ) : (
                  "Deleted user"
                )}
                {payment.plan_change && ` · ${PLAN_LABELS[payment.plan_change.to_plan]}`}
                {payment.plan_change?.expires_at && ` until ${formatDay(payment.plan_change.expires_at)}`}
              </p>
              <p className={metaClass}>
                {PAYMENT_METHODS[payment.method]}
                {payment.reference && ` · ${payment.reference}`}
              </p>
            </div>
            <p className={metaClass}>
              {payment.recorded_by_profile?.full_name && `By ${payment.recorded_by_profile.full_name} · `}
              {formatDay(payment.created_at)}
            </p>
          </li>
        ))}
      </ul>
      {payments.length === 0 && <p className="mt-6 text-zinc-600 dark:text-zinc-400">No payments recorded yet.</p>}
      <Pager basePath="/admin/plans" params={params} page={page} total={total} />
    </>
  );
}
