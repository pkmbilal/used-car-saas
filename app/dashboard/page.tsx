import { requireSeller } from "@/lib/auth";

export default async function DashboardPage() {
  const { profile } = await requireSeller();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Your listings</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Welcome, {profile.full_name}. Listing management is coming next.
      </p>
    </main>
  );
}
