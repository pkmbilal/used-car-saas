import type { Metadata } from "next";
import Link from "@/components/locale-link";
import { requireUser } from "@/lib/auth";
import { getLatestDealerApplication } from "@/lib/dealer-application";
import { isDealerPlanChoice } from "@/lib/dealer-application-options";
import { rich } from "@/components/rich-text";
import { fmt } from "@/lib/dictionary";
import { getDictionary } from "@/lib/i18n-server";
import { isDealerPlan } from "@/lib/plans";
import { DealerApplicationForm } from "./dealer-application-form";
import { noIndex } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.account.dealer.metaTitle, robots: noIndex };
}

const noticeClass = "rounded-md px-4 py-3 text-sm";

export default async function DealerApplicationPage({
  searchParams,
}: PageProps<"/[lang]/account/dealer-application">) {
  const { user, profile } = await requireUser("/account/dealer-application");
  const { plan } = await searchParams;
  const latest = await getLatestDealerApplication(user.id);
  const { t } = await getDictionary();
  const d = t.account.dealer;

  return (
    <main className="mx-auto w-full max-w-md px-4 py-12">
      <Link href="/account" className="text-sm text-zinc-600 dark:text-zinc-400">
        {t.account.backToAccount}
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">{d.title}</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {d.intro}
      </p>

      <div className="mt-8 flex flex-col gap-6">
        {isDealerPlan(profile.plan) ? (
          <p className={`${noticeClass} bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-200`}>
            {fmt(d.onPlan, { plan: fmt(t.plans.named, { plan: t.plans.labels[profile.plan] }) })}{" "}
            <Link href="/dashboard/storefront" className="font-medium underline">
              {d.setUpStorefront}
            </Link>
          </p>
        ) : latest?.status === "pending" ? (
          <p className={`${noticeClass} bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200`}>
            {rich(d.pending, {
              business: latest.business_name,
              link: (
                <Link href="/dashboard" className="font-medium underline">
                  {d.pendingLink}
                </Link>
              ),
            })}
          </p>
        ) : profile.suspended_at ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {d.suspended}
          </p>
        ) : (
          <>
            {latest?.status === "rejected" && (
              <p className={`${noticeClass} bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-200`}>
                {latest.reject_reason ? fmt(d.rejectedReason, { reason: latest.reject_reason }) : d.rejected}
              </p>
            )}
            <DealerApplicationForm
              profile={profile}
              defaultPlan={isDealerPlanChoice(plan) ? plan : undefined}
            />
          </>
        )}
      </div>
    </main>
  );
}
