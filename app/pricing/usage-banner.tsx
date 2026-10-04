import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PLAN_LABELS, type ListingQuota } from "@/lib/plans";
import { cn } from "@/lib/utils";

// The signed-in seller's plan and this month's listing usage.
export function UsageBanner({
  quota,
  applicationPending,
}: {
  quota: ListingQuota;
  applicationPending: boolean;
}) {
  const percent = quota.limit === null ? 0 : Math.min(100, Math.round((quota.used / quota.limit) * 100));

  return (
    <div className="flex flex-col gap-4 rounded-lg bg-white p-5 shadow-[0_2px_10px_rgba(20,30,25,.05)] sm:flex-row sm:items-center sm:gap-8">
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          You&apos;re on the <span className="font-semibold">{PLAN_LABELS[quota.plan]}</span> plan
        </p>
        <p className="mt-1 text-[0.8125rem] text-muted-foreground">
          {quota.limit === null
            ? `Unlimited listings · ${quota.used} created this month`
            : `${quota.used} of ${quota.limit} listings used this month`}
          {quota.featuredAllowance !== null &&
            ` · ${quota.featuredUsed} of ${quota.featuredAllowance} featured listings used`}
        </p>
        {quota.limit !== null && (
          <div className="mt-3 h-1.5 max-w-sm overflow-hidden rounded-full bg-mint">
            <div
              className={cn("h-full rounded-full", percent >= 80 ? "bg-amber-500" : "bg-brand")}
              style={{ width: `${percent}%` }}
            />
          </div>
        )}
        {applicationPending && (
          <p className="mt-3 text-[0.8125rem] text-amber-700">Your dealer application is under review.</p>
        )}
      </div>
      <Link
        href="/dashboard"
        className="flex items-center gap-1.5 text-[0.8125rem] font-semibold text-brand hover:text-brand-dark"
      >
        Go to dashboard
        <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );
}
