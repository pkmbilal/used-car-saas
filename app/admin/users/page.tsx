import Link from "next/link";
import { Search, Users } from "lucide-react";
import { VerificationBadges } from "@/components/verification-badges";
import { getUsers } from "@/lib/admin";
import { getCurrentUser } from "@/lib/auth";
import { formatDay, formatMonthYear } from "@/lib/format";
import { PLAN_LABELS } from "@/lib/plans";
import { pageParam, Pager, textParam } from "../pager";
import { Avatar, EmptyState, fieldClass, linkClass, Panel, Pill, primaryButtonClass, table } from "../ui";
import { UserRowActions } from "../user-row-actions";

export default async function AdminUsersPage({ searchParams }: PageProps<"/admin/users">) {
  const params = await searchParams;
  const q = textParam(params, "q");
  const page = pageParam(params);
  const [{ users, total }, current] = await Promise.all([getUsers({ q, page }), getCurrentUser()]);

  return (
    <div className="flex flex-col gap-4">
      <form className="flex items-center gap-2 self-end">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" aria-hidden />
          <input
            name="q"
            defaultValue={q}
            placeholder="Name or phone"
            aria-label="Search name or phone"
            className={`${fieldClass} w-60 pl-9`}
          />
        </div>
        <button type="submit" className={primaryButtonClass}>
          Search
        </button>
      </form>

      <Panel
        flush
        title={total === 1 ? "1 user" : `${total.toLocaleString("en-US")} users`}
        description={q ? `Matching “${q}”` : undefined}
      >
        {users.length === 0 ? (
          <EmptyState icon={Users} title="No users match">
            Search by full name or phone number.
          </EmptyState>
        ) : (
          <div className={table.wrap}>
            <table className={`${table.table} min-w-[56rem]`}>
              <thead>
                <tr className={table.headRow}>
                  <th className={table.th}>User</th>
                  <th className={table.th}>Contact</th>
                  <th className={table.th}>Plan</th>
                  <th className={table.th}>Listings</th>
                  <th className={table.th}>Joined</th>
                  <th className={`${table.th} w-12`}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className={table.body}>
                {users.map((user) => {
                  const isSeller = user.role === "seller";
                  return (
                    <tr key={user.id} className={table.row}>
                      <td className={table.td}>
                        <div className="flex items-center gap-3">
                          <Avatar name={user.full_name} />
                          <div className="min-w-0">
                            <Link href={`/admin/users/${user.id}`} className={`block truncate ${linkClass}`}>
                              {user.full_name ?? "Unnamed"}
                            </Link>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              <Pill tone={isSeller ? "brand" : "neutral"}>{isSeller ? "Seller" : "Buyer"}</Pill>
                              {user.is_admin && <Pill tone="blue">Admin</Pill>}
                              {user.suspended_at && <Pill tone="red">Suspended</Pill>}
                              <VerificationBadges profile={user} />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className={table.td}>
                        <span className="block tabular-nums">{user.phone ?? "No phone"}</span>
                        <span className="text-xs text-zinc-500">{user.city ?? "No city"}</span>
                      </td>
                      <td className={table.td}>
                        {isSeller ? (
                          <>
                            <span className="block font-medium">{PLAN_LABELS[user.plan]}</span>
                            <span className="text-xs text-zinc-500">
                              {user.plan_expires_at ? `Until ${formatDay(user.plan_expires_at)}` : "No end date"}
                            </span>
                          </>
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </td>
                      <td className={`${table.td} tabular-nums`}>{isSeller ? user.listingCount : <span className="text-zinc-400">—</span>}</td>
                      <td className={`${table.td} whitespace-nowrap text-zinc-600 dark:text-zinc-400`}>
                        {formatMonthYear(user.created_at)}
                      </td>
                      <td className={`${table.td} text-right`}>
                        <UserRowActions
                          userId={user.id}
                          isSeller={isSeller}
                          isSelf={user.id === current?.user.id}
                          suspended={user.suspended_at !== null}
                          idVerified={user.id_verified_at !== null}
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

      <Pager basePath="/admin/users" params={params} page={page} total={total} />
    </div>
  );
}
