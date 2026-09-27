import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { formatMonthYear } from "@/lib/format";
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

      {welcome && (
        <p className="mt-6 rounded-md bg-green-50 px-4 py-3 text-sm text-green-900 dark:bg-green-950 dark:text-green-200">
          Welcome! Your account is confirmed. Add your name, phone and city below.
        </p>
      )}

      <div className="mt-8">
        <ProfileForm profile={profile} action={updateProfile} submitLabel="Save" />
      </div>

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
