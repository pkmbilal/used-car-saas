import type { Metadata } from "next";
import Link from "@/components/locale-link";
import { VerificationBadges } from "@/components/verification-badges";
import { requireUser } from "@/lib/auth";
import { fmt } from "@/lib/dictionary";
import { formatMonthYear } from "@/lib/format";
import { getDictionary } from "@/lib/i18n-server";
import { isDealerPlan } from "@/lib/plans";
import { publicUrl } from "@/lib/r2";
import { updateProfile } from "./actions";
import { AvatarUploader } from "./avatar-uploader";
import { ProfileForm } from "./profile-form";
import { noIndex } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.account.metaTitle, robots: noIndex };
}

export default async function AccountPage({ searchParams }: PageProps<"/[lang]/account">) {
  const { user, profile } = await requireUser("/account");
  const welcome = (await searchParams).welcome === "1";
  const { t, locale } = await getDictionary();
  const a = t.account;

  return (
    <main className="mx-auto w-full max-w-md px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">{a.title}</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {fmt(a.memberSince, { email: user.email ?? "", date: formatMonthYear(profile.created_at, locale) })}
      </p>
      <div className="mt-3">
        <VerificationBadges profile={profile} />
      </div>

      {welcome && (
        <p className="mt-6 rounded-md bg-green-50 px-4 py-3 text-sm text-green-900 dark:bg-green-950 dark:text-green-200">
          {a.welcome}
        </p>
      )}

      <div className="mt-8">
        <AvatarUploader
          name={profile.full_name}
          avatarUrl={profile.avatar_key ? publicUrl(profile.avatar_key) : null}
        />
      </div>

      <div className="mt-8">
        <ProfileForm profile={profile} action={updateProfile} submitLabel={a.save} />
      </div>

      {profile.role === "seller" && isDealerPlan(profile.plan) && (
        <p className="mt-8 text-sm">
          {a.storefrontPrompt}{" "}
          <Link href="/dashboard/storefront" className="font-medium underline">
            {a.editStorefront}
          </Link>
        </p>
      )}

      {profile.role === "seller" && profile.plan === "free" && (
        <p className="mt-8 text-sm">
          {a.businessPrompt}{" "}
          <Link href="/pricing" className="font-medium underline">
            {a.seeDealerPlans}
          </Link>
        </p>
      )}

      {profile.role === "seller" && !profile.id_verified_at && (
        <p className="mt-8 text-sm">
          {a.trustPrompt}{" "}
          <Link href="/account/verification" className="font-medium underline">
            {a.getVerified}
          </Link>
        </p>
      )}

      {profile.role !== "seller" && (
        <p className="mt-8 text-sm">
          {a.sellPrompt}{" "}
          <Link href="/account/become-seller" className="font-medium underline">
            {a.becomeSeller}
          </Link>
        </p>
      )}
    </main>
  );
}
