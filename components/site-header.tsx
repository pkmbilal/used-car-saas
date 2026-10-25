import Link from "@/components/locale-link";
import { Car } from "lucide-react";
import { BrandLink } from "@/components/brand";
import { MobileNav, UserMenu, type HeaderLink, type HeaderUser } from "@/components/header-menus";
import { HeaderShell } from "@/components/header-shell";
import { LanguageSwitcher } from "@/components/language-switcher";
import { outlineButton, sellButton } from "@/components/header-styles";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import { NavLink } from "@/components/nav-link";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n-server";
import { publicUrl } from "@/lib/r2";

export async function SiteHeader() {
  const current = await getCurrentUser();
  const { t } = await getDictionary();
  const isSeller = current?.profile.role === "seller";

  const mainLinks: HeaderLink[] = [
    { href: "/", label: t.nav.home },
    { href: "/listings", label: t.nav.buyCars },
    { href: "/dealers", label: t.nav.dealers },
    { href: "/locations", label: t.nav.locations },
    { href: "/pricing", label: t.nav.pricing },
    ...(isSeller ? [{ href: "/dashboard", label: t.nav.myListings }] : []),
  ];
  const sellHref = isSeller ? "/dashboard/listings/new" : "/account/become-seller";
  const accountLinks: HeaderLink[] = current
    ? [
        ...(isSeller
          ? [{ href: "/dashboard", label: t.nav.myListings, hint: t.nav.hints.myListings, icon: "listings" as const }]
          : []),
        { href: "/favorites", label: t.nav.savedCars, hint: t.nav.hints.savedCars, icon: "saved" },
        { href: "/saved-searches", label: t.nav.savedSearches, hint: t.nav.hints.savedSearches, icon: "searches" },
        ...(current.profile.is_admin
          ? [{ href: "/admin", label: t.nav.admin, hint: t.nav.hints.admin, icon: "admin" as const }]
          : []),
        { href: "/account", label: t.nav.account, hint: t.nav.hints.account, icon: "account" },
      ]
    : [];
  const user: HeaderUser | null = current
    ? {
        name: current.profile.full_name || current.user.email || t.nav.account,
        avatarUrl: current.profile.avatar_key ? publicUrl(current.profile.avatar_key) : null,
        email: current.user.email ?? null,
        role: current.profile.role,
        plan: current.profile.plan,
        isAdmin: current.profile.is_admin,
      }
    : null;
  // On phones the bottom tab bar covers Home, Buy, Sell and Saved, and its
  // account tab opens the account links; the menu keeps the rest.
  const tabHrefs = ["/", "/listings", "/dashboard", "/account/become-seller", "/favorites"];
  // The footer (with Contact) is hidden on phones, so the menu links it instead.
  const menuLinks = [
    ...mainLinks.filter((link) => !tabHrefs.includes(link.href)),
    { href: "/contact", label: t.nav.contact },
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
            {user ? (
              <UserMenu user={user} links={accountLinks} />
            ) : (
              <Button asChild variant="outline" className={outlineButton}>
                <Link href="/login">{t.nav.signIn}</Link>
              </Button>
            )}
            <Button asChild className={sellButton}>
              <Link href={sellHref}>
                <Car className="size-4" />
                {t.nav.sellYourCar}
              </Link>
            </Button>
          </div>
          <div className="ms-auto md:hidden">
            <MobileNav links={menuLinks} signedIn={!!current} />
          </div>
        </nav>
      </HeaderShell>
      <MobileTabBar user={user} isSeller={isSeller} accountLinks={accountLinks} />
    </>
  );
}
