import Link from "next/link";
import { RiyalPrice } from "@/components/riyal-price";
import { EXPIRING_WINDOW_DAYS, getAdminOverview } from "@/lib/admin";
import { formatCount } from "@/lib/format";
import { PLAN_LABELS, PLANS } from "@/lib/plans";

function Tile({
  label,
  value,
  href,
  alert = false,
}: {
  label: string;
  value: React.ReactNode;
  href?: string;
  alert?: boolean;
}) {
  const body = (
    <>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${alert ? "text-red-600" : ""}`}>{value}</p>
    </>
  );
  const className =
    "block rounded-lg border border-zinc-200 p-4 dark:border-zinc-800";
  return href ? (
    <Link href={href} className={`${className} hover:border-zinc-400 dark:hover:border-zinc-600`}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

const gridClass = "mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4";

export default async function AdminOverviewPage() {
  const overview = await getAdminOverview();
  const paidPlans = PLANS.filter((plan) => plan !== "free");

  return (
    <div className="flex flex-col gap-10">
      <section>
        <h2 className="font-semibold">Needs attention</h2>
        <div className={gridClass}>
          <Tile
            label="Open reports"
            value={overview.pending.reports}
            href="/admin/reports"
            alert={overview.pending.reports > 0}
          />
          <Tile
            label="ID verifications"
            value={overview.pending.verifications}
            href="/admin/verifications"
            alert={overview.pending.verifications > 0}
          />
          <Tile
            label="Dealer applications"
            value={overview.pending.dealers}
            href="/admin/dealers"
            alert={overview.pending.dealers > 0}
          />
          <Tile
            label={`Plans ending in ${EXPIRING_WINDOW_DAYS} days`}
            value={overview.expiringPlans}
            href="/admin/plans?tab=expiring"
            alert={overview.expiringPlans > 0}
          />
        </div>
      </section>

      <section>
        <h2 className="font-semibold">Marketplace</h2>
        <div className={gridClass}>
          <Tile label="Live listings" value={overview.activeListings} href="/admin/listings?status=active" />
          <Tile label="Featured now" value={overview.featuredListings} />
          <Tile label="New listings, last 7 days" value={overview.newListings} />
          <Tile label="New users, last 7 days" value={overview.newUsers} href="/admin/users" />
        </div>
      </section>

      <section>
        <h2 className="font-semibold">Plans</h2>
        <div className={gridClass}>
          {paidPlans.map((plan) => (
            <Tile
              key={plan}
              label={PLAN_LABELS[plan]}
              value={formatCount(overview.planCounts.get(plan) ?? 0, "seller")}
            />
          ))}
          <Tile
            label="Payments recorded this month"
            value={<RiyalPrice amount={overview.paymentsThisMonth} />}
            href="/admin/plans?tab=payments"
          />
        </div>
      </section>
    </div>
  );
}
