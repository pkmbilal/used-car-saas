import Link from "next/link";
import { StatusBadge } from "@/app/dashboard/listings/status-badge";
import { getAllListings } from "@/lib/admin";
import { formatMonthYear, formatSAR } from "@/lib/format";
import type { ListingStatus } from "@/lib/listings";
import { restoreListingAction } from "../actions";
import { AdminActionButton, RemoveListingButton } from "../admin-buttons";
import { pageParam, Pager, textParam } from "../pager";

const STATUSES: ListingStatus[] = ["active", "draft", "sold", "removed"];

function isStatus(value: string | undefined): value is ListingStatus {
  return STATUSES.includes(value as ListingStatus);
}

const inputClass =
  "rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900";

export default async function AdminListingsPage({ searchParams }: PageProps<"/admin/listings">) {
  const params = await searchParams;
  const status = textParam(params, "status");
  const q = textParam(params, "q");
  const page = pageParam(params);
  const { listings, total } = await getAllListings({
    status: isStatus(status) ? status : undefined,
    q,
    page,
  });

  return (
    <>
      <form className="flex flex-wrap items-center gap-3">
        <input name="q" defaultValue={q} placeholder="Make or model" aria-label="Search make or model" className={inputClass} />
        <select name="status" defaultValue={isStatus(status) ? status : ""} aria-label="Status" className={inputClass}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s[0].toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
          Filter
        </button>
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          {total === 1 ? "1 listing" : `${total} listings`}
        </span>
      </form>

      <ul className="mt-6 divide-y divide-zinc-200 dark:divide-zinc-800">
        {listings.map((listing) => (
          <li key={listing.id} className="flex flex-wrap items-center gap-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {listing.status === "active" ? (
                  <Link href={`/listings/${listing.id}`} className="truncate font-medium">
                    {listing.year} {listing.make} {listing.model}
                  </Link>
                ) : (
                  <span className="truncate font-medium">
                    {listing.year} {listing.make} {listing.model}
                  </span>
                )}
                <StatusBadge status={listing.status} />
              </div>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {formatSAR(listing.price)} · {listing.city} · {listing.seller?.full_name ?? "Unnamed"} ·
                Listed {formatMonthYear(listing.created_at)}
              </p>
              {listing.removed_reason && (
                <p className="mt-1 text-sm text-red-700 dark:text-red-400">
                  Removed: {listing.removed_reason}
                </p>
              )}
            </div>
            {listing.status === "active" && <RemoveListingButton listingId={listing.id} />}
            {listing.status === "removed" && (
              <AdminActionButton label="Restore" action={restoreListingAction.bind(null, listing.id)} />
            )}
          </li>
        ))}
      </ul>
      {listings.length === 0 && (
        <p className="mt-6 text-zinc-600 dark:text-zinc-400">No listings match.</p>
      )}

      <Pager basePath="/admin/listings" params={params} page={page} total={total} />
    </>
  );
}
