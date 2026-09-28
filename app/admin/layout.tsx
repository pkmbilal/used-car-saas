import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Admin | Used Car Marketplace",
  robots: { index: false },
};

const sections = [
  { href: "/admin", label: "Reports" },
  { href: "/admin/listings", label: "Listings" },
  { href: "/admin/users", label: "Users" },
];

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <nav className="flex gap-5 text-sm">
          {sections.map(({ href, label }) => (
            <Link key={href} href={href} className="font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mt-8">{children}</div>
    </main>
  );
}
