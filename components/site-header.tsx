import Link from "next/link";
import { BrandLink } from "@/components/brand";
import { MenuIcon } from "@/components/icons";
import { NavLink } from "@/components/nav-link";
import { getCurrentUser } from "@/lib/auth";

type Current = Awaited<ReturnType<typeof getCurrentUser>>;

const outlineButton =
  "rounded-lg border border-white/70 px-4 py-2 text-[13px] font-semibold text-white hover:bg-white/10";
const accentButton =
  "rounded-lg bg-accent px-4 py-2 text-[13px] font-bold text-on-accent hover:bg-accent-light";

function MainLinks({ isSeller }: { isSeller: boolean }) {
  return (
    <>
      <NavLink href="/" exact>
        Home
      </NavLink>
      <NavLink href="/listings">Buy Cars</NavLink>
      <NavLink href={isSeller ? "/dashboard" : "/account/become-seller"}>
        {isSeller ? "My Listings" : "Sell Your Car"}
      </NavLink>
    </>
  );
}

function AccountLinks({ current }: { current: Current }) {
  if (!current) {
    return (
      <>
        <Link href="/login" className={outlineButton}>
          Sign in
        </Link>
        <Link href="/signup" className={accentButton}>
          Sign up
        </Link>
      </>
    );
  }

  return (
    <>
      <NavLink href="/favorites">Saved</NavLink>
      <NavLink href="/saved-searches">Searches</NavLink>
      {current.profile.is_admin && <NavLink href="/admin">Admin</NavLink>}
      <Link href="/account" className="max-w-40 truncate py-2 text-white/75 hover:text-accent">
        {current.profile.full_name || current.user.email}
      </Link>
      <form action="/auth/signout" method="post">
        <button type="submit" className={outlineButton}>
          Sign out
        </button>
      </form>
    </>
  );
}

export async function SiteHeader() {
  const current = await getCurrentUser();
  const isSeller = current?.profile.role === "seller";

  return (
    <header className="relative z-20 bg-charcoal text-white">
      <nav className="mx-auto flex h-[72px] w-full max-w-6xl items-center gap-10 px-4 sm:px-6">
        <BrandLink />
        <div className="hidden items-center gap-8 text-[13px] font-medium md:flex">
          <MainLinks isSeller={isSeller} />
        </div>
        <div className="ml-auto hidden items-center gap-5 text-[13px] font-medium md:flex">
          <AccountLinks current={current} />
        </div>

        {/* Mobile: a native disclosure keeps this a server component. */}
        <details className="group ml-auto md:hidden">
          <summary
            aria-label="Menu"
            className="flex size-10 cursor-pointer list-none items-center justify-center rounded-lg border border-white/30 [&::-webkit-details-marker]:hidden"
          >
            <MenuIcon size={20} />
          </summary>
          <div className="absolute inset-x-0 top-[72px] flex flex-col gap-1 border-t border-white/10 bg-charcoal px-4 pt-2 pb-5 text-sm font-medium shadow-xl">
            <MainLinks isSeller={isSeller} />
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-white/10 pt-4">
              <AccountLinks current={current} />
            </div>
          </div>
        </details>
      </nav>
    </header>
  );
}
