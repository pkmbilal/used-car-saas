"use client";

import Link from "@/components/locale-link";
import { usePathname } from "next/navigation";
import { stripLocale } from "@/lib/i18n";

// Header link that highlights itself on its own section of the site.
export function NavLink({
  href,
  exact = false,
  children,
}: {
  href: string;
  exact?: boolean;
  children: React.ReactNode;
}) {
  const pathname = stripLocale(usePathname());
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`relative whitespace-nowrap rounded-full px-3 py-1.5 transition-colors lg:px-3.5 ${
        active ? "bg-white/10 text-white ring-1 ring-white/10" : "text-white/70 hover:bg-white/[0.06] hover:text-white"
      }`}
    >
      {children}
      {active && (
        <span aria-hidden className="absolute bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-lime" />
      )}
    </Link>
  );
}
