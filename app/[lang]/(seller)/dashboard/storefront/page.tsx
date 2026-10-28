import type { Metadata } from "next";
import Link from "@/components/locale-link";
import { requireSeller } from "@/lib/auth";
import { fmt } from "@/lib/dictionary";
import { getDictionary } from "@/lib/i18n-server";
import { isDealerPlan } from "@/lib/plans";
import { publicUrl } from "@/lib/r2";
import { LogoUploader } from "./logo-uploader";
import { StorefrontForm } from "./storefront-form";
import { noIndex } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.account.storefront.metaTitle, robots: noIndex };
}

export default async function StorefrontPage() {
  const { user, profile } = await requireSeller("/dashboard/storefront");
  const { t } = await getDictionary();
  const s = t.account.storefront;

  return (
    <div className="mx-auto w-full max-w-md">
      <h1 className="text-2xl font-semibold tracking-tight">{s.title}</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {s.intro}{" "}
        <Link href={`/sellers/${user.id}`} className="font-medium underline">
          {s.view}
        </Link>
      </p>

      {isDealerPlan(profile.plan) ? (
        <div className="mt-8 flex flex-col gap-8">
          <LogoUploader logoUrl={profile.logo_key ? publicUrl(profile.logo_key) : null} />
          <StorefrontForm profile={profile} />
        </div>
      ) : (
        <p className="mt-8 rounded-md bg-zinc-100 px-4 py-3 text-sm dark:bg-zinc-800">
          {fmt(s.upsell, { plan: fmt(t.plans.named, { plan: t.plans.labels[profile.plan] }) })}{" "}
          <Link href="/pricing" className="font-medium underline">
            {s.seePlans}
          </Link>
        </p>
      )}
    </div>
  );
}
