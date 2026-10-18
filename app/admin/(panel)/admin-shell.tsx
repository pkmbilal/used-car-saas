"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BadgeCheck,
  Bell,
  Car,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Flag,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  Store,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar } from "./ui";

export type AdminUser = { id: string; name: string; email: string | null; isSeller: boolean };

export type AdminSection = { href: string; label: string; count?: number; description?: string };

const ICONS: Record<string, LucideIcon> = {
  "/admin": LayoutDashboard,
  "/admin/reports": Flag,
  "/admin/listings": Car,
  "/admin/users": Users,
  "/admin/verifications": BadgeCheck,
  "/admin/dealers": Store,
  "/admin/plans": CreditCard,
  "/admin/activity": History,
};

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

function Sidebar({
  sections,
  open,
  onClose,
}: {
  sections: AdminSection[];
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  return (
    <aside
      className={`pt-safe pb-safe fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col bg-forest text-white transition-transform lg:sticky lg:top-0 lg:z-auto lg:h-svh lg:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
        <Link href="/admin" onClick={onClose}>
          <p className="text-lg font-semibold leading-none">DriveLoop</p>
          <p className="mt-1.5 text-eyebrow font-semibold tracking-[0.16em] text-lime">ADMIN</p>
        </Link>
        <button type="button" onClick={onClose} aria-label="Close menu" className="rounded p-1 hover:bg-white/10 lg:hidden">
          <X className="size-5" />
        </button>
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {sections.map(({ href, label, count }) => {
          const Icon = ICONS[href] ?? LayoutDashboard;
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium ${
                active ? "bg-brand text-white" : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="size-5 shrink-0" aria-hidden />
              <span className="flex-1">{label}</span>
              {count ? (
                <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-semibold leading-none text-white">
                  {count}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-3">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white"
        >
          <ExternalLink className="size-5 shrink-0" aria-hidden />
          View site
        </Link>
      </div>
    </aside>
  );
}

// Phone and tablet navigation: the busiest sections, plus "More" for the
// full drawer.
const TAB_HREFS = ["/admin", "/admin/reports", "/admin/listings", "/admin/users"];

function AdminTabBar({ sections, onMore }: { sections: AdminSection[]; onMore: () => void }) {
  const pathname = usePathname();
  const tabs = TAB_HREFS.flatMap((href) => sections.filter((section) => section.href === href));
  const tabClass = "relative flex h-full flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium";
  // "More" lights up on sections that don't have their own tab.
  const onOther = !tabs.some(({ href }) => isActive(pathname, href));
  const otherWaiting = sections.some((section) => section.count && !TAB_HREFS.includes(section.href));

  return (
    <nav
      aria-label="Admin"
      className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 backdrop-blur lg:hidden dark:border-zinc-800 dark:bg-zinc-900/95"
    >
      <ul className="mx-auto grid h-16 max-w-xl grid-cols-5">
        {tabs.map(({ href, label, count }) => {
          const Icon = ICONS[href] ?? LayoutDashboard;
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`${tabClass} ${active ? "text-brand dark:text-lime" : "text-zinc-500 dark:text-zinc-400"}`}
              >
                <span className="relative">
                  <Icon className="size-[1.375rem]" strokeWidth={active ? 2.4 : 2} aria-hidden />
                  {count ? (
                    <span className="absolute -top-1.5 -right-2.5 grid min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[0.625rem] font-bold leading-4 text-white">
                      {count > 99 ? "99+" : count}
                    </span>
                  ) : null}
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
            aria-label="More admin sections"
            className={`${tabClass} w-full ${onOther ? "text-brand dark:text-lime" : "text-zinc-500 dark:text-zinc-400"}`}
          >
            <span className="relative">
              <Menu className="size-[1.375rem]" aria-hidden />
              {otherWaiting && <span className="absolute -top-0.5 -right-1 size-2.5 rounded-full bg-red-500" aria-hidden />}
            </span>
            More
          </button>
        </li>
      </ul>
    </nav>
  );
}

// Searches listings by make/model or users by name/phone, using the filters
// those pages already have.
function AdminSearch({
  className = "",
  autoFocus = false,
  onDone,
}: {
  className?: string;
  autoFocus?: boolean;
  // Called after a search, or on Escape (closes the phone search row).
  onDone?: () => void;
}) {
  const router = useRouter();
  const [scope, setScope] = useState<"listings" | "users">("listings");
  const [q, setQ] = useState("");

  return (
    <form
      role="search"
      className={`flex h-9 w-full max-w-md items-center gap-2 rounded-md border border-zinc-300 bg-white px-2 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20 dark:border-zinc-700 dark:bg-zinc-900 ${className}`}
      onSubmit={(event) => {
        event.preventDefault();
        const query = q.trim();
        router.push(query ? `/admin/${scope}?q=${encodeURIComponent(query)}` : `/admin/${scope}`);
        onDone?.();
      }}
    >
      <Search className="size-4 shrink-0 text-zinc-500" aria-hidden />
      <input
        value={q}
        onChange={(event) => setQ(event.target.value)}
        placeholder={scope === "listings" ? "Search listings by make or model" : "Search users by name or phone"}
        aria-label="Search"
        autoFocus={autoFocus}
        onKeyDown={(event) => {
          if (event.key === "Escape") onDone?.();
        }}
        className="min-w-0 flex-1 bg-transparent text-sm outline-none"
      />
      <select
        value={scope}
        onChange={(event) => setScope(event.target.value as "listings" | "users")}
        aria-label="Search in"
        className="rounded border-0 bg-transparent text-sm text-zinc-600 outline-none dark:text-zinc-400"
      >
        <option value="listings">Listings</option>
        <option value="users">Users</option>
      </select>
    </form>
  );
}

function NotificationsMenu({ items }: { items: AdminSection[] }) {
  const router = useRouter();
  const waiting = items.filter((item) => item.count);
  const total = waiting.reduce((sum, item) => sum + (item.count ?? 0), 0);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={total ? `${total} items need attention` : "Nothing needs attention"}
        className="relative rounded-md p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        <Bell className="size-5" />
        {total > 0 && (
          <span className="absolute top-0.5 right-0.5 grid min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[0.625rem] font-bold leading-4 text-white">
            {total > 99 ? "99+" : total}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Needs attention</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {waiting.length === 0 ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">You&apos;re all caught up.</p>
        ) : (
          waiting.map((item) => (
            <DropdownMenuItem key={item.href} onSelect={() => router.push(item.href)} className="justify-between">
              {item.label}
              <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-800">{item.count}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// The signed-in admin, with their account links and sign out.
function AdminUserMenu({ user }: { user: AdminUser }) {
  const links = [
    {
      href: `/admin/users/${user.id}`,
      label: "My admin profile",
      hint: "Your record and moderation history",
      icon: UserRound,
    },
    { href: "/account", label: "Account settings", hint: "Name, phone and city", icon: Settings },
    ...(user.isSeller
      ? [{ href: "/dashboard", label: "My listings", hint: "Cars you're selling", icon: Car }]
      : []),
    { href: "/", label: "View site", hint: "DriveLoop as buyers see it", icon: ExternalLink },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className="group flex items-center gap-2.5 rounded-full py-1 pr-3 pl-1 ring-1 ring-transparent transition-colors hover:bg-zinc-100 hover:ring-line aria-expanded:bg-zinc-100 aria-expanded:ring-line dark:hover:bg-zinc-800 dark:hover:ring-zinc-700 dark:aria-expanded:bg-zinc-800"
      >
        <span className="relative">
          <Avatar name={user.name} />
          <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full bg-green-500 ring-2 ring-white dark:ring-zinc-900" aria-hidden />
        </span>
        <span className="hidden max-w-40 text-left sm:block">
          <span className="block truncate text-sm font-semibold leading-tight">{user.name}</span>
          <span className="block text-xs text-zinc-500">Administrator</span>
        </span>
        <ChevronDown
          className="hidden size-4 text-zinc-500 transition-transform group-aria-expanded:rotate-180 sm:block"
          aria-hidden
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-80 overflow-hidden rounded-xl p-0 shadow-xl ring-1 ring-black/5"
      >
        <div className="relative bg-gradient-to-br from-forest via-forest to-brand px-4 pt-4 pb-5 text-white">
          <div className="flex items-center gap-3">
            <span className="rounded-full ring-2 ring-white/30">
              <Avatar name={user.name} size="lg" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold">{user.name}</p>
              {user.email && <p className="truncate text-sm text-white/70">{user.email}</p>}
              <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-lime/15 px-2 py-0.5 text-xs font-medium text-lime ring-1 ring-lime/30">
                <ShieldCheck className="size-3" aria-hidden />
                Administrator
              </span>
            </div>
          </div>
        </div>

        <div className="p-1.5">
          {links.map(({ href, label, hint, icon: Icon }) => (
            <DropdownMenuItem key={href} asChild className="gap-3 rounded-lg px-2 py-2">
              <Link href={href}>
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-canvas text-forest ring-1 ring-line group-focus/dropdown-menu-item:bg-mint group-focus/dropdown-menu-item:text-brand">
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{label}</span>
                  <span className="block truncate text-xs text-muted-foreground">{hint}</span>
                </span>
              </Link>
            </DropdownMenuItem>
          ))}
        </div>

        <DropdownMenuSeparator className="mx-0 my-0" />
        <div className="bg-canvas/70 p-1.5">
          <form action="/auth/signout" method="post" className="contents">
            <input type="hidden" name="next" value="/admin/login" />
            <DropdownMenuItem asChild variant="destructive" className="gap-3 rounded-lg px-2 py-2">
              <button type="submit" className="w-full">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white ring-1 ring-red-100">
                  <LogOut className="size-4" aria-hidden />
                </span>
                <span className="text-sm font-medium">Sign out</span>
              </button>
            </DropdownMenuItem>
          </form>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AdminShell({
  sections,
  attention,
  user,
  children,
}: {
  sections: AdminSection[];
  attention: AdminSection[];
  user: AdminUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

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
  const current = [...sections].reverse().find(({ href }) => isActive(pathname, href));

  return (
    <div className="flex min-h-svh flex-1 bg-canvas dark:bg-zinc-950">
      <Sidebar sections={sections} open={menuOpen} onClose={() => setMenuOpen(false)} />
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMenuOpen(false)} aria-hidden />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="pt-safe sticky top-0 z-20 border-b border-line bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <header className="flex h-16 items-center gap-2 px-3 sm:gap-3 sm:px-6">
            <AdminSearch className="max-sm:hidden" />
            <Link href="/admin" className="pl-1 font-semibold sm:hidden">
              DriveLoop <span className="text-brand dark:text-lime">Admin</span>
            </Link>
            <div className="ml-auto flex items-center gap-1 sm:gap-3">
              <button
                type="button"
                onClick={() => setSearchOpen((open) => !open)}
                aria-label={searchOpen ? "Close search" : "Search"}
                aria-expanded={searchOpen}
                className="rounded-md p-2 text-zinc-600 hover:bg-zinc-100 sm:hidden dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                {searchOpen ? <X className="size-5" /> : <Search className="size-5" />}
              </button>
              <NotificationsMenu items={attention} />
              <span className="h-6 w-px bg-line max-sm:hidden dark:bg-zinc-800" aria-hidden />
              <AdminUserMenu user={user} />
            </div>
          </header>
          {searchOpen && (
            <div className="border-t border-line px-3 py-2 sm:hidden dark:border-zinc-800">
              <AdminSearch autoFocus onDone={() => setSearchOpen(false)} className="max-w-none" />
            </div>
          )}
        </div>

        <main className="flex flex-col gap-6 px-4 py-5 sm:px-6 sm:py-6 max-lg:pb-[calc(5.25rem+env(safe-area-inset-bottom))]">
          {/* The overview renders its own header with the range controls;
              nested pages (a user's details) get a way back instead. */}
          {current && current.href !== "/admin" && (
            <div>
              <p className="flex items-center gap-1.5 text-sm text-zinc-500">
                <Link href="/admin" className="hover:text-zinc-900 dark:hover:text-zinc-100">
                  Admin
                </Link>
                <ChevronRight className="size-3.5" aria-hidden />
                {pathname === current.href ? (
                  <span className="text-zinc-900 dark:text-zinc-100">{current.label}</span>
                ) : (
                  <Link href={current.href} className="hover:text-zinc-900 dark:hover:text-zinc-100">
                    {current.label}
                  </Link>
                )}
              </p>
              {pathname === current.href && (
                <>
                  <h1 className="mt-1 text-2xl font-bold tracking-tight">{current.label}</h1>
                  {current.description && (
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{current.description}</p>
                  )}
                </>
              )}
            </div>
          )}
          <div>{children}</div>
        </main>
      </div>
      <AdminTabBar sections={sections} onMore={() => setMenuOpen(true)} />
    </div>
  );
}
