import type { Metadata } from "next";
import Link from "next/link";
import { getPendingCounts } from "@/lib/admin";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Admin | DriveLoop",
  robots: { index: false },
};

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();
  const pending = await getPendingCounts();

  // Sections with work waiting show how much.
  const sections = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/reports", label: "Reports", count: pending.reports },
    { href: "/admin/listings", label: "Listings" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/verifications", label: "Verifications", count: pending.verifications },
    { href: "/admin/dealers", label: "Dealers", count: pending.dealers },
    { href: "/admin/plans", label: "Plans" },
    { href: "/admin/activity", label: "Activity" },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <nav className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
          {sections.map(({ href, label, count }) => (
            <Link key={href} href={href} className="font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
              {label}
              {count ? (
                <span className="ml-1 rounded-full bg-red-100 px-1.5 py-0.5 text-xs text-red-800 dark:bg-red-950 dark:text-red-300">
                  {count}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mt-8">{children}</div>
    </main>
  );
}
