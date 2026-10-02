import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { becomeSeller } from "../actions";
import { DealerApplicationForm } from "../dealer-application/dealer-application-form";
import { ProfileForm } from "../profile-form";

const SELLER_TYPES = [
  {
    type: "individual",
    title: "Individual seller",
    description: "Selling your own car. List up to 3 cars a month for free.",
  },
  {
    type: "dealer",
    title: "Dealer / showroom",
    description: "Selling as a business. Get a branded storefront, CSV import and higher limits.",
  },
] as const;

export default async function BecomeSellerPage({
  searchParams,
}: PageProps<"/account/become-seller">) {
  const { profile } = await requireUser("/account/become-seller");
  if (profile.role === "seller") redirect("/dashboard");
  const { type } = await searchParams;

  if (type === "dealer") {
    return (
      <main className="mx-auto w-full max-w-md px-4 py-12">
        <Link href="/account/become-seller" className="text-sm text-zinc-600 dark:text-zinc-400">
          ← Seller type
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Sell as a dealer</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Tell us about your business. Our team reviews your application and upgrades your
          account once approved.
        </p>
        <div className="mt-8">
          <DealerApplicationForm profile={profile} />
        </div>
      </main>
    );
  }

  if (type === "individual") {
    return (
      <main className="mx-auto w-full max-w-md px-4 py-12">
        <Link href="/account/become-seller" className="text-sm text-zinc-600 dark:text-zinc-400">
          ← Seller type
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Sell your car</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Buyers will contact you using these details, so make sure they&apos;re correct.
        </p>
        <div className="mt-8">
          <ProfileForm profile={profile} action={becomeSeller} submitLabel="Start selling" />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-md px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">How are you selling?</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Choose the account that fits you. Individuals can apply for a dealer account later.
      </p>
      <ul className="mt-8 flex flex-col gap-3">
        {SELLER_TYPES.map(({ type, title, description }) => (
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
