import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Ban,
  BadgeCheck,
  CalendarDays,
  Car,
  CircleDot,
  Crown,
  ExternalLink,
  FileCheck,
  Flag,
  History,
  MapPin,
  Phone,
  ShieldCheck,
  Star,
  Store,
  UserCog,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { StatusBadge } from "@/app/[lang]/dashboard/listings/status-badge";
import { RiyalPrice } from "@/components/riyal-price";
import { VerificationBadges } from "@/components/verification-badges";
import { atFeaturedLimit, getUserDetail } from "@/lib/admin";
import { getCurrentUser } from "@/lib/auth";
import { DEALER_DOCS } from "@/lib/dealer-application-options";
import { formatDay, formatMonthYear } from "@/lib/format";
import { REPORT_REASONS } from "@/lib/moderation";
import { PAYMENT_METHODS } from "@/lib/payment-options";
import { PLAN_DURATION_OPTIONS, PLAN_LABELS, PLAN_PRICES, PLANS } from "@/lib/plans";
import { publicUrl } from "@/lib/r2";
import { ActionList } from "../../action-list";
import {
  revokeIdVerificationAction,
  setUserPlanAction,
  suspendUserAction,
  unsuspendUserAction,
} from "../../actions";
import { AdminActionButton, PlanSelect } from "../../admin-buttons";
import { PLAN_CHANGE_SOURCES } from "../../labels";
import { ListingRowActions } from "../../listing-row-actions";
import {
  Avatar,
  DocumentTile,
  IconTile,
  linkClass,
  muted,
  Panel,
  Pill,
  type PillTone,
  secondaryButtonClass,
  table,
} from "../../ui";

const planOptions = PLANS.map((plan) => ({ value: plan, label: PLAN_LABELS[plan] }));

const DAY_MS = 24 * 60 * 60 * 1000;

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

// Whole days from now until `date`; negative once it has passed.
function daysUntil(date: string) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / DAY_MS);
}

function Empty({ icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-5 py-8 text-center">
      <IconTile icon={icon} />
      <p className={`text-sm ${muted}`}>{children}</p>
    </div>
  );
}

// Free text someone wrote (a note, report details), set off from the metadata.
function Quote({ tone = "neutral", children }: { tone?: "neutral" | "red"; children: React.ReactNode }) {
  return (
    <p
      className={`mt-2 rounded-md border-s-2 px-3 py-2 text-sm ${
        tone === "red"
          ? "border-red-300 bg-red-50/70 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
          : "border-line bg-canvas/70 dark:border-zinc-700 dark:bg-zinc-800/50"
      }`}
    >
      {children}
    </p>
  );
}

// Document links under a request; links expire after 5 minutes.
function Documents({ docs }: { docs: { label: string; url: string; isPdf: boolean }[] }) {
  if (docs.length === 0) {
    return (
      <p className={`mt-2 text-xs ${muted}`}>
        No documents on file. None were uploaded, or they were deleted under the old review flow.
      </p>
    );
  }
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {docs.map((doc) => (
        <DocumentTile key={doc.url} href={doc.url} label={doc.label} isPdf={doc.isPdf} />
      ))}
    </div>
  );
}

// A list row with an icon tile, a title line, metadata and an optional end slot.
function Row({
  icon,
  tone,
  title,
  meta,
  end,
  children,
}: {
  icon: LucideIcon;
  tone?: PillTone;
  title: React.ReactNode;
  meta?: React.ReactNode;
  end?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <li className="flex gap-3 px-5 py-3.5">
      <IconTile icon={icon} tone={tone} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
          <div className="min-w-0 text-sm font-medium">{title}</div>
          {end}
        </div>
        {meta && <p className="mt-0.5 text-xs text-zinc-500">{meta}</p>}
        {children}
      </div>
    </li>
  );
}

