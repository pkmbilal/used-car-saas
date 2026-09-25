import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { becomeSeller } from "../actions";
import { ProfileForm } from "../profile-form";

export default async function BecomeSellerPage() {
  const { profile } = await requireUser("/account/become-seller");
  if (profile.role === "seller") redirect("/dashboard");

  return (
    <main className="mx-auto w-full max-w-md px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Sell your car</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Buyers will contact you using these details, so make sure they&apos;re correct.
      </p>

      <div className="mt-8">
        <ProfileForm profile={profile} action={becomeSeller} submitLabel="Start selling" />
      </div>
    </main>
  );
}
