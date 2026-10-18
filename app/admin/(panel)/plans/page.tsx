import Link from "next/link";
import { ArrowRight, CalendarClock, CreditCard, History, Star } from "lucide-react";
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
import { Avatar, EmptyState, linkClass, Panel, Pill, SegmentedNav, table } from "../ui";

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
    <div className="flex flex-col gap-4">
      <SegmentedNav
        label="Plan records"
        items={TABS.map(({ tab: target, label }) => ({
          href: target === "plans" ? "/admin/plans" : `/admin/plans?tab=${target}`,
          label,
          active: tab === target,
        }))}
      />
      {tab === "plans" && <PlanChanges params={params} page={page} />}
      {tab === "expiring" && <ExpiringPlans />}
      {tab === "payments" && <Payments params={params} page={page} />}
      {tab === "featured" && <FeaturedGrants params={params} page={page} />}
    </div>
  );
}

type ListProps = { params: Record<string, string | string[] | undefined>; page: number };

function UserCell({ id, name }: { id: string | null; name: string | null | undefined }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar name={name ?? null} />
      {id ? (
        <Link href={`/admin/users/${id}`} className={linkClass}>
          {name ?? "Unnamed"}
        </Link>
      ) : (
        <span className="text-zinc-500">Deleted user</span>
      )}
    </div>
  );
}

