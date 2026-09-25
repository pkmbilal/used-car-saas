import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { updateProfile } from "./actions";
import { ProfileForm } from "./profile-form";

const memberSinceFormatter = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
});

export default async function AccountPage() {
  const { user, profile } = await requireUser("/account");

  return (
    <main className="mx-auto w-full max-w-md px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Your account</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {user.email} · Member since {memberSinceFormatter.format(new Date(profile.created_at))}
      </p>

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
