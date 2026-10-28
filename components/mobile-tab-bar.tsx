"use client";

import Link from "@/components/locale-link";
import { usePathname } from "next/navigation";
import { MobileAccountSheet, type HeaderLink, type HeaderUser } from "@/components/header-menus";
import { useDictionary } from "@/components/i18n-provider";
import { stripLocale } from "@/lib/i18n";
import { Car, Heart, House, Plus, Search, UserRound, type LucideIcon } from "lucide-react";

type Tab = { href: string; label: string; icon: LucideIcon; exact?: boolean; primary?: boolean; account?: boolean };

// Pages reached from the account sheet, which light up its tab.
const ACCOUNT_PATHS = ["/account", "/offers", "/saved-searches", "/admin"];

// Phone-only app-style navigation, fixed to the bottom of the screen.
export function MobileTabBar({
  user,
  isSeller,
  accountLinks,
}: {
  user: HeaderUser | null;
  isSeller: boolean;
  accountLinks: HeaderLink[];
}) {
  const pathname = stripLocale(usePathname());
  const { t } = useDictionary();

  // A listing's own page has its fixed Call/WhatsApp bar instead.
  if (/^\/listings\/[^/]+$/.test(pathname)) return null;

  const tabs: Tab[] = [
    { href: "/", label: t.nav.tabs.home, icon: House, exact: true },
    { href: "/listings", label: t.nav.tabs.buy, icon: Search, exact: true },
    isSeller
      ? { href: "/dashboard", label: t.nav.tabs.myCars, icon: Car, primary: true }
      : { href: "/account/become-seller", label: t.nav.tabs.sell, icon: Plus, primary: true },
    { href: "/favorites", label: t.nav.tabs.saved, icon: Heart },
    user
      ? { href: "/account", label: t.nav.tabs.account, icon: UserRound, account: true }
      : { href: "/login", label: t.nav.tabs.signIn, icon: UserRound },
  ];

  return (
    <nav
      data-tab-bar
      aria-label={t.nav.main}
      className="light pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 text-ink backdrop-blur md:hidden"
    >
      <ul className="mx-auto grid h-16 max-w-md grid-cols-5">
        {tabs.map(({ href, label, icon: Icon, exact, primary, account }) => {
          const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);
          if (account && user) {
            return (
              <li key={href}>
                <MobileAccountSheet user={user} links={accountLinks} active={ACCOUNT_PATHS.some(isActive)} />
              </li>
            );
          }
          const active = exact ? pathname === href : isActive(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex h-full flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium transition-colors ${
                  active ? "text-brand" : "text-zinc-500 active:text-ink"
                }`}
              >
                {primary ? (
                  <span
                    className={`-mt-5 grid size-12 place-items-center rounded-full text-white shadow-lg shadow-brand/30 ring-4 ring-white ${
                      active ? "bg-brand-dark" : "bg-brand"
                    }`}
                  >
                    <Icon className="size-6" aria-hidden />
                  </span>
                ) : (
                  <Icon className="size-[1.375rem]" strokeWidth={active ? 2.4 : 2} aria-hidden />
                )}
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
