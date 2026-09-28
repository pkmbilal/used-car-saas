import type { Metadata } from "next";
import Link from "next/link";
import { VerificationBadges } from "@/components/verification-badges";
import { requireSeller } from "@/lib/auth";
import { formatMonthYear } from "@/lib/format";
import { getLatestIdVerificationRequest } from "@/lib/verification";
import { IdUploadForm } from "./id-upload-form";

export const metadata: Metadata = {
  title: "Verification | Used Car Marketplace",
};

const noticeClass = "rounded-md px-4 py-3 text-sm";

export default async function VerificationPage() {
  const { user, profile } = await requireSeller("/account/verification");
  const latest = profile.id_verified_at ? null : await getLatestIdVerificationRequest(user.id);

  return (
    <main className="mx-auto w-full max-w-md px-4 py-12">
      <Link href="/account" className="text-sm text-zinc-600 dark:text-zinc-400">
        ← Your account
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">Verification</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Badges appear next to your name on your listings and seller page.
      </p>
      <div className="mt-4">
        <VerificationBadges profile={profile} />
      </div>

      <h2 className="mt-10 text-lg font-medium">ID verification</h2>
      <div className="mt-4 flex flex-col gap-6">
        {profile.id_verified_at ? (
          <p className={`${noticeClass} bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-200`}>
            Your ID was verified in {formatMonthYear(profile.id_verified_at)}.
          </p>
        ) : latest?.status === "pending" ? (
          <p className={`${noticeClass} bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200`}>
            Your ID is under review. We&apos;ll add the badge once it&apos;s approved.
          </p>
        ) : profile.suspended_at ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Your account is suspended, so you can&apos;t request ID verification.
          </p>
        ) : (
          <>
            {latest?.status === "rejected" && (
              <p className={`${noticeClass} bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-200`}>
                Your last request was not approved
                {latest.reject_reason ? `: ${latest.reject_reason}` : "."} You can submit again.
              </p>
            )}
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Upload a clear photo or scan of your ID. Our team checks it against your profile name
              and deletes the files once reviewed.
            </p>
            <IdUploadForm />
          </>
        )}
      </div>
    </main>
  );
}
