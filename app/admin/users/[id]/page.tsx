import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { StatusBadge } from "@/app/dashboard/listings/status-badge";
import { RiyalPrice } from "@/components/riyal-price";
import { VerificationBadges } from "@/components/verification-badges";
import { getUserDetail } from "@/lib/admin";
import { getCurrentUser } from "@/lib/auth";
import { formatDay, formatMonthYear } from "@/lib/format";
import { REPORT_REASONS } from "@/lib/moderation";
import { PAYMENT_METHODS } from "@/lib/payment-options";
import { PLAN_DURATION_OPTIONS, PLAN_LABELS, PLAN_PRICES, PLANS } from "@/lib/plans";
import { ActionList } from "../../action-list";
import {
  revokeIdVerificationAction,
  setUserPlanAction,
  suspendUserAction,
  unsuspendUserAction,
} from "../../actions";
import { AdminActionButton, PlanSelect } from "../../admin-buttons";
import { PLAN_CHANGE_SOURCES } from "../../labels";
import { Avatar, DetailGrid, linkClass, muted, Panel, Pill, type PillTone, table } from "../../ui";

const planOptions = PLANS.map((plan) => ({ value: plan, label: PLAN_LABELS[plan] }));

const REVIEW_STATUS: Record<"pending" | "approved" | "rejected", { label: string; tone: PillTone }> = {
  pending: { label: "Pending", tone: "amber" },
  approved: { label: "Approved", tone: "green" },
  rejected: { label: "Rejected", tone: "red" },
};

const REPORT_STATUS: Record<"open" | "resolved" | "dismissed", { label: string; tone: PillTone }> = {
  open: { label: "Open", tone: "red" },
  resolved: { label: "Resolved", tone: "green" },
  dismissed: { label: "Dismissed", tone: "neutral" },
};

