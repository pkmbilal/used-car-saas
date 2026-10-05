import Image from "next/image";
import { RiyalPrice } from "@/components/riyal-price";
import Link from "next/link";
import { getOpenReports } from "@/lib/admin";
import { REPORT_REASONS, type ReportReason } from "@/lib/moderation";
import { StatusBadge } from "@/app/dashboard/listings/status-badge";
import { dismissReportsAction } from "../actions";
import { AdminActionButton, RemoveListingButton } from "../admin-buttons";

function reasonCounts(reasons: ReportReason[]): string {
  const counts = new Map<ReportReason, number>();
  for (const reason of reasons) counts.set(reason, (counts.get(reason) ?? 0) + 1);
  return [...counts]
    .map(([reason, count]) => `${REPORT_REASONS[reason]}${count > 1 ? ` ×${count}` : ""}`)
    .join(" · ");
}

export default async function AdminReportsPage() {
  const reported = await getOpenReports();

  if (reported.length === 0) {
    return <p className="text-zinc-600 dark:text-zinc-400">No open reports. All clear.</p>;
  }

  return (
    <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
      {reported.map(({ listing, reports }) => {
        const cover = listing.images[0];
        const title = `${listing.year} ${listing.make} ${listing.model}`;
        const details = reports.filter((report) => report.details);
        return (
          <li key={listing.id} className="flex flex-wrap items-start gap-4 py-4">
            <div className="relative aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800">
              {cover && <Image src={cover.url} alt="" fill sizes="112px" className="object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {listing.status === "active" ? (
                  <Link href={`/listings/${listing.id}`} className="truncate font-medium">
                    {title}
                  </Link>
                ) : (
                  <span className="truncate font-medium">{title}</span>
                )}
                <StatusBadge status={listing.status} />
              </div>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                <RiyalPrice amount={listing.price} /> · Seller{" "}
                <Link href={`/sellers/${listing.seller_id}`} className="underline">
                  {listing.seller?.full_name ?? "Unnamed"}
                </Link>
              </p>
              <p className="mt-2 text-sm font-medium">
                {reports.length === 1 ? "1 report" : `${reports.length} reports`}:{" "}
                <span className="font-normal">{reasonCounts(reports.map((r) => r.reason))}</span>
              </p>
              {details.length > 0 && (
                <ul className="mt-2 flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {details.slice(0, 3).map((report) => (
                    <li key={report.id} className="border-l-2 border-zinc-200 pl-2 dark:border-zinc-700">
                      {report.details}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              {listing.status === "active" && <RemoveListingButton listingId={listing.id} />}
              <AdminActionButton
                label="Dismiss reports"
                action={dismissReportsAction.bind(null, listing.id)}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
