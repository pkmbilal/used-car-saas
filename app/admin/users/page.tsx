import Link from "next/link";
import { VerificationBadges } from "@/components/verification-badges";
import { getUsers } from "@/lib/admin";
import { getCurrentUser } from "@/lib/auth";
import { formatMonthYear } from "@/lib/format";
import { PLAN_LABELS, PLANS } from "@/lib/plans";
import {
  revokeIdVerificationAction,
  setUserPlanAction,
  suspendUserAction,
  unsuspendUserAction,
} from "../actions";
import { AdminActionButton, PlanSelect } from "../admin-buttons";

const planOptions = PLANS.map((plan) => ({ value: plan, label: PLAN_LABELS[plan] }));
import { pageParam, Pager, textParam } from "../pager";

export default async function AdminUsersPage({ searchParams }: PageProps<"/admin/users">) {
  const params = await searchParams;
  const q = textParam(params, "q");
  const page = pageParam(params);
  const [{ users, total }, current] = await Promise.all([getUsers({ q, page }), getCurrentUser()]);

  return (
    <>
      <form className="flex flex-wrap items-center gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Name or phone"
          aria-label="Search name or phone"
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button type="submit" className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
          Search
        </button>
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          {total === 1 ? "1 user" : `${total} users`}
        </span>
      </form>

      <ul className="mt-6 divide-y divide-zinc-200 dark:divide-zinc-800">
        {users.map((user) => (
          <li key={user.id} className="flex flex-wrap items-center gap-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{user.full_name ?? "Unnamed"}</span>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {user.role === "seller" ? "Seller" : "Buyer"}
                </span>
                {user.is_admin && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                    Admin
                  </span>
                )}
                {user.suspended_at && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-950 dark:text-red-300">
                    Suspended
                  </span>
                )}
                <VerificationBadges profile={user} />
              </div>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {[user.phone, user.city, `Joined ${formatMonthYear(user.created_at)}`]
                  .filter(Boolean)
                  .join(" · ")}
                {user.role === "seller" && (
                  <>
                    {" · "}
                    <Link href={`/sellers/${user.id}`} className="underline">
                      {user.listingCount === 1 ? "1 listing" : `${user.listingCount} listings`}
                    </Link>
                  </>
                )}
              </p>
            </div>
            {user.role === "seller" && (
              <PlanSelect
                plan={user.plan}
                plans={planOptions}
                action={setUserPlanAction.bind(null, user.id)}
              />
            )}
            {user.id_verified_at && (
              <AdminActionButton
                label="Revoke ID badge"
                tone="danger"
                action={revokeIdVerificationAction.bind(null, user.id)}
              />
            )}
            {user.id !== current?.user.id &&
              (user.suspended_at ? (
                <AdminActionButton label="Unsuspend" action={unsuspendUserAction.bind(null, user.id)} />
              ) : (
                <AdminActionButton
                  label="Suspend"
                  tone="danger"
                  action={suspendUserAction.bind(null, user.id)}
                />
              ))}
          </li>
        ))}
      </ul>
      {users.length === 0 && <p className="mt-6 text-zinc-600 dark:text-zinc-400">No users match.</p>}

      <Pager basePath="/admin/users" params={params} page={page} total={total} />
    </>
  );
}
