"use client";

import Link, { useLocale } from "@/components/locale-link";
import {
  Bell,
  Car,
  ChevronDown,
  Heart,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { Avatar } from "@/components/avatar";
import { BrandLink } from "@/components/brand";
import { limeButton, outlineButton } from "@/components/header-styles";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useDictionary } from "@/components/i18n-provider";
import type { Profile } from "@/lib/auth";
import { dir } from "@/lib/i18n";

export type HeaderLink = {
  href: string;
  label: string;
  hint?: string;
  icon?: "listings" | "saved" | "searches" | "admin" | "account";
};


function SignOutForm({ children }: { children: React.ReactNode }) {
  // Back to this language's home page after signing out.
  const next = `/${useLocale()}`;
  return (
    <form action="/auth/signout" method="post" className="contents">
      <input type="hidden" name="next" value={next} />
      {children}
    </form>
  );
}

export type HeaderUser = {
  name: string;
  avatarUrl: string | null;
  email: string | null;
  role: Profile["role"];
  plan: Profile["plan"];
  isAdmin: boolean;
};

// Icons are picked here: components can't be passed from the server header.
const LINK_ICONS: Record<NonNullable<HeaderLink["icon"]>, LucideIcon> = {
  listings: Car,
  saved: Heart,
  searches: Bell,
  admin: ShieldCheck,
  account: Settings,
};

function useRoleLabel(user: HeaderUser) {
  const { t } = useDictionary();
  return user.role === "seller" ? `${t.nav.roles.seller} · ${t.plans.labels[user.plan]}` : t.nav.roles.buyer;
}

