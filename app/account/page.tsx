import Link from "next/link";
import { VerificationBadges } from "@/components/verification-badges";
import { requireUser } from "@/lib/auth";
import { formatMonthYear } from "@/lib/format";
import { isDealerPlan } from "@/lib/plans";
import { updateProfile } from "./actions";
import { ProfileForm } from "./profile-form";

export default async function AccountPage({ searchParams }: PageProps<"/account">) {
  const { user, profile } = await requireUser("/account");
  const welcome = (await searchParams).welcome === "1";

  return (
    <main className="mx-auto w-full max-w-md px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Your account</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {user.email} · Member since {formatMonthYear(profile.created_at)}
      </p>
      <div className="mt-3">
        <VerificationBadges profile={profile} />
      </div>

      {welcome && (
        <p className="mt-6 rounded-md bg-green-50 px-4 py-3 text-sm text-green-900 dark:bg-green-950 dark:text-green-200">
          Welcome! Your account is confirmed. Add your name, phone and city below.
        </p>
      )}

      <div className="mt-8">
        <ProfileForm profile={profile} action={updateProfile} submitLabel="Save" />
      </div>

      {profile.role === "seller" && isDealerPlan(profile.plan) && (
        <p className="mt-8 text-sm">
          Add your business name, logo and showroom details.{" "}
          <Link href="/account/storefront" className="font-medium underline">
            Edit storefront
          </Link>
        </p>
      )}

      {profile.role === "seller" && profile.plan === "free" && (
        <p className="mt-8 text-sm">
          Selling as a business?{" "}
          <Link href="/account/dealer-application" className="font-medium underline">
            Apply for a dealer account
          </Link>
        </p>
      )}

      {profile.role === "seller" && !profile.id_verified_at && (
        <p className="mt-8 text-sm">
          Build buyer trust with an ID-verified badge.{" "}
          <Link href="/account/verification" className="font-medium underline">
            Get verified
          </Link>
        </p>
      )}

      {profile.role !== "seller" && (
        <p className="mt-8 text-sm">
          Want to sell a car?{" "}
          <Link href="/account/become-seller" className="font-medium underline">
            Become a seller
          </Link>
        </p>
      )}
    </main>
  );
}
