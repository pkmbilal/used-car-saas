"use client";

import { usePathname } from "next/navigation";

// The admin panel is full screen, so the site header and footer step aside
// there. The children stay server-rendered on every other page.
export function HideOnAdmin({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return null;
  return children;
}
