import Image from "next/image";
import Link from "next/link";
import { Car, Flag, ShieldCheck } from "lucide-react";
import { RiyalPrice } from "@/components/riyal-price";
import { StatusBadge } from "@/app/dashboard/listings/status-badge";
import { getOpenReports } from "@/lib/admin";
import { formatDay } from "@/lib/format";
import { REPORT_REASONS, type ReportReason } from "@/lib/moderation";
import { dismissReportsAction } from "../actions";
import { AdminActionButton, RemoveListingButton } from "../admin-buttons";
import { EmptyState, linkClass, muted, Panel, Pill } from "../ui";

function reasonCounts(reasons: ReportReason[]): [ReportReason, number][] {
  const counts = new Map<ReportReason, number>();
  for (const reason of reasons) counts.set(reason, (counts.get(reason) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1]);
}

export default async function AdminReportsPage() {
  const reported = await getOpenReports();

  if (reported.length === 0) {
    return (
      <Panel>
        <EmptyState icon={ShieldCheck} title="No open reports">
          When buyers flag a listing, it shows up here for review.
        </EmptyState>
      </Panel>
    );
  }

  const totalReports = reported.reduce((sum, { reports }) => sum + reports.length, 0);

  return (
    <div className="flex flex-col gap-4">
      <p className={`text-sm ${muted}`}>
        {totalReports === 1 ? "1 open report" : `${totalReports} open reports`} on{" "}
        {reported.length === 1 ? "1 listing" : `${reported.length} listings`}, most recently reported first.
      </p>

      {reported.map(({ listing, reports }) => {
        const cover = listing.images[0];
        const title = `${listing.year} ${listing.make} ${listing.model}`;
        const details = reports.filter((report) => report.details);
        return (
          <Panel key={listing.id}>
            <div className="flex flex-col gap-5 md:flex-row">
              <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-lg bg-zinc-100 md:w-44 dark:bg-zinc-800">
                {cover ? (
                  <Image src={cover.url} alt="" fill sizes="(min-width: 768px) 176px, 100vw" className="object-cover" />
                ) : (
                  <Car className="absolute inset-0 m-auto size-8 text-zinc-400" aria-hidden />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {listing.status === "active" ? (
                    <Link href={`/listings/${listing.id}`} className={`text-lg ${linkClass}`}>
                      {title}
                    </Link>
                  ) : (
                    <span className="text-lg font-medium">{title}</span>
                  )}
                  <StatusBadge status={listing.status} />
                </div>
                <p className={`mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm ${muted}`}>
                  <RiyalPrice amount={listing.price} className="font-medium text-zinc-900 dark:text-zinc-100" />
                  <span>{listing.city}</span>
                  <span>
                    Seller{" "}
                    <Link href={`/admin/users/${listing.seller_id}`} className={linkClass}>
                      {listing.seller?.full_name ?? "Unnamed"}
                    </Link>
                  </span>
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Pill tone="red">
                    <Flag className="size-3" aria-hidden />
                    {reports.length === 1 ? "1 report" : `${reports.length} reports`}
                  </Pill>
                  {reasonCounts(reports.map((r) => r.reason)).map(([reason, count]) => (
                    <Pill key={reason}>
                      {REPORT_REASONS[reason]}
                      {count > 1 && <span className="tabular-nums">×{count}</span>}
                    </Pill>
                  ))}
                </div>

                {details.length > 0 && (
                  <ul className="mt-4 flex flex-col gap-2">
                    {details.slice(0, 3).map((report) => (
                      <li key={report.id} className="rounded-lg bg-canvas px-3 py-2 text-sm dark:bg-zinc-800/60">
                        <p>“{report.details}”</p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {REPORT_REASONS[report.reason]}, {formatDay(report.created_at)}
                        </p>
                      </li>
                    ))}
                    {details.length > 3 && <li className="text-xs text-zinc-500">And {details.length - 3} more notes</li>}
                  </ul>
                )}
              </div>

              <div className="flex shrink-0 flex-row flex-wrap gap-2 md:flex-col md:items-stretch">
                {listing.status === "active" && <RemoveListingButton listingId={listing.id} />}
                <AdminActionButton
                  label="Dismiss reports"
                  success="Reports dismissed"
                  action={dismissReportsAction.bind(null, listing.id)}
                />
              </div>
            </div>
          </Panel>
        );
      })}
    </div>
  );
}
