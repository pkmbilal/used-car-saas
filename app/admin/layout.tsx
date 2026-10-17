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
    {
      href: "/admin/reports",
      label: "Reports",
      count: pending.reports,
      description: "Listings buyers have flagged. Remove the listing or dismiss the reports.",
    },
    { href: "/admin/listings", label: "Listings", description: "Every listing on DriveLoop, in any status." },
    {
      href: "/admin/users",
      label: "Users",
      description: "Buyers and sellers. Open someone to manage their plan or account.",
    },
    {
      href: "/admin/verifications",
      label: "Verifications",
      count: pending.verifications,
      description: "ID checks waiting for a decision.",
    },
    {
      href: "/admin/dealers",
      label: "Dealers",
      count: pending.dealers,
      description: "Businesses applying for a dealer plan.",
    },
    { href: "/admin/plans", label: "Plans", description: "Plan changes, renewals, payments and featured placements." },
    { href: "/admin/activity", label: "Activity", description: "Every moderation decision, newest first." },
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
