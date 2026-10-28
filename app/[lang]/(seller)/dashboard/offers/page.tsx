import type { Metadata } from "next";
import { OffersView } from "@/app/[lang]/(site)/offers/offers-view";
import { requireSeller } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n-server";
import { noIndex } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.offers.metaTitle, robots: noIndex };
}

// The shell shows the heading; OffersView brings the stats, tabs and offers.
export default async function SellerOffersPage({ searchParams }: PageProps<"/[lang]/dashboard/offers">) {
  const { user } = await requireSeller("/dashboard/offers");
  return (
    <div className="mx-auto w-full max-w-5xl">
      <OffersView userId={user.id} tabParam={(await searchParams).tab} basePath="/dashboard/offers" />
    </div>
  );
}
