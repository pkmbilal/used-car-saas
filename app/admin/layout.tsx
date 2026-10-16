import type { Metadata } from "next";
import { getPendingCounts } from "@/lib/admin";
import { requireAdmin } from "@/lib/auth";
import { AdminShell, type AdminSection } from "./admin-shell";

export const metadata: Metadata = {
  title: "Admin | DriveLoop",
  robots: { index: false },
};

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const { profile } = await requireAdmin();
  const pending = await getPendingCounts();

  // Sections with work waiting show how much.
  const sections: AdminSection[] = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/reports", label: "Reports", count: pending.reports },
    { href: "/admin/listings", label: "Listings" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/verifications", label: "Verifications", count: pending.verifications },
    { href: "/admin/dealers", label: "Dealers", count: pending.dealers },
    { href: "/admin/plans", label: "Plans" },
    { href: "/admin/activity", label: "Activity" },
  ];
  const attention: AdminSection[] = [
    { href: "/admin/reports", label: "Open reports", count: pending.reports },
    { href: "/admin/verifications", label: "ID verifications", count: pending.verifications },
    { href: "/admin/dealers", label: "Dealer applications", count: pending.dealers },
  ];

  return (
    <AdminShell sections={sections} attention={attention} adminName={profile.full_name ?? "Admin"}>
      {children}
    </AdminShell>
  );
}
