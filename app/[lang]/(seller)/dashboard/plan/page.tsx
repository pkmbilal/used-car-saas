import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "@/components/locale-link";
import { getMyPendingAddons } from "@/lib/addons";
import { requireSeller } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n-server";
import { getSellerListings } from "@/lib/listings";
import { getListingQuota } from "@/lib/plans";
import { noIndex } from "@/lib/seo";
import { PlanSummary } from "../plan-summary";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.sellerCenter.metaTitle, robots: noIndex };
}

export default async function PlanPage() {
  const { user, profile } = await requireSeller("/dashboard/plan");
  const { t, locale } = await getDictionary();
  const p = t.sellerCenter.plan;
  const [listings, quota, pendingAddons] = await Promise.all([
    getSellerListings(user.id),
    getListingQuota(),
    getMyPendingAddons(),
  ]);

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PlanSummary
        listings={listings}
        quota={quota}
        pendingAddons={pendingAddons}
        suspended={!!profile.suspended_at}
        t={t}
        locale={locale}
      />

      <section className="mt-6 flex flex-col gap-4 rounded-2xl bg-card p-4 shadow-[0_2px_10px_rgba(20,30,25,.06)] ring-1 ring-black/5 sm:flex-row sm:items-center sm:justify-between sm:p-5 dark:ring-white/10">
        <p className="text-zinc-700 dark:text-zinc-300">{p.compareBody}</p>
        <Link
          href="/pricing"
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 self-start rounded-full bg-gradient-to-b from-brand to-forest px-5 text-sm font-semibold text-white shadow-md shadow-forest/25 hover:text-white hover:brightness-110 sm:self-auto"
        >
          {p.comparePlans}
          <ArrowUpRight className="size-4 rtl:-scale-x-100" aria-hidden />
        </Link>
      </section>
    </div>
  );
}
