import Link from "next/link";
import { notFound } from "next/navigation";
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

const planOptions = PLANS.map((plan) => ({ value: plan, label: PLAN_LABELS[plan] }));

const metaClass = "text-sm text-zinc-600 dark:text-zinc-400";
const listClass = "mt-4 divide-y divide-zinc-200 dark:divide-zinc-800";
const rowClass = "flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3";

const REVIEW_STATUS_LABELS = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
} as const;

const REPORT_STATUS_LABELS = {
  open: "Open",
  resolved: "Resolved",
  dismissed: "Dismissed",
} as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className={`mt-4 ${metaClass}`}>{children}</p>;
}

export default async function AdminUserPage({ params }: PageProps<"/admin/users/[id]">) {
  const { id } = await params;
  const [detail, current] = await Promise.all([getUserDetail(id), getCurrentUser()]);
  if (!detail) notFound();

  const { profile } = detail;
  const isSeller = profile.role === "seller";

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold">{profile.full_name ?? "Unnamed"}</h2>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {isSeller ? "Seller" : "Buyer"}
            </span>
            {profile.is_admin && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                Admin
              </span>
            )}
            {profile.suspended_at && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-950 dark:text-red-300">
                Suspended {formatDay(profile.suspended_at)}
              </span>
            )}
            <VerificationBadges profile={profile} />
          </div>
          <p className={`mt-1 ${metaClass}`}>
            {[profile.business_name, profile.phone, profile.city, `Joined ${formatMonthYear(profile.created_at)}`]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {isSeller && (
            <p className={`mt-1 ${metaClass}`}>
              {PLAN_LABELS[profile.plan]} plan
              {profile.plan_expires_at && ` until ${formatDay(profile.plan_expires_at)}`}
              {" · "}
              <Link href={`/sellers/${profile.id}`} className="underline">
                Public profile
              </Link>
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          {isSeller && (
            <PlanSelect
              plan={profile.plan}
              plans={planOptions}
              durations={PLAN_DURATION_OPTIONS}
              prices={PLAN_PRICES}
              action={setUserPlanAction.bind(null, profile.id)}
            />
          )}
          {profile.id_verified_at && (
            <AdminActionButton
              label="Revoke ID badge"
              tone="danger"
              action={revokeIdVerificationAction.bind(null, profile.id)}
            />
          )}
          {profile.id !== current?.user.id &&
            (profile.suspended_at ? (
              <AdminActionButton label="Unsuspend" action={unsuspendUserAction.bind(null, profile.id)} />
            ) : (
              <AdminActionButton
                label="Suspend"
                tone="danger"
                action={suspendUserAction.bind(null, profile.id)}
              />
            ))}
        </div>
      </div>

      {isSeller && (
        <Section title={`Listings (${detail.listings.length})`}>
          {detail.listings.length === 0 ? (
            <Empty>No listings.</Empty>
          ) : (
            <ul className={listClass}>
              {detail.listings.map((listing) => (
                <li key={listing.id} className={rowClass}>
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <Link href={`/listings/${listing.id}`} className="font-medium underline">
                      {listing.year} {listing.make} {listing.model}
                    </Link>
                    <StatusBadge status={listing.status} />
                    <RiyalPrice amount={listing.price} className={metaClass} />
                    {listing.removed_reason && <span className={metaClass}>· {listing.removed_reason}</span>}
                  </div>
                  <p className={metaClass}>
                    {listing.featuredNow &&
                      listing.featured_until &&
                      `Featured until ${formatDay(listing.featured_until)} · `}
                    Listed {formatDay(listing.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}

      {isSeller && (
        <Section title="Plan history">
          {detail.planChanges.length === 0 ? (
            <Empty>No plan changes.</Empty>
          ) : (
            <ul className={listClass}>
              {detail.planChanges.map((change) => (
                <li key={change.id} className={rowClass}>
                  <div className="min-w-0">
                    <p>
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
          )}
        </Section>
      )}

      {isSeller && (
        <Section title="Payments">
          {detail.payments.length === 0 ? (
            <Empty>No payments recorded.</Empty>
          ) : (
            <ul className={listClass}>
              {detail.payments.map((payment) => (
                <li key={payment.id} className={rowClass}>
                  <p>
                    <RiyalPrice amount={payment.amount} className="font-medium" /> ·{" "}
                    {PAYMENT_METHODS[payment.method]}
                    {payment.reference && ` · ${payment.reference}`}
                  </p>
                  <p className={metaClass}>
                    {payment.recorded_by_profile?.full_name && `By ${payment.recorded_by_profile.full_name} · `}
                    {formatDay(payment.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}

      {isSeller && (
        <Section title="Featured grants">
          {detail.featuredGrants.length === 0 ? (
            <Empty>No featured placements.</Empty>
          ) : (
            <ul className={listClass}>
              {detail.featuredGrants.map((grant) => (
                <li key={grant.id} className={rowClass}>
                  <p>
                    {grant.listing ? (
                      <Link href={`/listings/${grant.listing.id}`} className="underline">
                        {grant.listing.year} {grant.listing.make} {grant.listing.model}
                      </Link>
                    ) : (
                      "Deleted listing"
                    )}{" "}
                    · {grant.days} days, until {formatDay(grant.featured_until)}
                  </p>
                  <p className={metaClass}>
                    {grant.self_serve ? "Self-serve" : "By admin"} · {formatDay(grant.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}

      {isSeller && (
        <Section title="Reports on their listings">
          {detail.reports.length === 0 ? (
            <Empty>No reports.</Empty>
          ) : (
            <ul className={listClass}>
              {detail.reports.map((report) => (
                <li key={report.id} className={rowClass}>
                  <div className="min-w-0">
                    <p>
                      <Link href={`/listings/${report.listing.id}`} className="underline">
                        {report.listing.year} {report.listing.make} {report.listing.model}
                      </Link>{" "}
                      · {REPORT_REASONS[report.reason]}
                    </p>
                    {report.details && <p className={metaClass}>{report.details}</p>}
                  </div>
                  <p className={metaClass}>
                    {REPORT_STATUS_LABELS[report.status]} · {formatDay(report.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}

      <Section title="Verification and dealer applications">
        {detail.idRequests.length === 0 && detail.dealerApplications.length === 0 ? (
          <Empty>No requests.</Empty>
        ) : (
          <ul className={listClass}>
            {detail.idRequests.map((request) => (
              <li key={request.id} className={rowClass}>
                <div className="min-w-0">
                  <p>ID verification · {REVIEW_STATUS_LABELS[request.status]}</p>
                  {request.reject_reason && <p className={metaClass}>{request.reject_reason}</p>}
                </div>
                <p className={metaClass}>Submitted {formatDay(request.created_at)}</p>
              </li>
            ))}
            {detail.dealerApplications.map((application) => (
              <li key={application.id} className={rowClass}>
                <div className="min-w-0">
                  <p>
                    Dealer application ({application.business_name}, asked for{" "}
                    {PLAN_LABELS[application.requested_plan]}) · {REVIEW_STATUS_LABELS[application.status]}
                  </p>
                  {application.reject_reason && <p className={metaClass}>{application.reject_reason}</p>}
                </div>
                <p className={metaClass}>Submitted {formatDay(application.created_at)}</p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Admin actions">
        <ActionList actions={detail.actions} empty="No moderation actions on this user." />
      </Section>
    </div>
  );
}