function Empty({ children }: { children: React.ReactNode }) {
  return <p className={`px-5 py-6 text-sm ${muted}`}>{children}</p>;
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-canvas px-4 py-3 dark:bg-zinc-800/60">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export default async function AdminUserPage({ params }: PageProps<"/admin/users/[id]">) {
  const { id } = await params;
  const [detail, current] = await Promise.all([getUserDetail(id), getCurrentUser()]);
  if (!detail) notFound();

  const { profile } = detail;
  const isSeller = profile.role === "seller";
  const isSelf = profile.id === current?.user.id;
  const liveListings = detail.listings.filter((listing) => listing.status === "active").length;
  const paidTotal = detail.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const openReports = detail.reports.filter((report) => report.status === "open").length;

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="flex min-w-0 flex-col gap-6">
        <Panel flush>
          <div className="h-20 bg-gradient-to-r from-forest via-forest to-brand" aria-hidden />
          <div className="px-5 pb-5">
            <div className="-mt-8 flex flex-wrap items-end gap-4">
              <span className="rounded-full ring-4 ring-white dark:ring-zinc-900">
                <Avatar name={profile.full_name} size="lg" />
              </span>
              <div className="min-w-0 flex-1 pb-1">
                <h1 className="text-2xl font-bold tracking-tight">{profile.full_name ?? "Unnamed"}</h1>
                {profile.business_name && <p className={`text-sm ${muted}`}>{profile.business_name}</p>}
              </div>
              {isSeller && (
                <Link href={`/sellers/${profile.id}`} className={`inline-flex items-center gap-1 pb-1 text-sm ${linkClass}`}>
                  Public profile <ArrowRight className="size-4" aria-hidden />
                </Link>
              )}
            </div>

            {(isSeller || profile.id_verified_at || !isSelf) && (
              <a
                href="#manage"
                className="mt-4 flex h-9 w-full items-center justify-center rounded-md bg-forest text-sm font-medium text-white xl:hidden"
              >
                Manage plan & account
              </a>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Pill tone={isSeller ? "brand" : "neutral"}>{isSeller ? "Seller" : "Buyer"}</Pill>
              {profile.is_admin && <Pill tone="blue">Admin</Pill>}
              {profile.suspended_at && <Pill tone="red">Suspended {formatDay(profile.suspended_at)}</Pill>}
              <VerificationBadges profile={profile} />
            </div>

            <div className="mt-5">
              <DetailGrid
                items={[
                  { label: "Phone", value: profile.phone },
                  { label: "City", value: profile.city },
                  { label: "Member since", value: formatMonthYear(profile.created_at) },
                  {
                    label: "Plan",
                    value: isSeller
                      ? `${PLAN_LABELS[profile.plan]}${profile.plan_expires_at ? ` until ${formatDay(profile.plan_expires_at)}` : ""}`
                      : "—",
                  },
                ]}
              />
            </div>

            {isSeller && (
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Listings" value={detail.listings.length} />
                <Stat label="Live now" value={liveListings} />
                <Stat label="Paid in total" value={<RiyalPrice amount={paidTotal} />} />
                <Stat label="Open reports" value={openReports} />
              </div>
            )}
          </div>
        </Panel>

        {isSeller && (
          <Panel flush title="Listings" description={`${detail.listings.length} most recent`}>
            {detail.listings.length === 0 ? (
              <Empty>No listings yet.</Empty>
            ) : (
              <div className={table.wrap}>
                <table className={`${table.table} md:min-w-[40rem]`}>
                  <thead>
                    <tr className={table.headRow}>
                      <th className={table.th}>Vehicle</th>
                      <th className={table.th}>Price</th>
                      <th className={table.th}>Status</th>
                      <th className={table.th}>Listed</th>
                    </tr>
                  </thead>
                  <tbody className={table.body}>
                    {detail.listings.map((listing) => (
                      <tr key={listing.id} className={table.row}>
                        <td className={`${table.td} ${table.tdPrimary}`}>
                          <Link href={`/listings/${listing.id}`} className={linkClass}>
                            {listing.year} {listing.make} {listing.model}
                          </Link>
                          {listing.featuredNow && listing.featured_until && (
                            <span className="mt-1 block text-xs text-amber-700 dark:text-amber-400">
                              Featured until {formatDay(listing.featured_until)}
                            </span>
                          )}
                          {listing.removed_reason && (
                            <span className="mt-1 block text-xs text-red-700 dark:text-red-400">{listing.removed_reason}</span>
                          )}
                        </td>
                        <td data-label="Price" className={`${table.td} font-medium tabular-nums`}>
                          <RiyalPrice amount={listing.price} />
                        </td>
                        <td data-label="Status" className={table.td}>
                          <StatusBadge status={listing.status} />
                        </td>
                        <td data-label="Listed" className={`${table.td} whitespace-nowrap text-zinc-600 dark:text-zinc-400`}>
                          {formatDay(listing.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        )}

        {isSeller && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel flush title="Plan history">
              {detail.planChanges.length === 0 ? (
                <Empty>No plan changes.</Empty>
              ) : (
                <ul className={table.body}>
                  {detail.planChanges.map((change) => (
                    <li key={change.id} className="px-5 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5">
                          <Pill>{PLAN_LABELS[change.from_plan]}</Pill>
                          <ArrowRight className="size-3.5 text-zinc-400" aria-label="to" />
                          <Pill tone="brand">{PLAN_LABELS[change.to_plan]}</Pill>
                        </span>
                        <span className="text-xs text-zinc-500">{formatDay(change.created_at)}</span>
                      </div>
                      <p className="mt-1 text-xs text-zinc-500">
                        {PLAN_CHANGE_SOURCES[change.source]}
                        {change.changed_by_profile?.full_name && `, ${change.changed_by_profile.full_name}`}
                        {change.expires_at && `. Ends ${formatDay(change.expires_at)}`}
                      </p>
                      {change.note && <p className="mt-1 text-sm">{change.note}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel flush title="Payments">
              {detail.payments.length === 0 ? (
                <Empty>No payments recorded.</Empty>
              ) : (
                <ul className={table.body}>
                  {detail.payments.map((payment) => (
                    <li key={payment.id} className="flex items-center justify-between gap-3 px-5 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{PAYMENT_METHODS[payment.method]}</p>
                        <p className="text-xs text-zinc-500">
                          {formatDay(payment.created_at)}
                          {payment.reference && `, ref ${payment.reference}`}
                          {payment.recorded_by_profile?.full_name && `, by ${payment.recorded_by_profile.full_name}`}
                        </p>
                      </div>
                      <RiyalPrice amount={payment.amount} className="font-semibold" />
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel flush title="Featured grants">
              {detail.featuredGrants.length === 0 ? (
                <Empty>No featured placements.</Empty>
              ) : (
                <ul className={table.body}>
                  {detail.featuredGrants.map((grant) => (
                    <li key={grant.id} className="px-5 py-3">
                      {grant.listing ? (
                        <Link href={`/listings/${grant.listing.id}`} className={`text-sm ${linkClass}`}>
                          {grant.listing.year} {grant.listing.make} {grant.listing.model}
                        </Link>
                      ) : (
                        <span className="text-sm text-zinc-500">Deleted listing</span>
                      )}
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {grant.days} days until {formatDay(grant.featured_until)}.{" "}
                        {grant.self_serve ? "Self-serve" : "Granted by an admin"} on {formatDay(grant.created_at)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel flush title="Reports on their listings">
              {detail.reports.length === 0 ? (
                <Empty>No reports.</Empty>
              ) : (
                <ul className={table.body}>
                  {detail.reports.map((report) => (
                    <li key={report.id} className="px-5 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Link href={`/listings/${report.listing.id}`} className={`text-sm ${linkClass}`}>
                          {report.listing.year} {report.listing.make} {report.listing.model}
                        </Link>
                        <Pill tone={REPORT_STATUS[report.status].tone}>{REPORT_STATUS[report.status].label}</Pill>
                      </div>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {REPORT_REASONS[report.reason]}, {formatDay(report.created_at)}
                      </p>
                      {report.details && <p className="mt-1 text-sm">{report.details}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        )}

        <Panel flush title="Verification and dealer applications">
          {detail.idRequests.length === 0 && detail.dealerApplications.length === 0 ? (
            <Empty>No requests.</Empty>
          ) : (
            <ul className={table.body}>
              {detail.idRequests.map((request) => (
                <li key={request.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">ID verification</p>
                    <p className="text-xs text-zinc-500">Submitted {formatDay(request.created_at)}</p>
                    {request.reject_reason && <p className="mt-1 text-sm">{request.reject_reason}</p>}
                  </div>
                  <Pill tone={REVIEW_STATUS[request.status].tone}>{REVIEW_STATUS[request.status].label}</Pill>
                </li>
              ))}
              {detail.dealerApplications.map((application) => (
                <li key={application.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Dealer application: {application.business_name}</p>
                    <p className="text-xs text-zinc-500">
                      Asked for {PLAN_LABELS[application.requested_plan]}, submitted {formatDay(application.created_at)}
                    </p>
                    {application.reject_reason && <p className="mt-1 text-sm">{application.reject_reason}</p>}
                  </div>
                  <Pill tone={REVIEW_STATUS[application.status].tone}>{REVIEW_STATUS[application.status].label}</Pill>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Admin actions">
          <ActionList actions={detail.actions} empty="No moderation actions on this user" />
        </Panel>
      </div>

      <aside id="manage" className="flex scroll-mt-20 flex-col gap-6 xl:sticky xl:top-20">
        {isSeller && (
          <Panel title="Plan" description="Picking the current plan again renews it from today.">
            <PlanSelect
              plan={profile.plan}
              plans={planOptions}
              durations={PLAN_DURATION_OPTIONS}
              prices={PLAN_PRICES}
              action={setUserPlanAction.bind(null, profile.id)}
            />
          </Panel>
        )}

        {(profile.id_verified_at || !isSelf) && (
          <Panel title="Account">
            <div className="flex flex-col gap-4">
              {profile.id_verified_at && (
                <div className="flex items-center justify-between gap-3">
                  <p className={`text-sm ${muted}`}>Verified on {formatDay(profile.id_verified_at)}</p>
                  <AdminActionButton
                    label="Revoke ID badge"
                    tone="danger"
                    success="ID badge revoked"
                    confirm={{
                      title: "Revoke the ID badge?",
                      description: "The badge disappears from their profile and listings. They can apply again.",
                    }}
                    action={revokeIdVerificationAction.bind(null, profile.id)}
                  />
                </div>
              )}
              {!isSelf && (
                <div className="flex items-center justify-between gap-3">
                  <p className={`text-sm ${muted}`}>
                    {profile.suspended_at ? "Suspended. Their listings are hidden." : "Active account."}
                  </p>
                  {profile.suspended_at ? (
                    <AdminActionButton
                      label="Unsuspend"
                      success="User unsuspended"
                      action={unsuspendUserAction.bind(null, profile.id)}
                    />
                  ) : (
                    <AdminActionButton
                      label="Suspend"
                      tone="danger"
                      success="User suspended"
                      confirm={{
                        title: "Suspend this user?",
                        description:
                          "Their live listings are hidden and they can't publish new ones until you unsuspend them.",
                      }}
                      action={suspendUserAction.bind(null, profile.id)}
                    />
                  )}
                </div>
              )}
            </div>
          </Panel>
        )}
      </aside>
    </div>
  );
}
