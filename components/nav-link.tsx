"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`relative py-2 hover:text-accent ${active ? "text-accent" : ""}`}
    >
      {children}
      {active && (
        <span className="absolute inset-x-0.5 -bottom-1 h-0.5 rounded-full bg-accent max-md:hidden" />
      )}
    </Link>
  );
}
