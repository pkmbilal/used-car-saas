"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Car,
  ChartLine,
  CreditCard,
  ExternalLink,
  HandCoins,
  LayoutDashboard,
  Lock,
  Menu,
  Plus,
  Store,
  Upload,
  X,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/brand";
import { UserMenu, type HeaderLink, type HeaderUser } from "@/components/header-menus";
import { useDictionary } from "@/components/i18n-provider";
import { LanguageSwitcher } from "@/components/language-switcher";
import Link from "@/components/locale-link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { localizePath, stripLocale } from "@/lib/i18n";

// The Seller Center: the admin panel's layout (sidebar, top bar, phone tab
// bar) for sellers, in both languages.

export type SellerSection = {
  href: string;
  label: string;
  count?: number;
  // Not in the seller's plan: shown with a lock, opens the upgrade teaser.
  locked?: boolean;
  // Shown as the page heading on sections that don't render their own.
  description?: string;
};

export type SellerAlert = { href: string; label: string };

const ICONS: Record<string, LucideIcon> = {
  "/dashboard": LayoutDashboard,
  "/dashboard/listings": Car,
  "/dashboard/insights": ChartLine,
  "/dashboard/offers": HandCoins,
  "/dashboard/listings/import": Upload,
  "/dashboard/storefront": Store,
  "/dashboard/plan": CreditCard,
};

// Phone tab bar: the busiest sections, plus "More" for the full drawer.
const TAB_HREFS = ["/dashboard", "/dashboard/listings", "/dashboard/offers", "/dashboard/insights"];

