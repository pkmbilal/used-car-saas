import Link from "next/link";
import { getFeaturedGrants, getPlanChanges } from "@/lib/admin";
import { formatDay } from "@/lib/format";
import { PLAN_LABELS } from "@/lib/plans";
import { pageParam, Pager } from "../pager";

const SOURCE_LABELS = {
  admin: "Admin",
  dealer_application: "Dealer application",
  expiry: "Expired",
} as const;

// Plan changes and featured grants, newest first. This is the record of what
// was granted by hand until billing lands.
export default async function AdminPlansPage({ searchParams }: PageProps<"/admin/plans">) {
  const params = await searchParams;
  const tab = params.tab === "featured" ? "featured" : "plans";
  const page = pageParam(params);

  return (
    <>
      <nav className="flex gap-4 text-sm">
        <Link href="/admin/plans" className={tab === "plans" ? "font-semibold" : "underline"}>
          Plan changes
        </Link>
        <Link
          href="/admin/plans?tab=featured"
          className={tab === "featured" ? "font-semibold" : "underline"}
        >
          Featured grants
        </Link>
      </nav>
      {tab === "plans" ? (
        <PlanChanges params={params} page={page} />
      ) : (
        <FeaturedGrants params={params} page={page} />
      )}
    </>
  );
}

type ListProps = { params: Record<string, string | string[] | undefined>; page: number };

const rowClass = "flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3";
const metaClass = "text-sm text-zinc-600 dark:text-zinc-400";

async function PlanChanges({ params, page }: ListProps) {
  const { changes, total } = await getPlanChanges(page);

  return (
    <>
      <ul className="mt-6 divide-y divide-zinc-200 dark:divide-zinc-800">
        {changes.map((change) => (
          <li key={change.id} className={rowClass}>
            <div className="min-w-0">
              <p>
                <Link href={`/sellers/${change.user_id}`} className="font-medium underline">
                  {change.user?.full_name ?? "Unnamed"}
                </Link>{" "}
                {PLAN_LABELS[change.from_plan]} → {PLAN_LABELS[change.to_plan]}
                {change.expires_at && ` until ${formatDay(change.expires_at)}`}
              </p>
              {change.note && <p className={metaClass}>{change.note}</p>}
            </div>
            <p className={metaClass}>
              {SOURCE_LABELS[change.source]}
              {change.changed_by_profile?.full_name && ` by ${change.changed_by_profile.full_name}`}
              {` · ${formatDay(change.created_at)}`}
            </p>
          </li>
        ))}
      </ul>
      {changes.length === 0 && <p className="mt-6 text-zinc-600 dark:text-zinc-400">No plan changes yet.</p>}
      <Pager basePath="/admin/plans" params={params} page={page} total={total} />
    </>
  );
}

async function FeaturedGrants({ params, page }: ListProps) {
  const { grants, total } = await getFeaturedGrants(page);

  return (
    <>
      <ul className="mt-6 divide-y divide-zinc-200 dark:divide-zinc-800">
        {grants.map((grant) => (
          <li key={grant.id} className={rowClass}>
            <p className="min-w-0">
              {grant.listing ? (
                <Link href={`/listings/${grant.listing.id}`} className="font-medium underline">
                  {grant.listing.year} {grant.listing.make} {grant.listing.model}
                </Link>
              ) : (
                <span className="font-medium">Deleted listing</span>
              )}{" "}
              · {grant.seller?.full_name ?? "Unnamed"} · {grant.days} days, until{" "}
              {formatDay(grant.featured_until)}
            </p>
            <p className={metaClass}>
              {grant.self_serve
                ? "Self-serve"
                : `By ${grant.granted_by_profile?.full_name ?? "admin"}`}
              {` · ${formatDay(grant.created_at)}`}
            </p>
          </li>
        ))}
      </ul>
      {grants.length === 0 && <p className="mt-6 text-zinc-600 dark:text-zinc-400">No featured grants yet.</p>}
      <Pager basePath="/admin/plans" params={params} page={page} total={total} />
    </>
  );
}
