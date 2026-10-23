import Link from "@/components/locale-link";
import { Car } from "lucide-react";
import { BrandLink } from "@/components/brand";
import { MobileNav, UserMenu, type HeaderLink } from "@/components/header-menus";
import { HeaderShell } from "@/components/header-shell";
import { LanguageSwitcher } from "@/components/language-switcher";
import { outlineButton, sellButton } from "@/components/header-styles";
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
    ...(isSeller ? [{ href: "/dashboard", label: "My Listings" }] : []),
  ];
  const sellHref = isSeller ? "/dashboard/listings/new" : "/account/become-seller";
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
  // The footer (with Contact) is hidden on phones, so the menu links it instead.
  const menuLinks = [
    ...[...mainLinks, ...accountLinks].filter((link) => !tabHrefs.includes(link.href)),
    { href: "/contact", label: "Contact" },
  ];

  return (
    <>
      <HeaderShell>
        <nav className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-4 transition-[height] duration-300 sm:px-6 md:h-[4.5rem] md:group-data-scrolled:h-16 lg:gap-8">
          <BrandLink />
          <div className="hidden items-center gap-0.5 rounded-full bg-white/[0.04] p-1 text-label font-medium ring-1 ring-white/10 md:flex">
            {mainLinks.map((link) => (
              <NavLink key={link.href} href={link.href} exact={link.href === "/"}>
                {link.label}
              </NavLink>
            ))}
          </div>
          <div className="ms-auto hidden items-center gap-3 md:flex">
            <LanguageSwitcher className="rounded-full px-2 text-label font-medium text-white/70 transition-colors hover:text-white" />
            {current ? (
              <UserMenu name={current.profile.full_name || current.user.email || "Account"} links={accountLinks} />
            ) : (
              <Button asChild variant="outline" className={outlineButton}>
                <Link href="/login">Sign in</Link>
              </Button>
            )}
            <Button asChild className={sellButton}>
              <Link href={sellHref}>
                <Car className="size-4" />
                Sell your car
              </Link>
            </Button>
          </div>
          <div className="ms-auto md:hidden">
            <MobileNav links={menuLinks} signedIn={!!current} />
          </div>
        </nav>
      </HeaderShell>
      <MobileTabBar signedIn={!!current} isSeller={isSeller} />
    </>
  );
}