function Contact({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-lg border border-line px-3 py-2.5 dark:border-zinc-800">
      <Icon className="size-4 shrink-0 text-brand dark:text-lime" aria-hidden />
      <div className="min-w-0">
        <p className="text-xs text-zinc-500">{label}</p>
        <div className="truncate text-sm font-medium">{children}</div>
      </div>
    </div>
  );
}

function Stat({
  icon,
  tone = "brand",
  label,
  value,
}: {
  icon: LucideIcon;
  tone?: PillTone;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-white p-3.5 dark:border-zinc-800 dark:bg-zinc-900">
      <IconTile icon={icon} tone={tone} />
      <div className="min-w-0">
        <p className="truncate text-xs text-zinc-500">{label}</p>
        <p className="text-lg leading-tight font-semibold tabular-nums">{value}</p>
      </div>
    </div>
  );
}

// "Ends 3 Mar 2027 · 12 days left", or "Expired" once the date has passed.
function expiryText(date: string) {
  const days = daysUntil(date);
  if (days < 0) return `Expired ${formatDay(date, "en")}`;
  return `Ends ${formatDay(date, "en")} · ${days === 1 ? "1 day" : `${days} days`} left`;
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
  const requestCount = detail.idRequests.length + detail.dealerApplications.length;

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="flex min-w-0 flex-col gap-6">
        <Panel flush>
          <div className="relative h-28 bg-gradient-to-r from-forest via-forest to-brand" aria-hidden>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(255,255,255,0.18),transparent_55%)]" />
          </div>
          <div className="px-5 pb-5">
            <div className="-mt-10 flex flex-wrap items-end gap-4">
              <span className="rounded-full bg-white ring-4 ring-white dark:bg-zinc-900 dark:ring-zinc-900">
                <Avatar
                  name={profile.full_name}
                  src={profile.avatar_key ? publicUrl(profile.avatar_key) : null}
                  size="xl"
                />
              </span>
              {isSeller && (
                <Link href={`/sellers/${profile.id}`} className={`${secondaryButtonClass} ms-auto`}>
                  <ExternalLink className="size-4" aria-hidden />
                  Public profile
                </Link>
              )}
            </div>

            <div className="mt-3">
              <h1 className="text-2xl font-bold tracking-tight">{profile.full_name ?? "Unnamed"}</h1>
              {profile.business_name && (
                <p className={`mt-0.5 flex items-center gap-1.5 text-sm ${muted}`}>
                  <Store className="size-4" aria-hidden />
                  {profile.business_name}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Pill tone={isSeller ? "brand" : "neutral"}>{isSeller ? "Seller" : "Buyer"}</Pill>
                {profile.is_admin && <Pill tone="blue">Admin</Pill>}
                {profile.suspended_at && <Pill tone="red">Suspended</Pill>}
                <VerificationBadges profile={profile} />
              </div>
            </div>

            {profile.suspended_at && (
              <p className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800 dark:border-red-900 dark:bg-red-950/60 dark:text-red-300">
                <Ban className="size-4 shrink-0" aria-hidden />
                Suspended on {formatDay(profile.suspended_at, "en")}. Their listings are hidden.
              </p>
            )}

            {(isSeller || profile.id_verified_at || !isSelf) && (
              <a
                href="#manage"
                className="mt-4 flex h-9 w-full items-center justify-center rounded-md bg-forest text-sm font-medium text-white xl:hidden"
              >
                Manage plan & account
              </a>
            )}

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Contact icon={Phone} label="Phone">
                {profile.phone ? <span dir="ltr">{profile.phone}</span> : "—"}
              </Contact>
              <Contact icon={MapPin} label="City">
                {profile.city ?? "—"}
              </Contact>
              <Contact icon={CalendarDays} label="Member since">
                {formatMonthYear(profile.created_at, "en")}
              </Contact>
              <Contact icon={Crown} label="Plan">
                {isSeller ? (
                  <>
                    {PLAN_LABELS[profile.plan]}
                    {profile.plan_expires_at && (
                      <span className="ms-1.5 text-xs font-normal text-zinc-500">{expiryText(profile.plan_expires_at)}</span>
                    )}
                  </>
                ) : (
                  "—"
                )}
              </Contact>
            </div>

            {isSeller && (
              <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Stat icon={Car} label="Listings" value={detail.listings.length} />
                <Stat icon={CircleDot} tone="green" label="Live now" value={liveListings} />
                <Stat icon={Wallet} tone="blue" label="Paid in total" value={<RiyalPrice amount={paidTotal} />} />
                <Stat
                  icon={Flag}
                  tone={openReports > 0 ? "red" : "neutral"}
                  label="Open reports"
                  value={openReports}
                />
              </div>
            )}
          </div>
        </Panel>

        {isSeller && (
          <Panel flush icon={Car} title="Listings" count={detail.listings.length} description="Most recent first">
            {detail.listings.length === 0 ? (
              <Empty icon={Car}>No listings yet.</Empty>
            ) : (
              <div className={table.wrap}>
                <table className={`${table.table} md:min-w-[40rem]`}>
                  <thead>
                    <tr className={table.headRow}>
                      <th className={`${table.th} w-12`}>No.</th>
                      <th className={table.th}>Vehicle</th>
                      <th className={table.th}>Price</th>
                      <th className={table.th}>Status</th>
                      <th className={table.th}>Listed</th>
                      <th className={`${table.th} w-12`}>
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className={table.body}>
                    {detail.listings.map((listing, index) => (
                      <tr key={listing.id} className={table.row}>
                        <td className={`${table.td} tabular-nums text-zinc-500 max-md:hidden`}>{index + 1}</td>
                        <td className={`${table.td} ${table.tdPrimary}`}>
                          <Link href={`/listings/${listing.id}`} className={linkClass}>
                            {listing.year} {listing.make} {listing.model}
                          </Link>
                          {listing.featuredNow && listing.featured_until && (
                            <span className="mt-1 block">
                              <Pill tone="amber">
                                <Star className="size-3" aria-hidden />
                                Featured until {formatDay(listing.featured_until, "en")}
                              </Pill>
                            </span>
                          )}
                          {listing.removed_reason && <Quote tone="red">{listing.removed_reason}</Quote>}
                        </td>
                        <td data-label="Price" className={`${table.td} font-medium tabular-nums`}>
                          <RiyalPrice amount={listing.price} />
                        </td>
                        <td data-label="Status" className={table.td}>
                          <StatusBadge status={listing.status} />
                        </td>
                        <td data-label="Listed" className={`${table.td} whitespace-nowrap text-zinc-600 dark:text-zinc-400`}>
                          {formatDay(listing.created_at, "en")}
                        </td>
                        <td className={`${table.td} text-right ${table.tdActions}`}>
                          <ListingRowActions
                            listingId={listing.id}
                            sellerId={profile.id}
                            status={listing.status}
                            featured={listing.featuredNow}
                            canFeature={!atFeaturedLimit(listing.featured)}
                            showSeller={false}
                          />
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
            <Panel flush icon={Crown} title="Plan history" count={detail.planChanges.length}>
              {detail.planChanges.length === 0 ? (
                <Empty icon={Crown}>No plan changes.</Empty>
              ) : (
                <ol className="px-5 py-4">
                  {detail.planChanges.map((change, i) => (
                    <li
                      key={change.id}
                      className={`relative border-s-2 border-line ps-5 dark:border-zinc-800 ${
                        i === detail.planChanges.length - 1 ? "border-transparent! pb-0" : "pb-5"
                      }`}
                    >
                      <span
                        aria-hidden
                        className={`absolute -start-[7px] top-1 size-3 rounded-full ring-4 ring-white dark:ring-zinc-900 ${
                          i === 0 ? "bg-brand dark:bg-lime" : "bg-zinc-300 dark:bg-zinc-600"
                        }`}
                      />
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5">
                          <Pill>{PLAN_LABELS[change.from_plan]}</Pill>
                          <ArrowRight className="size-3.5 text-zinc-400 rtl:rotate-180" aria-label="to" />
                          <Pill tone="brand">{PLAN_LABELS[change.to_plan]}</Pill>
                        </span>
                        <span className="text-xs text-zinc-500">{formatDay(change.created_at, "en")}</span>
                      </div>
                      <p className="mt-1 text-xs text-zinc-500">
                        {PLAN_CHANGE_SOURCES[change.source]}
                        {change.changed_by_profile?.full_name && `, ${change.changed_by_profile.full_name}`}
                        {change.expires_at && `. Ends ${formatDay(change.expires_at, "en")}`}
                      </p>
                      {change.note && <Quote>{change.note}</Quote>}
                    </li>
                  ))}
                </ol>
              )}
            </Panel>

            <Panel
              flush
              icon={Wallet}
              title="Payments"
              count={detail.payments.length}
              actions={
                detail.payments.length > 0 && (
                  <span className="text-sm text-zinc-500">
                    Total <RiyalPrice amount={paidTotal} className="font-semibold text-zinc-900 dark:text-zinc-100" />
                  </span>
                )
              }
            >
              {detail.payments.length === 0 ? (
                <Empty icon={Wallet}>No payments recorded.</Empty>
              ) : (
                <ul className={table.body}>
                  {detail.payments.map((payment) => (
                    <Row
                      key={payment.id}
                      icon={Wallet}
                      tone="blue"
                      title={PAYMENT_METHODS[payment.method]}
                      end={<RiyalPrice amount={payment.amount} className="text-sm font-semibold tabular-nums" />}
                      meta={
                        <>
                          {formatDay(payment.created_at, "en")}
                          {payment.reference && `, ref ${payment.reference}`}
                          {payment.recorded_by_profile?.full_name && `, by ${payment.recorded_by_profile.full_name}`}
                        </>
                      }
                    />
                  ))}
                </ul>
              )}
            </Panel>

            <Panel flush icon={Star} title="Featured grants" count={detail.featuredGrants.length}>
              {detail.featuredGrants.length === 0 ? (
                <Empty icon={Star}>No featured placements.</Empty>
              ) : (
                <ul className={table.body}>
                  {detail.featuredGrants.map((grant) => {
                    const active = daysUntil(grant.featured_until) >= 0;
                    return (
                      <Row
                        key={grant.id}
                        icon={Star}
                        tone={active ? "amber" : "neutral"}
                        title={
                          grant.listing ? (
                            <Link href={`/listings/${grant.listing.id}`} className={linkClass}>
                              {grant.listing.year} {grant.listing.make} {grant.listing.model}
                            </Link>
                          ) : (
                            <span className="text-zinc-500">Deleted listing</span>
                          )
                        }
                        end={
                          <span className="flex items-center gap-1.5">
                            <Pill>{grant.days} days</Pill>
                            <Pill tone={active ? "green" : "neutral"}>{active ? "Active" : "Ended"}</Pill>
                          </span>
                        }
                        meta={
                          <>
                            Until {formatDay(grant.featured_until, "en")}.{" "}
                            {grant.self_serve ? "Self-serve" : "Granted by an admin"} on {formatDay(grant.created_at, "en")}
                          </>
                        }
                      />
                    );
                  })}
                </ul>
              )}
            </Panel>

            <Panel flush icon={Flag} title="Reports on their listings" count={detail.reports.length}>
              {detail.reports.length === 0 ? (
                <Empty icon={Flag}>No reports.</Empty>
              ) : (
                <ul className={table.body}>
                  {detail.reports.map((report) => (
                    <Row
                      key={report.id}
                      icon={Flag}
                      tone={report.status === "open" ? "red" : "neutral"}
                      title={REPORT_REASONS[report.reason]}
                      end={<Pill tone={REPORT_STATUS[report.status].tone}>{REPORT_STATUS[report.status].label}</Pill>}
                      meta={
                        <>
                          <Link href={`/listings/${report.listing.id}`} className={linkClass}>
                            {report.listing.year} {report.listing.make} {report.listing.model}
                          </Link>
                          , {formatDay(report.created_at, "en")}
                        </>
                      }
                    >
                      {report.details && <Quote>{report.details}</Quote>}
                    </Row>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        )}

        <Panel flush icon={FileCheck} title="Verification and dealer applications" count={requestCount}>
          {requestCount === 0 ? (
            <Empty icon={FileCheck}>No requests.</Empty>
          ) : (
            <ul className={table.body}>
              {detail.idRequests.map((request) => (
                <Row
                  key={request.id}
                  icon={BadgeCheck}
                  tone={REVIEW_STATUS[request.status].tone}
                  title="ID verification"
                  meta={`Submitted ${formatDay(request.created_at, "en")}`}
                  end={<Pill tone={REVIEW_STATUS[request.status].tone}>{REVIEW_STATUS[request.status].label}</Pill>}
                >
                  {request.reject_reason && <Quote tone="red">{request.reject_reason}</Quote>}
                  <Documents
                    docs={request.docs.map((doc, index) => ({ ...doc, label: `ID document ${index + 1}` }))}
                  />
                </Row>
              ))}
              {detail.dealerApplications.map((application) => (
                <Row
                  key={application.id}
                  icon={Store}
                  tone={REVIEW_STATUS[application.status].tone}
                  title={`Dealer application: ${application.business_name}`}
                  meta={`Asked for ${PLAN_LABELS[application.requested_plan]}, submitted ${formatDay(application.created_at, "en")}`}
                  end={<Pill tone={REVIEW_STATUS[application.status].tone}>{REVIEW_STATUS[application.status].label}</Pill>}
                >
                  {application.reject_reason && <Quote tone="red">{application.reject_reason}</Quote>}
                  <Documents docs={application.docs.map((doc) => ({ ...doc, label: DEALER_DOCS[doc.doc] }))} />
                </Row>
              ))}
            </ul>
          )}
        </Panel>

        <Panel icon={History} title="Admin actions">
          <ActionList actions={detail.actions} empty="No moderation actions on this user" />
        </Panel>
      </div>

      <aside id="manage" className="flex scroll-mt-20 flex-col gap-6 xl:sticky xl:top-20">
        {isSeller && (
          <Panel icon={Crown} title="Plan" description="Picking the current plan again renews it from today.">
            <div className="mb-4 flex items-center justify-between gap-3 rounded-lg bg-gradient-to-br from-mint to-mint/40 px-4 py-3 ring-1 ring-brand/15 dark:from-zinc-800 dark:to-zinc-800/40 dark:ring-zinc-700">
              <div className="min-w-0">
                <p className="text-xs text-zinc-500">Current plan</p>
                <p className="text-lg font-semibold text-forest dark:text-lime">{PLAN_LABELS[profile.plan]}</p>
              </div>
              <p className="text-end text-xs text-zinc-600 dark:text-zinc-400">
                {profile.plan_expires_at ? expiryText(profile.plan_expires_at) : "No end date"}
              </p>
            </div>
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
          <Panel icon={UserCog} title="Account">
            <div className="flex flex-col gap-3">
              {profile.id_verified_at && (
                <div className="flex flex-wrap items-center gap-3">
                  <IconTile icon={BadgeCheck} tone="brand" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">ID verified</p>
                    <p className="text-xs text-zinc-500">Since {formatDay(profile.id_verified_at, "en")}</p>
                  </div>
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
              {profile.id_verified_at && !isSelf && <hr className="border-line dark:border-zinc-800" />}
              {!isSelf && (
                <div className="flex flex-wrap items-center gap-3">
                  <IconTile icon={profile.suspended_at ? Ban : ShieldCheck} tone={profile.suspended_at ? "red" : "green"} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{profile.suspended_at ? "Suspended" : "Active account"}</p>
                    <p className="text-xs text-zinc-500">
                      {profile.suspended_at ? "Their listings are hidden." : "Can publish and sell."}
                    </p>
                  </div>
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
