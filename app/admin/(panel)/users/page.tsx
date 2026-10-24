import Link from "next/link";
import { Search, Users } from "lucide-react";
import { VerificationBadges } from "@/components/verification-badges";
import { getUsers } from "@/lib/admin";
import { getCurrentUser } from "@/lib/auth";
import { formatDay, formatMonthYear } from "@/lib/format";
import { PLAN_LABELS } from "@/lib/plans";
import { pageParam, Pager, textParam } from "../pager";
import { Avatar, EmptyState, fieldClass, linkClass, Panel, Pill, primaryButtonClass, table } from "../ui";
import { cn } from "@/lib/utils";
import { ExpandableRow } from "../expandable-row";
import { UserRowActions } from "../user-row-actions";

export default async function AdminUsersPage({ searchParams }: PageProps<"/admin/users">) {
  const params = await searchParams;
  const q = textParam(params, "q");
  const page = pageParam(params);
  const [{ users, total }, current] = await Promise.all([getUsers({ q, page }), getCurrentUser()]);

  return (
    <div className="flex flex-col gap-4">
      <form className="flex w-full items-center gap-2 sm:w-auto sm:self-end">
        <div className="relative flex-1 sm:flex-none">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" aria-hidden />
          <input
            name="q"
            defaultValue={q}
            placeholder="Name or phone"
            aria-label="Search name or phone"
            className={`${fieldClass} w-full pl-9 sm:w-60`}
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
            <table className={`${table.table} md:min-w-[56rem]`}>
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
                    <ExpandableRow key={user.id}>
                      <td className={cn(table.td, table.tdPrimary, "max-md:pr-20")}>
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
                      <td data-label="Contact" className={cn(table.td, table.tdDetail)}>
                        <span className="block tabular-nums">{user.phone ?? "No phone"}</span>
                        <span className="text-xs text-zinc-500">{user.city ?? "No city"}</span>
                      </td>
                      <td data-label="Plan" className={cn(table.td, table.tdDetail)}>
                        {isSeller ? (
                          <>
                            <span className="block font-medium">{PLAN_LABELS[user.plan]}</span>
                            <span className="text-xs text-zinc-500">
                              {user.plan_expires_at ? `Until ${formatDay(user.plan_expires_at, "en")}` : "No end date"}
                            </span>
                          </>
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </td>
                      <td data-label="Listings" className={cn(table.td, table.tdDetail, "tabular-nums")}>{isSeller ? user.listingCount : <span className="text-zinc-400">—</span>}</td>
                      <td data-label="Joined" className={cn(table.td, table.tdDetail, "whitespace-nowrap text-zinc-600 dark:text-zinc-400")}>
                        {formatMonthYear(user.created_at, "en")}
                      </td>
                      <td className={`${table.td} text-right ${table.tdActions}`}>
                        <UserRowActions
                          userId={user.id}
                          isSeller={isSeller}
                          isSelf={user.id === current?.user.id}
                          suspended={user.suspended_at !== null}
                          idVerified={user.id_verified_at !== null}
                        />
                      </td>
                    </ExpandableRow>
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
