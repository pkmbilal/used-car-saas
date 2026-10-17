import Image from "next/image";
import Link from "next/link";
import { Car, Search } from "lucide-react";
import { RiyalPrice } from "@/components/riyal-price";
import { StatusBadge } from "@/app/dashboard/listings/status-badge";
import { getAllListings, type FeaturedStatus } from "@/lib/admin";
import { formatDay, formatKm } from "@/lib/format";
import { isFeatured, type ListingStatus } from "@/lib/listings";
import { PLAN_LABELS } from "@/lib/plans";
import { ListingRowActions } from "../listing-row-actions";
import { pageParam, Pager, textParam } from "../pager";
import { EmptyState, fieldClass, linkClass, Panel, Pill, primaryButtonClass, SegmentedNav, table } from "../ui";

const STATUSES: ListingStatus[] = ["active", "draft", "sold", "removed"];
const STATUS_LABELS: Record<ListingStatus, string> = {
  active: "Live",
  draft: "Draft",
  sold: "Sold",
  removed: "Removed",
};

function isStatus(value: string | undefined): value is ListingStatus {
  return STATUSES.includes(value as ListingStatus);
}

function atFeaturedLimit({ used, allowance, countedThisMonth }: FeaturedStatus): boolean {
  return allowance !== null && used >= allowance && !countedThisMonth;
}

function FeaturedCell({ listing }: { listing: { status: ListingStatus; featured_until: string | null; featured: FeaturedStatus } }) {
  if (listing.status !== "active") return <span className="text-zinc-400">—</span>;
  const { used, allowance } = listing.featured;
  return (
    <div className="flex flex-col items-start gap-1">
      {isFeatured(listing) && listing.featured_until ? (
        <Pill tone="amber">Until {formatDay(listing.featured_until)}</Pill>
      ) : (
        <span className="text-zinc-500">Not featured</span>
      )}
      <span className={`text-xs ${atFeaturedLimit(listing.featured) ? "text-amber-700 dark:text-amber-400" : "text-zinc-500"}`}>
        {allowance === null ? "Paid extra, no allowance" : `${used} of ${allowance} used this month`}
      </span>
    </div>
  );
}

export default async function AdminListingsPage({ searchParams }: PageProps<"/admin/listings">) {
  const params = await searchParams;
  const status = textParam(params, "status");
  const q = textParam(params, "q");
  const page = pageParam(params);
  const activeStatus = isStatus(status) ? status : undefined;
  const { listings, total } = await getAllListings({ status: activeStatus, q, page });

  const statusHref = (target?: ListingStatus) => {
    const query = new URLSearchParams();
    if (target) query.set("status", target);
    if (q) query.set("q", q);
    const search = query.toString();
    return search ? `/admin/listings?${search}` : "/admin/listings";
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedNav
          label="Filter by status"
          items={[
            { href: statusHref(), label: "All", active: !activeStatus },
            ...STATUSES.map((s) => ({ href: statusHref(s), label: STATUS_LABELS[s], active: activeStatus === s })),
          ]}
        />
        <form className="flex items-center gap-2">
          {activeStatus && <input type="hidden" name="status" value={activeStatus} />}
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" aria-hidden />
            <input
              name="q"
              defaultValue={q}
              placeholder="Make or model"
              aria-label="Search make or model"
              className={`${fieldClass} w-56 pl-9`}
            />
          </div>
          <button type="submit" className={primaryButtonClass}>
            Search
          </button>
        </form>
      </div>

      <Panel
        flush
        title={total === 1 ? "1 listing" : `${total.toLocaleString("en-US")} listings`}
        description={q ? `Matching “${q}”` : undefined}
      >
        {listings.length === 0 ? (
          <EmptyState icon={Car} title="No listings match">
            Try another status or search term.
          </EmptyState>
        ) : (
          <div className={table.wrap}>
            <table className={`${table.table} min-w-[60rem]`}>
              <thead>
                <tr className={table.headRow}>
                  <th className={table.th}>Vehicle</th>
                  <th className={table.th}>Seller</th>
                  <th className={table.th}>Price</th>
                  <th className={table.th}>Status</th>
                  <th className={table.th}>Featured</th>
                  <th className={table.th}>Listed</th>
                  <th className={`${table.th} w-12`}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className={table.body}>
                {listings.map((listing) => {
                  const photo = listing.images[0];
                  const title = `${listing.year} ${listing.make} ${listing.model}`;
                  return (
                    <tr key={listing.id} className={table.row}>
                      <td className={table.td}>
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-18 shrink-0 overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800">
                            {photo ? (
                              <Image src={photo.url} alt="" fill sizes="72px" className="object-cover" />
                            ) : (
                              <Car className="absolute inset-0 m-auto size-5 text-zinc-400" aria-hidden />
                            )}
                          </div>
                          <div className="min-w-0">
                            {listing.status === "active" ? (
                              <Link href={`/listings/${listing.id}`} className={`block truncate ${linkClass}`}>
                                {title}
                              </Link>
                            ) : (
                              <span className="block truncate font-medium">{title}</span>
                            )}
                            <span className="mt-0.5 block text-xs text-zinc-500">
                              {formatKm(listing.mileage)}, {listing.city}
                            </span>
                            {listing.removed_reason && (
                              <span className="mt-0.5 block max-w-64 truncate text-xs text-red-700 dark:text-red-400" title={listing.removed_reason}>
                                Removed: {listing.removed_reason}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className={table.td}>
                        {listing.seller ? (
                          <div className="flex flex-col items-start gap-1">
                            <Link href={`/admin/users/${listing.seller.id}`} className={linkClass}>
                              {listing.seller.full_name ?? "Unnamed"}
                            </Link>
                            <Pill>{PLAN_LABELS[listing.seller.plan]}</Pill>
                          </div>
                        ) : (
                          <span className="text-zinc-500">Unknown</span>
                        )}
                      </td>
                      <td className={`${table.td} font-medium tabular-nums`}>
                        <RiyalPrice amount={listing.price} />
                      </td>
                      <td className={table.td}>
                        <StatusBadge status={listing.status} />
                      </td>
                      <td className={table.td}>
                        <FeaturedCell listing={listing} />
                      </td>
                      <td className={`${table.td} whitespace-nowrap text-zinc-600 dark:text-zinc-400`}>
                        {formatDay(listing.created_at)}
                      </td>
                      <td className={`${table.td} text-right`}>
                        <ListingRowActions
                          listingId={listing.id}
                          sellerId={listing.seller_id}
                          status={listing.status}
                          featured={isFeatured(listing)}
                          canFeature={!atFeaturedLimit(listing.featured)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Pager basePath="/admin/listings" params={params} page={page} total={total} />
    </div>
  );
}