function matches(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

// The deepest matching section, so /dashboard/listings/import lights Import,
// not Listings.
function activeSection(pathname: string, sections: SellerSection[]) {
  return sections
    .filter(({ href }) => matches(pathname, href))
    .sort((a, b) => b.href.length - a.href.length)[0];
}

function CountBadge({ count, className = "" }: { count?: number; className?: string }) {
  if (!count) return null;
  return (
    <span
      className={`grid min-w-5 place-items-center rounded-full bg-red-500 px-1.5 text-xs leading-5 font-semibold text-white ${className}`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

function Sidebar({
  sections,
  active,
  open,
  onClose,
}: {
  sections: SellerSection[];
  active: SellerSection | undefined;
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useDictionary();
  const s = t.sellerCenter;
  return (
    <aside
      className={`pt-safe pb-safe fixed inset-y-0 start-0 z-50 flex w-64 shrink-0 flex-col bg-forest text-white transition-transform print:hidden lg:sticky lg:top-0 lg:z-auto lg:h-svh lg:translate-x-0 ${
        open ? "translate-x-0" : "max-lg:ltr:-translate-x-full max-lg:rtl:translate-x-full"
      }`}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
        <Link href="/dashboard" onClick={onClose}>
          <Logo className="h-9 w-auto" />
          <p className="mt-2 text-eyebrow font-semibold tracking-[0.16em] text-lime uppercase rtl:tracking-normal">
            {s.title}
          </p>
        </Link>
        <button
          type="button"
          onClick={onClose}
          aria-label={s.closeMenu}
          className="rounded p-1 hover:bg-white/10 lg:hidden"
        >
          <X className="size-5" />
        </button>
      </div>
      <nav aria-label={s.title} className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {sections.map((section) => {
          const Icon = ICONS[section.href] ?? LayoutDashboard;
          const current = section.href === active?.href;
          return (
            <Link
              key={section.href}
              href={section.href}
              onClick={onClose}
              aria-current={current ? "page" : undefined}
              title={section.locked ? s.locked : undefined}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium ${
                current ? "bg-brand text-white" : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="size-5 shrink-0" aria-hidden />
              <span className="flex-1">{section.label}</span>
              {section.locked ? (
                <Lock className="size-3.5 text-lime/80" aria-label={s.locked} />
              ) : (
                <CountBadge count={section.count} />
              )}
            </Link>
          );
        })}
      </nav>
      <div className="flex flex-col gap-1 border-t border-white/10 p-3">
        <LanguageSwitcher variant="row" className="text-sm" />
        <Link
          href="/"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white"
        >
          <ExternalLink className="size-5 shrink-0" aria-hidden />
          {s.viewSite}
        </Link>
      </div>
    </aside>
  );
}

function SellerTabBar({
  sections,
  active,
  onMore,
}: {
  sections: SellerSection[];
  active: SellerSection | undefined;
  onMore: () => void;
}) {
  const { t } = useDictionary();
  const s = t.sellerCenter;
  const tabs = TAB_HREFS.flatMap((href) => sections.filter((section) => section.href === href));
  const tabClass = "relative flex h-full flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium";
  // "More" lights up on sections that don't have their own tab.
  const onOther = !!active && !TAB_HREFS.includes(active.href);
  const otherWaiting = sections.some((section) => section.count && !TAB_HREFS.includes(section.href));

  return (
    <nav
      aria-label={s.title}
      className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 backdrop-blur print:hidden lg:hidden dark:border-zinc-800 dark:bg-zinc-900/95"
    >
      <ul className="mx-auto grid h-16 max-w-xl grid-cols-5">
        {tabs.map(({ href, label, count, locked }) => {
          const Icon = ICONS[href] ?? LayoutDashboard;
          const current = href === active?.href;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={current ? "page" : undefined}
                className={`${tabClass} ${current ? "text-brand dark:text-lime" : "text-zinc-500 dark:text-zinc-400"}`}
              >
                <span className="relative">
                  <Icon className="size-[1.375rem]" strokeWidth={current ? 2.4 : 2} aria-hidden />
                  {locked ? (
                    <Lock className="absolute -end-2 -top-1 size-3 text-zinc-400" aria-label={s.locked} />
                  ) : (
                    <CountBadge count={count} className="absolute -end-3 -top-2 min-w-4 px-1 text-[0.625rem] leading-4" />
                  )}
                </span>
                {label}
              </Link>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            onClick={onMore}
            aria-label={s.moreSections}
            className={`${tabClass} w-full ${onOther ? "text-brand dark:text-lime" : "text-zinc-500 dark:text-zinc-400"}`}
          >
            <span className="relative">
              <Menu className="size-[1.375rem]" aria-hidden />
              {otherWaiting && <span className="absolute -end-1 -top-0.5 size-2.5 rounded-full bg-red-500" aria-hidden />}
            </span>
            {s.more}
          </button>
        </li>
      </ul>
    </nav>
  );
}

function AlertsMenu({ alerts }: { alerts: SellerAlert[] }) {
  const router = useRouter();
  const { t, locale } = useDictionary();
  const n = t.sellerCenter.notifications;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={n.label}
        className="relative rounded-md p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        <Bell className="size-5" />
        {alerts.length > 0 && (
          <span className="absolute end-1.5 top-1.5 size-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-zinc-900" aria-hidden />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>{n.title}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {alerts.length === 0 ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">{n.none}</p>
        ) : (
          alerts.map((alert) => (
            <DropdownMenuItem key={alert.label} onSelect={() => router.push(localizePath(locale, alert.href))}>
              {alert.label}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SellerShell({
  sections,
  alerts,
  user,
  accountLinks,
  children,
}: {
  sections: SellerSection[];
  alerts: SellerAlert[];
  user: HeaderUser;
  accountLinks: HeaderLink[];
  children: React.ReactNode;
}) {
  const { t } = useDictionary();
  const s = t.sellerCenter;
  const pathname = stripLocale(usePathname());
  const [menuOpen, setMenuOpen] = useState(false);
  const active = activeSection(pathname, sections);

  // While the phone drawer is open: Escape closes it and the page behind
  // doesn't scroll.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [menuOpen]);

  return (
    <div className="flex min-h-svh flex-1 bg-canvas dark:bg-zinc-950">
      <Sidebar sections={sections} active={active} open={menuOpen} onClose={() => setMenuOpen(false)} />
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMenuOpen(false)} aria-hidden />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="pt-safe sticky top-0 z-20 border-b border-line bg-white print:hidden dark:border-zinc-800 dark:bg-zinc-900">
          <header className="flex h-16 items-center gap-2 px-3 sm:gap-3 sm:px-6">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label={s.openMenu}
              className="rounded-md p-2 text-zinc-600 hover:bg-zinc-100 lg:hidden dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <Menu className="size-5" />
            </button>
            <p className="truncate font-semibold">
              <span className="lg:hidden">{s.title}</span>
              <span className="max-lg:hidden">{active?.label ?? s.title}</span>
            </p>
            <div className="ms-auto flex items-center gap-1 sm:gap-3">
              <Link
                href="/dashboard/listings/new"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-gradient-to-b from-brand to-forest px-3 text-sm font-semibold text-white shadow-sm shadow-forest/25 hover:text-white hover:brightness-110 sm:px-4"
              >
                <Plus className="size-4" aria-hidden />
                <span className="max-sm:sr-only">{s.newListing}</span>
              </Link>
              <AlertsMenu alerts={alerts} />
              <span className="h-6 w-px bg-line max-sm:hidden dark:bg-zinc-800" aria-hidden />
              <UserMenu user={user} links={accountLinks} tone="light" />
            </div>
          </header>
        </div>

        <main className="flex flex-col gap-6 px-4 py-5 sm:px-6 sm:py-8 max-lg:pb-[calc(5.25rem+env(safe-area-inset-bottom))] print:p-0">
          {active?.description && pathname === active.href && (
            <div className="mx-auto w-full max-w-5xl">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{active.label}</h1>
              <p className="mt-1.5 text-zinc-600 dark:text-zinc-400">{active.description}</p>
            </div>
          )}
          <div>{children}</div>
        </main>
      </div>
      <SellerTabBar sections={sections} active={active} onMore={() => setMenuOpen(true)} />
    </div>
  );
}
