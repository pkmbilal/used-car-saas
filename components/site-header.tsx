import Link from "next/link";
import { BrandLink } from "@/components/brand";
import { MobileNav, UserMenu, type HeaderLink } from "@/components/header-menus";
import { limeButton, outlineButton } from "@/components/header-styles";
import { NavLink } from "@/components/nav-link";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";

export async function SiteHeader() {
  const current = await getCurrentUser();
  const isSeller = current?.profile.role === "seller";

  const mainLinks: HeaderLink[] = [
    { href: "/", label: "Home" },
    { href: "/listings", label: "Buy Cars" },
    isSeller
      ? { href: "/dashboard", label: "My Listings" }
      : { href: "/account/become-seller", label: "Sell Your Car" },
  ];
  const accountLinks: HeaderLink[] = current
    ? [
        { href: "/favorites", label: "Saved cars" },
        { href: "/saved-searches", label: "Saved searches" },
        ...(current.profile.is_admin ? [{ href: "/admin", label: "Admin" }] : []),
        { href: "/account", label: "Account" },
      ]
    : [];

  return (
    <header className="light relative z-20 bg-charcoal text-white">
      <nav className="mx-auto flex h-[72px] w-full max-w-6xl items-center gap-10 px-4 sm:px-6">
        <BrandLink />
        <div className="hidden items-center gap-8 text-[13px] font-medium md:flex">
          {mainLinks.map((link) => (
            <NavLink key={link.href} href={link.href} exact={link.href === "/"}>
              {link.label}
            </NavLink>
          ))}
        </div>
        <div className="ml-auto hidden items-center gap-3 md:flex">
          {current ? (
            <UserMenu name={current.profile.full_name || current.user.email || "Account"} links={accountLinks} />
          ) : (
            <>
              <Button asChild variant="outline" className={outlineButton}>
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild className={limeButton}>
                <Link href="/signup">Sign up</Link>
              </Button>
            </>
          )}
        </div>
        <div className="ml-auto md:hidden">
          <MobileNav mainLinks={mainLinks} accountLinks={accountLinks} signedIn={!!current} />
        </div>
      </nav>
    </header>
  );
}
