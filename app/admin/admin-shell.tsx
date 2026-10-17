"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BadgeCheck,
  Bell,
  Car,
  ChevronRight,
  CreditCard,
  Flag,
  History,
  LayoutDashboard,
  Menu,
  Search,
  Store,
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
  adminName,
  open,
  onClose,
}: {
  sections: AdminSection[];
  adminName: string;
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col bg-forest text-white transition-transform lg:sticky lg:top-0 lg:z-auto lg:h-svh lg:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
        <div>
          <p className="text-lg font-semibold leading-none">DriveLoop</p>
          <p className="mt-1.5 text-eyebrow font-semibold tracking-[0.16em] text-lime">ADMIN</p>
        </div>
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
      <div className="flex items-center gap-3 border-t border-white/10 px-5 py-4">
        <span className="grid size-9 place-items-center rounded-full bg-white/15 text-sm font-semibold">
          {adminName.slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{adminName}</p>
          <p className="text-caption text-white/60">Administrator</p>
        </div>
      </div>
    </aside>
  );
}

// Searches listings by make/model or users by name/phone, using the filters
// those pages already have.
function AdminSearch() {
  const router = useRouter();
  const [scope, setScope] = useState<"listings" | "users">("listings");
  const [q, setQ] = useState("");

  return (
    <form
      role="search"
      className="flex h-9 w-full max-w-md items-center gap-2 rounded-md border border-zinc-300 bg-white px-2 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20 dark:border-zinc-700 dark:bg-zinc-900"
      onSubmit={(event) => {
        event.preventDefault();
        const query = q.trim();
        router.push(query ? `/admin/${scope}?q=${encodeURIComponent(query)}` : `/admin/${scope}`);
      }}
    >
      <Search className="size-4 shrink-0 text-zinc-500" aria-hidden />
      <input
        value={q}
        onChange={(event) => setQ(event.target.value)}
        placeholder={scope === "listings" ? "Search listings by make or model" : "Search users by name or phone"}
        aria-label="Search"
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

export function AdminShell({
  sections,
  attention,
  adminName,
  children,
}: {
  sections: AdminSection[];
  attention: AdminSection[];
  adminName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const current = [...sections].reverse().find(({ href }) => isActive(pathname, href));

  return (
    <div className="flex flex-1 bg-canvas dark:bg-zinc-950">
      <Sidebar sections={sections} adminName={adminName} open={menuOpen} onClose={() => setMenuOpen(false)} />
      {menuOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setMenuOpen(false)} aria-hidden />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-white px-4 sm:px-6 dark:border-zinc-800 dark:bg-zinc-900">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open admin menu"
            className="rounded-md p-2 text-zinc-600 hover:bg-zinc-100 lg:hidden dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Menu className="size-5" />
          </button>
          <AdminSearch />
          <div className="ml-auto">
            <NotificationsMenu items={attention} />
          </div>
        </header>

        <main className="flex flex-col gap-6 px-4 py-6 sm:px-6">
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
    </div>
  );
}