async function PlanChanges({ params, page }: ListProps) {
  const { changes, total } = await getPlanChanges(page);

  return (
    <>
      <Panel flush title="Plan changes" description="Every plan granted, renewed or expired, newest first.">
        {changes.length === 0 ? (
          <EmptyState icon={History} title="No plan changes yet" />
        ) : (
          <div className={table.wrap}>
            <table className={`${table.table} md:min-w-[52rem]`}>
              <thead>
                <tr className={table.headRow}>
                  <th className={table.th}>User</th>
                  <th className={table.th}>Change</th>
                  <th className={table.th}>Ends</th>
                  <th className={table.th}>Source</th>
                  <th className={table.th}>Date</th>
                </tr>
              </thead>
              <tbody className={table.body}>
                {changes.map((change) => (
                  <tr key={change.id} className={table.row}>
                    <td className={`${table.td} ${table.tdPrimary}`}>
                      <UserCell id={change.user_id} name={change.user?.full_name} />
                    </td>
                    <td data-label="Change" className={table.td}>
                      <span className="inline-flex items-center gap-2">
                        <Pill>{PLAN_LABELS[change.from_plan]}</Pill>
                        <ArrowRight className="size-3.5 text-zinc-400" aria-label="to" />
                        <Pill tone="brand">{PLAN_LABELS[change.to_plan]}</Pill>
                      </span>
                      {change.note && <span className="mt-1 block max-w-72 text-xs text-zinc-500">{change.note}</span>}
                    </td>
                    <td data-label="Ends" className={`${table.td} whitespace-nowrap`}>
                      {change.expires_at ? formatDay(change.expires_at) : <span className="text-zinc-400">No end date</span>}
                    </td>
                    <td data-label="Source" className={table.td}>
                      <span className="block">{PLAN_CHANGE_SOURCES[change.source]}</span>
                      {change.changed_by_profile?.full_name && (
                        <span className="text-xs text-zinc-500">{change.changed_by_profile.full_name}</span>
                      )}
                    </td>
                    <td data-label="Date" className={`${table.td} whitespace-nowrap text-zinc-600 dark:text-zinc-400`}>
                      {formatDay(change.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      <Pager basePath="/admin/plans" params={params} page={page} total={total} />
    </>
  );
}

async function FeaturedGrants({ params, page }: ListProps) {
  const { grants, total } = await getFeaturedGrants(page);

  return (
    <>
      <Panel flush title="Featured grants" description="Every featured placement, granted by an admin or bought with a plan allowance.">
        {grants.length === 0 ? (
          <EmptyState icon={Star} title="No featured grants yet" />
        ) : (
          <div className={table.wrap}>
            <table className={`${table.table} md:min-w-[52rem]`}>
              <thead>
                <tr className={table.headRow}>
                  <th className={table.th}>Listing</th>
                  <th className={table.th}>Seller</th>
                  <th className={table.th}>Length</th>
                  <th className={table.th}>Featured until</th>
                  <th className={table.th}>Granted</th>
                </tr>
              </thead>
              <tbody className={table.body}>
                {grants.map((grant) => (
                  <tr key={grant.id} className={table.row}>
                    <td className={`${table.td} ${table.tdPrimary}`}>
                      {grant.listing ? (
                        <Link href={`/listings/${grant.listing.id}`} className={linkClass}>
                          {grant.listing.year} {grant.listing.make} {grant.listing.model}
                        </Link>
                      ) : (
                        <span className="text-zinc-500">Deleted listing</span>
                      )}
                    </td>
                    <td data-label="Seller" className={table.td}>
                      <UserCell id={grant.seller?.id ?? null} name={grant.seller?.full_name} />
                    </td>
                    <td data-label="Length" className={`${table.td} tabular-nums`}>{grant.days} days</td>
                    <td data-label="Featured until" className={`${table.td} whitespace-nowrap`}>{formatDay(grant.featured_until)}</td>
                    <td data-label="Granted" className={table.td}>
                      <span className="block">
                        {grant.self_serve ? (
                          <Pill tone="blue">Self-serve</Pill>
                        ) : (
                          `By ${grant.granted_by_profile?.full_name ?? "admin"}`
                        )}
                      </span>
                      <span className="text-xs text-zinc-500">{formatDay(grant.created_at)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      <Pager basePath="/admin/plans" params={params} page={page} total={total} />
    </>
  );
}

async function ExpiringPlans() {
  const profiles = await getExpiringPlans();

  return (
    <Panel
      flush
      title={`Plans ending in the next ${EXPIRING_WINDOW_DAYS} days`}
      description="They move to Free automatically once the date passes. Extending adds months on top of the current end date."
    >
      {profiles.length === 0 ? (
        <EmptyState icon={CalendarClock} title="No plans ending soon" />
      ) : (
        <ul className={table.body}>
          {profiles.map((profile) => {
            const endsOn = profile.plan_expires_at ? formatDay(profile.plan_expires_at) : "";
            const { daysLeft } = profile;
            const name = profile.business_name ?? profile.full_name;
            return (
              <li key={profile.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                <Avatar name={name} />
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/users/${profile.id}`} className={linkClass}>
                    {name ?? "Unnamed"}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                    <Pill tone="brand">{PLAN_LABELS[profile.plan]}</Pill>
                    <Pill tone={profile.endsSoon ? "red" : "amber"}>
                      {daysLeft !== null && daysLeft <= 0 ? `Ended ${endsOn}` : `Ends ${endsOn}`}
                      {daysLeft !== null && daysLeft > 0 && ` (${daysLeft === 1 ? "1 day" : `${daysLeft} days`})`}
                    </Pill>
                    {profile.phone && (
                      <a
                        href={whatsappUrl(
                          profile.phone,
                          `Hi, your DriveLoop ${PLAN_LABELS[profile.plan]} plan ends on ${endsOn}.`,
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className={`text-sm ${linkClass}`}
                      >
                        WhatsApp {profile.phone}
                      </a>
                    )}
                  </div>
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
      )}
    </Panel>
  );
}

async function Payments({ params, page }: ListProps) {
  const { payments, total } = await getPayments(page);

  return (
    <>
      <Panel flush title="Payments" description="Offline payments recorded by an admin with a plan change.">
        {payments.length === 0 ? (
          <EmptyState icon={CreditCard} title="No payments recorded yet" />
        ) : (
          <div className={table.wrap}>
            <table className={`${table.table} md:min-w-[52rem]`}>
              <thead>
                <tr className={table.headRow}>
                  <th className={table.th}>User</th>
                  <th className={`${table.th} md:text-right`}>Amount</th>
                  <th className={table.th}>Method</th>
                  <th className={table.th}>For</th>
                  <th className={table.th}>Recorded</th>
                </tr>
              </thead>
              <tbody className={table.body}>
                {payments.map((payment) => (
                  <tr key={payment.id} className={table.row}>
                    <td className={`${table.td} ${table.tdPrimary}`}>
                      <UserCell id={payment.user?.id ?? null} name={payment.user?.full_name} />
                    </td>
                    <td data-label="Amount" className={`${table.td} font-semibold tabular-nums md:text-right`}>
                      <RiyalPrice amount={payment.amount} />
                    </td>
                    <td data-label="Method" className={table.td}>
                      <span className="block">{PAYMENT_METHODS[payment.method]}</span>
                      {payment.reference && <span className="text-xs text-zinc-500">{payment.reference}</span>}
                    </td>
                    <td data-label="For" className={table.td}>
                      {payment.plan_change ? (
                        <>
                          <Pill tone="brand">{PLAN_LABELS[payment.plan_change.to_plan]}</Pill>
                          {payment.plan_change.expires_at && (
                            <span className="mt-1 block text-xs text-zinc-500">
                              Until {formatDay(payment.plan_change.expires_at)}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                    <td data-label="Recorded" className={table.td}>
                      <span className="block whitespace-nowrap">{formatDay(payment.created_at)}</span>
                      {payment.recorded_by_profile?.full_name && (
                        <span className="text-xs text-zinc-500">By {payment.recorded_by_profile.full_name}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      <Pager basePath="/admin/plans" params={params} page={page} total={total} />
    </>
  );
}
