import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Car, CircleCheck, Download, MapPin, MessageCircle, Users } from "lucide-react";
import { RiyalPrice } from "@/components/riyal-price";
import { StatusBadge } from "@/app/[lang]/dashboard/listings/status-badge";
import { DASHBOARD_RANGES, EXPIRING_WINDOW_DAYS, getDashboard, isDashboardRange } from "@/lib/admin";
import { formatCount, formatDay, formatKm } from "@/lib/format";
import { isFeatured } from "@/lib/listings";
import { PLAN_LABELS, PLANS } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { ActivityChart } from "./activity-chart";
import { AttentionRow, Card, cardClass, ChangeBadge, formatNumber, KpiCard, StatusDonut } from "./dashboard-widgets";
import { ExpandableRow } from "./expandable-row";
import { table } from "./ui";
import { ListingRowActions } from "./listing-row-actions";
import { textParam } from "./pager";

export default async function AdminOverviewPage({ searchParams }: PageProps<"/admin">) {
  const params = await searchParams;
  const requested = Number(textParam(params, "range"));
  const days = isDashboardRange(requested) ? requested : 30;
  const d = await getDashboard(days);

  const live = d.statuses.find((s) => s.status === "active")?.count ?? 0;
  const paidPlans = PLANS.filter((plan) => plan !== "free");
  const rangeLabel = `last ${days} days`;

  return (
    <div className="admin-viz flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-500">
            Admin <span className="mx-1.5">/</span>
            <span className="text-zinc-900 dark:text-zinc-100">Overview</span>
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Marketplace overview</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">How KarSouq is doing over the {rangeLabel}.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 max-sm:w-full">
          <nav aria-label="Date range" className="flex rounded-md max-sm:w-full border border-zinc-300 bg-white p-0.5 dark:border-zinc-700 dark:bg-zinc-900">
            {DASHBOARD_RANGES.map((range) => (
              <Link
                key={range}
                href={range === 30 ? "/admin" : `/admin?range=${range}`}
                aria-current={range === days ? "page" : undefined}
                className={`flex-1 rounded px-3 py-1.5 text-center text-sm font-medium whitespace-nowrap ${
                  range === days
                    ? "bg-brand text-white"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                }`}
              >
                {range} days
              </Link>
            ))}
          </nav>
          <a
            href={`/admin/export?range=${days}`}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-brand max-sm:w-full px-3 py-1.5 text-sm font-medium text-brand hover:bg-mint dark:text-lime dark:hover:bg-zinc-800"
          >
            <Download className="size-4" aria-hidden />
            Export listings CSV
          </a>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total listings"
          value={formatNumber(d.totalListings)}
          icon={Car}
          iconClass="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
          trend={d.activity.map((p) => p.listings)}
          href="/admin/listings"
          footer={
            <>
              <ChangeBadge change={d.listingsChange} />
              <span>
                {formatNumber(d.newListingsInRange)} new in the {rangeLabel}
              </span>
            </>
          }
        />
        <KpiCard
          label="Live listings"
          value={formatNumber(live)}
          icon={CircleCheck}
          iconClass="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
          href="/admin/listings?status=active"
          footer={
            <span>
              {d.totalListings ? `${Math.round((live / d.totalListings) * 100)}% of all listings` : "No listings yet"} ·{" "}
              {formatNumber(d.featuredListings)} featured now
            </span>
          }
        />
        <KpiCard
          label="Users"
          value={formatNumber(d.totalUsers)}
          icon={Users}
          iconClass="bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
          trend={d.activity.map((p) => p.users)}
          href="/admin/users"
          footer={
            <>
              <ChangeBadge change={d.usersChange} />
              <span>
                {formatNumber(d.newUsersInRange)} joined in the {rangeLabel}
              </span>
            </>
          }
        />
        <KpiCard
          label="Buyer contacts"
          value={formatNumber(d.contacts)}
          icon={MessageCircle}
          iconClass="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
          footer={
            <span>
              {formatCount(d.calls, "call")} · {formatCount(d.whatsapps, "WhatsApp")} · {formatCount(d.views, "view")}, all
              time
            </span>
          }
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        <Card title="Marketplace activity">
          <ActivityChart points={d.activity} />
        </Card>
        <Card title="Listings by status">
          <StatusDonut statuses={d.statuses} total={d.totalListings} />
        </Card>
      </div>

      <section className={`${cardClass} overflow-hidden`}>
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4 dark:border-zinc-800">
          <h2 className="font-semibold">Recently added listings</h2>
          <Link href="/admin/listings" className="inline-flex items-center gap-1 text-sm font-medium text-brand dark:text-lime">
            View all <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        <div className={table.wrap}>
          <table className={`${table.table} tabular-nums md:min-w-[56rem]`}>
            <thead>
              <tr className={table.headRow}>
                <th className={table.th}>Vehicle</th>
                <th className={table.th}>Seller</th>
                <th className={table.th}>City</th>
                <th className={table.th}>Price</th>
                <th className={table.th}>Status</th>
                <th className={table.th}>Added</th>
                <th className={`${table.th} w-12`}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className={table.body}>
              {d.recentListings.map((listing) => {
                const photo = listing.images[0];
                const featured = listing.status === "active" && isFeatured(listing);
                return (
                  <ExpandableRow key={listing.id}>
                    <td className={cn(table.td, table.tdPrimary, "max-md:pr-20")}>
                      <div className="flex items-center gap-3">
                        <div className="relative h-11 w-18 shrink-0 overflow-hidden rounded bg-zinc-100 dark:bg-zinc-800">
                          {photo ? (
                            <Image src={photo.url} alt="" fill sizes="72px" className="object-cover" />
                          ) : (
                            <Car className="absolute inset-0 m-auto size-5 text-zinc-400" aria-hidden />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {listing.year} {listing.make} {listing.model}
                          </p>
                          <p className="mt-0.5 text-xs text-zinc-500 capitalize">
                            {formatKm(listing.mileage, "en")} · {listing.fuel_type}
                            {featured && <span className="ml-1.5 normal-case text-amber-700 dark:text-amber-400">· Featured</span>}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td data-label="Seller" className={cn(table.td, table.tdDetail)}>
                      {listing.seller ? (
                        <>
                          <Link href={`/admin/users/${listing.seller.id}`} className="font-medium hover:text-brand">
                            {listing.seller.full_name ?? "Unnamed"}
                          </Link>
                          <span className="mt-0.5 block w-fit rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                            {PLAN_LABELS[listing.seller.plan]}
                          </span>
                        </>
                      ) : (
                        <span className="text-zinc-500">Unknown</span>
                      )}
                    </td>
                    <td data-label="City" className={cn(table.td, table.tdDetail)}>
                      <span className="inline-flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                        <MapPin className="size-4 text-zinc-400" aria-hidden />
                        {listing.city}
                      </span>
                    </td>
                    <td data-label="Price" className={`${table.td} font-medium`}>
                      <RiyalPrice amount={listing.price} />
                    </td>
                    <td data-label="Status" className={table.td}>
                      <StatusBadge status={listing.status} />
                    </td>
                    <td data-label="Added" className={cn(table.td, table.tdDetail, "text-zinc-600 dark:text-zinc-400")}>
                      {formatDay(listing.created_at, "en")}
                    </td>
                    <td className={`${table.td} text-right ${table.tdActions}`}>
                      <ListingRowActions
                        listingId={listing.id}
                        sellerId={listing.seller_id}
                        status={listing.status}
                        featured={featured}
                      />
                    </td>
                  </ExpandableRow>
                );
              })}
            </tbody>
          </table>
          {d.recentListings.length === 0 && <p className="px-5 py-6 text-sm text-zinc-600 dark:text-zinc-400">No listings yet.</p>}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Needs attention">
          <ul className="-my-3 divide-y divide-line dark:divide-zinc-800">
            <AttentionRow label="Open reports" count={d.pending.reports} href="/admin/reports" />
            <AttentionRow label="ID verifications" count={d.pending.verifications} href="/admin/verifications" />
            <AttentionRow label="Dealer applications" count={d.pending.dealers} href="/admin/dealers" />
            <AttentionRow
              label={`Plans ending in ${EXPIRING_WINDOW_DAYS} days`}
              count={d.expiringPlans}
              href="/admin/plans?tab=expiring"
            />
          </ul>
        </Card>
        <Card
          title="Plans & payments"
          action={
            <Link href="/admin/plans?tab=payments" className="text-sm font-medium text-brand dark:text-lime">
              Payments
            </Link>
          }
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {paidPlans.map((plan) => (
              <div key={plan} className="rounded-md bg-canvas p-3 dark:bg-zinc-800/60">
                <p className="text-xs text-zinc-600 dark:text-zinc-400">{PLAN_LABELS[plan]}</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">{formatNumber(d.planCounts.get(plan) ?? 0)}</p>
              </div>
            ))}
            <div className="rounded-md bg-canvas p-3 dark:bg-zinc-800/60">
              <p className="text-xs text-zinc-600 dark:text-zinc-400">Paid this month</p>
              <p className="mt-1 text-lg font-semibold">
                <RiyalPrice amount={d.paymentsThisMonth} />
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            {formatNumber(d.newListings)} listings and {formatNumber(d.newUsers)} users added in the last 7 days.
          </p>
        </Card>
      </div>
    </div>
  );
}
