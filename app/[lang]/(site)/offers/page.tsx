import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n-server";
import { noIndex } from "@/lib/seo";
import { OffersView } from "./offers-view";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.offers.metaTitle, robots: noIndex };
}

export default async function OffersPage({ searchParams }: PageProps<"/[lang]/offers">) {
  const { user } = await requireUser("/offers");
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:py-12">
      <OffersView userId={user.id} tabParam={(await searchParams).tab} basePath="/offers" />
    </main>
  );
}
