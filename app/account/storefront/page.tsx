import type { Metadata } from "next";
import Link from "next/link";
import { requireSeller } from "@/lib/auth";
import { isDealerPlan, PLAN_LABELS } from "@/lib/plans";
import { publicUrl } from "@/lib/r2";
import { LogoUploader } from "./logo-uploader";
import { StorefrontForm } from "./storefront-form";

export const metadata: Metadata = {
  title: "Storefront | Used Car Marketplace",
};

export default async function StorefrontPage() {
  const { user, profile } = await requireSeller("/account/storefront");

  return (
    <main className="mx-auto w-full max-w-md px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Dealer storefront</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Your branding on your public seller page.{" "}
        <Link href={`/sellers/${user.id}`} className="font-medium underline">
          View storefront
        </Link>
      </p>

      {isDealerPlan(profile.plan) ? (
        <div className="mt-8 flex flex-col gap-8">
          <LogoUploader logoUrl={profile.logo_key ? publicUrl(profile.logo_key) : null} />
          <StorefrontForm profile={profile} />
        </div>
      ) : (
        <p className="mt-8 rounded-md bg-zinc-100 px-4 py-3 text-sm dark:bg-zinc-800">
          Storefronts with your business name, logo and showroom details are part of the{" "}
          {PLAN_LABELS.dealer} plans. You&apos;re on the {PLAN_LABELS[profile.plan]} plan. Contact
          us to upgrade.
        </p>
      )}
    </main>
  );
}
