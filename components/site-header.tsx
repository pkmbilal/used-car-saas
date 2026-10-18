import Link from "next/link";
import { BrandLink } from "@/components/brand";
import { MobileNav, UserMenu, type HeaderLink } from "@/components/header-menus";
import { limeButton, outlineButton } from "@/components/header-styles";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import { NavLink } from "@/components/nav-link";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";

export async function SiteHeader() {
  const current = await getCurrentUser();
  const isSeller = current?.profile.role === "seller";

  const mainLinks: HeaderLink[] = [
    { href: "/", label: "Home" },
    { href: "/listings", label: "Buy Cars" },
    { href: "/dealers", label: "Dealers" },
    { href: "/locations", label: "Locations" },
    { href: "/pricing", label: "Pricing" },
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
  // On phones the bottom tab bar covers Home, Buy, Sell, Saved and Account;
  // the menu keeps the rest.
  const tabHrefs = ["/", "/listings", "/dashboard", "/account/become-seller", "/favorites", "/account"];
  const menuLinks = [...mainLinks, ...accountLinks].filter((link) => !tabHrefs.includes(link.href));

  return (
    <>
      <header className="light pt-safe sticky top-0 z-30 bg-charcoal text-white">
        <nav className="mx-auto flex h-14 w-full md:h-[4.5rem] max-w-6xl items-center gap-10 px-4 sm:px-6">
          <BrandLink />
          <div className="hidden items-center gap-8 text-label font-medium md:flex">
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
            <MobileNav links={menuLinks} signedIn={!!current} />
          </div>
        </nav>
      </header>
      <MobileTabBar signedIn={!!current} isSeller={isSeller} />
    </>
  );
}
