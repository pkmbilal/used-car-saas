"use client";

import Link, { useLocale } from "@/components/locale-link";
import { ChevronDown, Menu } from "lucide-react";
import { BrandLink } from "@/components/brand";
import { limeButton, outlineButton } from "@/components/header-styles";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useDictionary } from "@/components/i18n-provider";
import { dir } from "@/lib/i18n";

export type HeaderLink = { href: string; label: string };


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

// Signed-in account links behind the user's name.
export function UserMenu({ name, links }: { name: string; links: HeaderLink[] }) {
  const { t } = useDictionary();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 max-w-48 gap-1.5 rounded-full px-3 text-label text-white hover:bg-white/10 hover:text-white aria-expanded:bg-white/10 aria-expanded:text-white">
          <span className="truncate">{name}</span>
          <ChevronDown className="size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="light w-48">
        <DropdownMenuLabel className="truncate">{name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {links.map((link) => (
          <DropdownMenuItem key={link.href} asChild>
            <Link href={link.href}>{link.label}</Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <SignOutForm>
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full">
              {t.nav.signOut}
            </button>
          </DropdownMenuItem>
        </SignOutForm>
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
