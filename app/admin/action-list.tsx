import Link from "next/link";
import type { AdminActionRow } from "@/lib/admin";
import { formatDay } from "@/lib/format";
import { ADMIN_ACTION_LABELS } from "./labels";

const metaClass = "text-sm text-zinc-600 dark:text-zinc-400";

// Moderation log rows, shared by the Activity page and the user detail page.
export function ActionList({ actions, empty }: { actions: AdminActionRow[]; empty: string }) {
  if (actions.length === 0) return <p className={`mt-4 ${metaClass}`}>{empty}</p>;

  return (
    <ul className="mt-4 divide-y divide-zinc-200 dark:divide-zinc-800">
      {actions.map((action) => (
        <li key={action.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3">
          <div className="min-w-0">
            <p>
              {ADMIN_ACTION_LABELS[action.action]}{" "}
              {action.listing ? (
                <Link href={`/listings/${action.listing.id}`} className="font-medium underline">
                  {action.listing.year} {action.listing.make} {action.listing.model}
                </Link>
              ) : action.user ? (
                <Link href={`/admin/users/${action.user.id}`} className="font-medium underline">
                  {action.user.full_name ?? "Unnamed"}
                </Link>
              ) : (
                <span className="font-medium">a deleted record</span>
              )}
              {action.listing && action.user && (
                <>
                  {" · "}
                  <Link href={`/admin/users/${action.user.id}`} className="underline">
                    {action.user.full_name ?? "Unnamed"}
                  </Link>
                </>
              )}
            </p>
            {action.reason && <p className={metaClass}>{action.reason}</p>}
          </div>
          <p className={metaClass}>
            By {action.admin?.full_name ?? "a former admin"} · {formatDay(action.created_at)}
          </p>
        </li>
      ))}
    </ul>
  );
}