// Name, email and role badges on the brand gradient, atop both account menus.
function UserCard({ user }: { user: HeaderUser }) {
  const { t } = useDictionary();
  const roleLabel = useRoleLabel(user);
  const badgeClass = "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1";

  return (
    <div className="bg-gradient-to-br from-forest via-forest to-brand px-4 pt-4 pb-5 text-white">
      <div className="flex items-center gap-3">
        <span className="rounded-full ring-2 ring-white/30">
          <Avatar name={user.name} src={user.avatarUrl} size="lg" />
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold">{user.name}</p>
          {user.email && <p className="truncate text-sm text-white/70">{user.email}</p>}
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <span className={`${badgeClass} bg-white/10 text-white ring-white/20`}>
              <UserRound className="size-3" aria-hidden />
              {roleLabel}
            </span>
            {user.isAdmin && (
              <span className={`${badgeClass} bg-lime/15 text-lime ring-lime/30`}>
                <ShieldCheck className="size-3" aria-hidden />
                {t.nav.administrator}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// The signed-in user, with their account links and sign out.
export function UserMenu({ user, links }: { user: HeaderUser; links: HeaderLink[] }) {
  const { t } = useDictionary();
  const roleLabel = useRoleLabel(user);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t.nav.accountMenu}
        className="group flex items-center gap-2.5 rounded-full py-1 ps-1 pe-3 ring-1 ring-transparent transition-colors outline-none hover:bg-white/10 hover:ring-white/15 focus-visible:ring-lime aria-expanded:bg-white/10 aria-expanded:ring-white/15"
      >
        <span className="relative">
          <Avatar name={user.name} src={user.avatarUrl} />
          <span className="absolute -end-0.5 -bottom-0.5 size-3 rounded-full bg-green-500 ring-2 ring-charcoal" aria-hidden />
        </span>
        <span className="hidden max-w-36 text-start lg:block">
          <span className="block truncate text-sm font-semibold leading-tight text-white">{user.name}</span>
          <span className="block truncate text-xs text-white/60">
            {user.isAdmin ? t.nav.administrator : roleLabel}
          </span>
        </span>
        <ChevronDown
          className="size-4 text-white/60 transition-transform group-aria-expanded:rotate-180"
          aria-hidden
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="light w-80 overflow-hidden rounded-xl p-0 shadow-xl ring-1 ring-black/5"
      >
        <UserCard user={user} />

        <div className="p-1.5">
          {links.map(({ href, label, hint, icon }) => {
            const Icon = icon ? LINK_ICONS[icon] : UserRound;
            return (
              <DropdownMenuItem key={href} asChild className="gap-3 rounded-lg px-2 py-2">
                <Link href={href}>
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-canvas text-forest ring-1 ring-line group-focus/dropdown-menu-item:bg-mint group-focus/dropdown-menu-item:text-brand">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{label}</span>
                    {hint && <span className="block truncate text-xs text-muted-foreground">{hint}</span>}
                  </span>
                </Link>
              </DropdownMenuItem>
            );
          })}
        </div>

        <DropdownMenuSeparator className="mx-0 my-0" />
        <div className="bg-canvas/70 p-1.5">
          <SignOutForm>
            <DropdownMenuItem asChild variant="destructive" className="gap-3 rounded-lg px-2 py-2">
              <button type="submit" className="w-full">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white ring-1 ring-red-100">
                  <LogOut className="size-4" aria-hidden />
                </span>
                <span className="text-sm font-medium">{t.nav.signOut}</span>
              </button>
            </DropdownMenuItem>
          </SignOutForm>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Slide-over navigation for small screens.
export function MobileNav({ links, signedIn }: { links: HeaderLink[]; signedIn: boolean }) {
  const linkClass = "rounded-md px-3 py-3 text-base font-medium text-white hover:bg-white/10 hover:text-lime";
  // The menu slides in from the end side: right in English, left in Arabic.
  const { t, locale } = useDictionary();
  const side = dir(locale) === "rtl" ? "left" : "right";

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" aria-label={t.nav.menu} className="size-9 border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white md:hidden">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side={side} className="light pt-safe pb-safe w-72 border-white/10 bg-charcoal text-white [&>[data-slot=sheet-close]]:text-white">
        <SheetTitle className="sr-only">{t.nav.menu}</SheetTitle>
        <div className="p-4">
          <BrandLink />
        </div>
        <nav className="flex flex-col gap-1 px-2">
          {links.map((link) => (
            <SheetClose key={link.href} asChild>
              <Link href={link.href} className={linkClass}>
                {link.label}
              </Link>
            </SheetClose>
          ))}
          <LanguageSwitcher className={linkClass} />
        </nav>
        <Separator className="bg-white/10" />
        <div className="flex gap-3 px-4">
          {signedIn ? (
            <SignOutForm>
              <Button type="submit" variant="outline" className={outlineButton}>
                {t.nav.signOut}
              </Button>
            </SignOutForm>
          ) : (
            <Button asChild className={`${limeButton} flex-1`}>
              <Link href="/login">{t.nav.signIn}</Link>
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// The bottom tab bar's account tab: the user's avatar, opening their menu as a bottom sheet.
export function MobileAccountSheet({
  user,
  links,
  active,
}: {
  user: HeaderUser;
  links: HeaderLink[];
  active: boolean;
}) {
  const { t } = useDictionary();
  const firstName = user.name.split(/\s+/)[0] || t.nav.tabs.account;
  const rowClass = "flex items-center gap-3 rounded-lg px-2 py-2 text-start active:bg-canvas";

  return (
    <Sheet>
      <SheetTrigger
        aria-label={t.nav.accountMenu}
        className={`flex h-full w-full flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium transition-colors ${
          active ? "text-brand" : "text-zinc-500 active:text-ink"
        }`}
      >
        <span className={`relative rounded-full ring-2 ${active ? "ring-brand" : "ring-transparent"}`}>
          <Avatar name={user.name} src={user.avatarUrl} size="sm" />
          <span className="absolute -end-0.5 -bottom-0.5 size-2 rounded-full bg-green-500 ring-2 ring-white" aria-hidden />
        </span>
        <span className="max-w-16 truncate">{firstName}</span>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="light pb-safe max-h-[85vh] gap-0 overflow-y-auto rounded-t-2xl border-0 p-0 [&>[data-slot=sheet-close]]:text-white"
      >
        <SheetTitle className="sr-only">{t.nav.accountMenu}</SheetTitle>
        <UserCard user={user} />

        <nav className="p-1.5">
          {links.map(({ href, label, hint, icon }) => {
            const Icon = icon ? LINK_ICONS[icon] : UserRound;
            return (
              <SheetClose key={href} asChild>
                <Link href={href} className={rowClass}>
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-canvas text-forest ring-1 ring-line">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{label}</span>
                    {hint && <span className="block truncate text-xs text-muted-foreground">{hint}</span>}
                  </span>
                </Link>
              </SheetClose>
            );
          })}
        </nav>

        <Separator />
        <div className="bg-canvas/70 p-1.5">
          <SignOutForm>
            <button type="submit" className={`${rowClass} w-full text-red-600`}>
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white ring-1 ring-red-100">
                <LogOut className="size-4" aria-hidden />
              </span>
              <span className="text-sm font-medium">{t.nav.signOut}</span>
            </button>
          </SignOutForm>
        </div>
      </SheetContent>
    </Sheet>
  );
}
