import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export async function SiteHeader() {
  const current = await getCurrentUser();
  const isSeller = current?.profile.role === "seller";

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <nav className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="font-semibold tracking-tight">
          Used Car Marketplace
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link
            href={isSeller ? "/dashboard" : "/account/become-seller"}
            className="font-medium"
          >
            {isSeller ? "My listings" : "Sell your car"}
          </Link>
          {current ? (
            <>
              <Link href="/account" className="text-zinc-600 dark:text-zinc-400">
                {current.profile.full_name || current.user.email}
              </Link>
              <form action="/auth/signout" method="post">
                <button type="submit" className="text-zinc-600 dark:text-zinc-400">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link href="/login" className="font-medium">
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
