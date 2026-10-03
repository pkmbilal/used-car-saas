import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getLatestDealerApplication } from "@/lib/dealer-application";
import { isDealerPlanChoice } from "@/lib/dealer-application-options";
import { isDealerPlan, PLAN_LABELS } from "@/lib/plans";
import { DealerApplicationForm } from "./dealer-application-form";

export const metadata: Metadata = {
  title: "Dealer account | DriveLoop",
};

const noticeClass = "rounded-md px-4 py-3 text-sm";

export default async function DealerApplicationPage({
  searchParams,
}: PageProps<"/account/dealer-application">) {
  const { user, profile } = await requireUser("/account/dealer-application");
  const { plan } = await searchParams;
  const latest = await getLatestDealerApplication(user.id);

  return (
    <main className="mx-auto w-full max-w-md px-4 py-12">
      <Link href="/account" className="text-sm text-zinc-600 dark:text-zinc-400">
        ← Your account
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">Dealer account</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Dealers get a branded storefront, CSV import and higher monthly listing limits.
      </p>

      <div className="mt-8 flex flex-col gap-6">
        {isDealerPlan(profile.plan) ? (
          <p className={`${noticeClass} bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-200`}>
            You&apos;re on the {PLAN_LABELS[profile.plan]} plan.{" "}
            <Link href="/account/storefront" className="font-medium underline">
              Set up your storefront
            </Link>
          </p>
        ) : latest?.status === "pending" ? (
          <p className={`${noticeClass} bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200`}>
            Your application for {latest.business_name} is under review. We&apos;ll contact you
            on your mobile number. Meanwhile you can{" "}
            <Link href="/dashboard" className="font-medium underline">
              list cars on the free plan
            </Link>
            .
          </p>
        ) : profile.suspended_at ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Your account is suspended, so you can&apos;t apply for a dealer account.
          </p>
        ) : (
          <>
            {latest?.status === "rejected" && (
              <p className={`${noticeClass} bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-200`}>
                Your last application was not approved
                {latest.reject_reason ? `: ${latest.reject_reason}` : "."} You can apply again.
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
