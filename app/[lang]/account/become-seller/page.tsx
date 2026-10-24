import type { Metadata } from "next";
import Link from "@/components/locale-link";
import { requireUser } from "@/lib/auth";
import { isDealerPlanChoice } from "@/lib/dealer-application-options";
import { becomeSeller } from "../actions";
import { DealerApplicationForm } from "../dealer-application/dealer-application-form";
import { ProfileForm } from "../profile-form";
import { getDictionary, localeRedirect } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.account.becomeSellerPage.metaTitle };
}

export default async function BecomeSellerPage({
  searchParams,
}: PageProps<"/[lang]/account/become-seller">) {
  const { profile } = await requireUser("/account/become-seller");
  if (profile.role === "seller") return localeRedirect("/dashboard");
  const { type, plan } = await searchParams;
  const { t } = await getDictionary();
  const p = t.account.becomeSellerPage;
  const sellerTypes = [
    { type: "individual", title: p.individualTitle, description: p.individualDescription },
    { type: "dealer", title: p.dealerTitle, description: p.dealerDescription },
  ];

  if (type === "dealer") {
    return (
      <main className="mx-auto w-full max-w-md px-4 py-12">
        <Link href="/account/become-seller" className="text-sm text-zinc-600 dark:text-zinc-400">
          {p.backToType}
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">{p.dealerHeading}</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {p.dealerIntro}
        </p>
        <div className="mt-8">
          <DealerApplicationForm
            profile={profile}
            defaultPlan={isDealerPlanChoice(plan) ? plan : undefined}
          />
        </div>
      </main>
    );
  }

  if (type === "individual") {
    return (
      <main className="mx-auto w-full max-w-md px-4 py-12">
        <Link href="/account/become-seller" className="text-sm text-zinc-600 dark:text-zinc-400">
          {p.backToType}
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">{p.individualHeading}</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {p.individualIntro}
        </p>
        <div className="mt-8">
          <ProfileForm profile={profile} action={becomeSeller} submitLabel={p.startSelling} />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-md px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">{p.chooseHeading}</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        {p.chooseIntro}
      </p>
      <ul className="mt-8 flex flex-col gap-3">
        {sellerTypes.map(({ type, title, description }) => (
          <li key={type}>
            <Link
              href={`/account/become-seller?type=${type}`}
              className="block rounded-md border border-zinc-200 p-4 hover:border-zinc-900 dark:border-zinc-800 dark:hover:border-zinc-100"
            >
              <span className="block font-medium">{title}</span>
              <span className="mt-1 block text-sm text-zinc-600 dark:text-zinc-400">
                {description}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
