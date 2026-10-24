import Link from "@/components/locale-link";
import { rich } from "@/components/rich-text";
import { ArrowRight } from "lucide-react";
import { fmt } from "@/lib/dictionary";
import { getDictionary } from "@/lib/i18n-server";
import type { ListingQuota } from "@/lib/plans";
import { cn } from "@/lib/utils";

// The signed-in seller's plan and this month's listing usage.
export async function UsageBanner({
  quota,
  applicationPending,
}: {
  quota: ListingQuota;
  applicationPending: boolean;
}) {
  const { t } = await getDictionary();
  const u = t.pricing.usage;
  const percent = quota.limit === null ? 0 : Math.min(100, Math.round((quota.used / quota.limit) * 100));

  return (
    <div className="flex flex-col gap-4 rounded-lg bg-white p-5 shadow-[0_2px_10px_rgba(20,30,25,.05)] sm:flex-row sm:items-center sm:gap-8">
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          {rich(u.onPlan, {
            plan: <span className="font-semibold">{fmt(t.plans.named, { plan: t.plans.labels[quota.plan] })}</span>,
          })}
        </p>
        <p className="mt-1 text-label text-muted-foreground">
          {quota.limit === null
            ? fmt(u.unlimited, { used: quota.used })
            : fmt(u.usedOf, { used: quota.used, limit: quota.limit })}
          {quota.featuredAllowance !== null &&
            fmt(u.featured, { used: quota.featuredUsed, allowance: quota.featuredAllowance })}
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
          <p className="mt-3 text-label text-amber-700">{u.pending}</p>
        )}
      </div>
      <Link
        href="/dashboard"
        className="flex items-center gap-1.5 text-label font-semibold text-brand hover:text-brand-dark"
      >
        {u.dashboard}
        <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );
}
