import type { Metadata } from "next";
import { SellerShell, type SellerAlert, type SellerSection } from "@/components/seller/seller-shell";
import type { HeaderLink, HeaderUser } from "@/components/header-menus";
import { getMyPendingAddons } from "@/lib/addons";
import { getCurrentUser } from "@/lib/auth";
import { count, fmt } from "@/lib/dictionary";
import { formatDay } from "@/lib/format";
import { getDictionary } from "@/lib/i18n-server";
import { countOffersAwaitingMe } from "@/lib/offers";
import { getListingQuota, hasInsights, isDealerPlan, isPlanExpiringSoon } from "@/lib/plans";
import { publicUrl } from "@/lib/r2";
import { noIndex } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.sellerCenter.metaTitle, robots: noIndex };
}

export default async function SellerCenterLayout({ children }: LayoutProps<"/[lang]/dashboard">) {
  // Each page calls requireSeller with its own path, so sign-in returns there.
  const current = await getCurrentUser();
  if (current?.profile.role !== "seller") return children;
  const { user, profile } = current;
  const { t, locale } = await getDictionary();
  const s = t.sellerCenter;
  const [offersWaiting, pendingAddons, quota] = await Promise.all([
    countOffersAwaitingMe(user.id),
    getMyPendingAddons(),
    getListingQuota(),
  ]);
  const dealer = isDealerPlan(profile.plan);

  // Locked sections stay in the menu and open their upgrade teaser.
  const sections: SellerSection[] = [
    { href: "/dashboard", label: s.sections.overview },
    { href: "/dashboard/listings", label: s.sections.listings },
    { href: "/dashboard/insights", label: s.sections.insights, locked: !hasInsights(profile.plan) },
    // Offers renders its own heading.
    { href: "/dashboard/offers", label: s.sections.offers, count: offersWaiting },
    { href: "/dashboard/listings/import", label: s.sections.import, locked: !dealer },
    { href: "/dashboard/storefront", label: s.sections.storefront, locked: !dealer },
    { href: "/dashboard/plan", label: s.sections.plan, description: s.descriptions.plan },
  ];

  const alerts: SellerAlert[] = [];
  if (offersWaiting) {
    alerts.push({ href: "/dashboard/offers", label: count(locale, offersWaiting, s.notifications.offers) });
  }
  if (pendingAddons.length) {
    alerts.push({ href: "/dashboard/plan", label: count(locale, pendingAddons.length, s.notifications.addons) });
  }
  if (quota?.planExpiresAt && isPlanExpiringSoon(quota)) {
    alerts.push({
      href: "/dashboard/plan",
      label: fmt(s.notifications.planEnding, { date: formatDay(quota.planExpiresAt, locale) }),
    });
  }

  const shellUser: HeaderUser = {
    name: profile.business_name || profile.full_name || user.email || t.nav.account,
    avatarUrl: profile.avatar_key ? publicUrl(profile.avatar_key) : null,
    email: user.email ?? null,
    role: profile.role,
    plan: profile.plan,
    isAdmin: profile.is_admin,
  };
  const accountLinks: HeaderLink[] = [
    { href: "/offers", label: t.nav.offers, hint: t.nav.hints.offers, icon: "offers" },
    { href: "/favorites", label: t.nav.savedCars, hint: t.nav.hints.savedCars, icon: "saved" },
    { href: "/saved-searches", label: t.nav.savedSearches, hint: t.nav.hints.savedSearches, icon: "searches" },
    ...(profile.is_admin
      ? [{ href: "/admin", label: t.nav.admin, hint: t.nav.hints.admin, icon: "admin" as const }]
      : []),
    { href: "/account", label: t.nav.account, hint: t.nav.hints.account, icon: "account" },
  ];

  return (
    <SellerShell sections={sections} alerts={alerts} user={shellUser} accountLinks={accountLinks}>
      {children}
    </SellerShell>
  );
}
