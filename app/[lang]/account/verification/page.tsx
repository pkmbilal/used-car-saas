import type { Metadata } from "next";
import Link from "@/components/locale-link";
import { VerificationBadges } from "@/components/verification-badges";
import { requireSeller } from "@/lib/auth";
import { fmt } from "@/lib/dictionary";
import { formatMonthYear } from "@/lib/format";
import { getDictionary } from "@/lib/i18n-server";
import { getLatestIdVerificationRequest } from "@/lib/verification";
import { IdUploadForm } from "./id-upload-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.account.verification.metaTitle };
}

const noticeClass = "rounded-md px-4 py-3 text-sm";

export default async function VerificationPage() {
  const { user, profile } = await requireSeller("/account/verification");
  const latest = profile.id_verified_at ? null : await getLatestIdVerificationRequest(user.id);
  const { t, locale } = await getDictionary();
  const v = t.account.verification;

  return (
    <main className="mx-auto w-full max-w-md px-4 py-12">
      <Link href="/account" className="text-sm text-zinc-600 dark:text-zinc-400">
        {t.account.backToAccount}
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">{v.title}</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {v.intro}
      </p>
      <div className="mt-4">
        <VerificationBadges profile={profile} />
      </div>

      <h2 className="mt-10 text-lg font-medium">{v.idHeading}</h2>
      <div className="mt-4 flex flex-col gap-6">
        {profile.id_verified_at ? (
          <p className={`${noticeClass} bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-200`}>
            {fmt(v.verifiedOn, { date: formatMonthYear(profile.id_verified_at, locale) })}
          </p>
        ) : latest?.status === "pending" ? (
          <p className={`${noticeClass} bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200`}>
            {v.pending}
          </p>
        ) : profile.suspended_at ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {v.suspended}
          </p>
        ) : (
          <>
            {latest?.status === "rejected" && (
              <p className={`${noticeClass} bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-200`}>
                {latest.reject_reason ? fmt(v.rejectedReason, { reason: latest.reject_reason }) : v.rejected}
              </p>
            )}
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {v.instructions}
            </p>
            <IdUploadForm />
          </>
        )}
      </div>
    </main>
  );
}
