import Link from "next/link";
import {
  BadgeCheck,
  BadgeX,
  Ban,
  CircleCheck,
  Flag,
  RotateCcw,
  Star,
  Store,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import type { AdminActionRow, AdminActionType } from "@/lib/admin";
import { formatDay } from "@/lib/format";
import { ADMIN_ACTION_LABELS } from "./labels";
import { EmptyState, linkClass } from "./ui";

// Icon and colour per decision: red for take-downs, green for approvals.
const ACTION_STYLE: Record<AdminActionType, { icon: LucideIcon; tone: string }> = {
  listing_removed: { icon: Trash2, tone: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300" },
  listing_restored: { icon: RotateCcw, tone: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300" },
  reports_dismissed: { icon: Flag, tone: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" },
  listing_unfeatured: { icon: Star, tone: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
  user_suspended: { icon: Ban, tone: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300" },
  user_unsuspended: { icon: CircleCheck, tone: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300" },
  id_approved: { icon: BadgeCheck, tone: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300" },
  id_rejected: { icon: BadgeX, tone: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300" },
  id_revoked: { icon: BadgeX, tone: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300" },
  dealer_approved: { icon: Store, tone: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300" },
  dealer_rejected: { icon: Store, tone: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300" },
};

// Moderation log as a timeline, shared by the Activity page and the user
// detail page.
export function ActionList({ actions, empty }: { actions: AdminActionRow[]; empty: string }) {
  if (actions.length === 0) return <EmptyState icon={CircleCheck} title={empty} />;

  return (
    <ol className="relative">
      {actions.map((action, index) => {
        const { icon: Icon, tone } = ACTION_STYLE[action.action];
        return (
          <li key={action.id} className="relative flex gap-4 pb-6 last:pb-0">
            {index < actions.length - 1 && (
              <span className="absolute top-10 bottom-0 left-[1.125rem] w-px bg-line dark:bg-zinc-800" aria-hidden />
            )}
            <span className={`relative grid size-9 shrink-0 place-items-center rounded-full ${tone}`}>
              <Icon className="size-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1 pt-1.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className="text-sm">
                  {ADMIN_ACTION_LABELS[action.action]}{" "}
                  {action.listing ? (
                    <Link href={`/listings/${action.listing.id}`} className={linkClass}>
                      {action.listing.year} {action.listing.make} {action.listing.model}
                    </Link>
                  ) : action.user ? (
                    <Link href={`/admin/users/${action.user.id}`} className={linkClass}>
                      {action.user.full_name ?? "Unnamed"}
                    </Link>
                  ) : (
                    <span className="font-medium">a deleted record</span>
                  )}
                  {action.listing && action.user && (
                    <>
                      {", listed by "}
                      <Link href={`/admin/users/${action.user.id}`} className={linkClass}>
                        {action.user.full_name ?? "Unnamed"}
                      </Link>
                    </>
                  )}
                </p>
                <p className="text-xs whitespace-nowrap text-zinc-500">{formatDay(action.created_at)}</p>
              </div>
              {action.reason && (
                <p className="mt-2 rounded-lg bg-canvas px-3 py-2 text-sm text-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300">
                  {action.reason}
                </p>
              )}
              <p className="mt-1 text-xs text-zinc-500">By {action.admin?.full_name ?? "a former admin"}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
