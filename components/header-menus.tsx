"use client";

import Link from "next/link";
import { ChevronDown, Menu } from "lucide-react";
import { BrandLink } from "@/components/brand";
import { limeButton, outlineButton } from "@/components/header-styles";
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

export type HeaderLink = { href: string; label: string };


function SignOutForm({ children }: { children: React.ReactNode }) {
  return (
    <form action="/auth/signout" method="post" className="contents">
      {children}
    </form>
  );
}

// Signed-in account links behind the user's name.
export function UserMenu({ name, links }: { name: string; links: HeaderLink[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 max-w-48 gap-1.5 px-3 text-[13px] text-white hover:bg-white/10 hover:text-white aria-expanded:bg-white/10 aria-expanded:text-white">
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
              Sign out
            </button>
          </DropdownMenuItem>
        </SignOutForm>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Slide-over navigation for small screens.
export function MobileNav({
  mainLinks,
  accountLinks,
  signedIn,
}: {
  mainLinks: HeaderLink[];
  accountLinks: HeaderLink[];
  signedIn: boolean;
}) {
  const linkClass = "rounded-md px-3 py-2.5 text-sm font-medium text-white hover:bg-white/10 hover:text-lime";

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Menu" className="size-10 border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white md:hidden">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="light w-72 border-white/10 bg-charcoal text-white [&>[data-slot=sheet-close]]:text-white">
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <div className="p-4">
          <BrandLink />
        </div>
        <nav className="flex flex-col gap-1 px-2">
          {[...mainLinks, ...accountLinks].map((link) => (
            <SheetClose key={link.href} asChild>
              <Link href={link.href} className={linkClass}>
                {link.label}
              </Link>
            </SheetClose>
          ))}
        </nav>
        <Separator className="bg-white/10" />
        <div className="flex gap-3 px-4">
          {signedIn ? (
            <SignOutForm>
              <Button type="submit" variant="outline" className={outlineButton}>
                Sign out
              </Button>
            </SignOutForm>
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
      </SheetContent>
    </Sheet>
  );
}
