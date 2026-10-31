import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n-server";
import { noIndex } from "@/lib/seo";
import { BookingsView } from "./bookings-view";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.rentals.myMetaTitle, robots: noIndex };
}

// The renter's date requests.
export default async function BookingsPage() {
  const { user } = await requireUser("/bookings");
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:py-12">
      <BookingsView userId={user.id} side="renter" />
    </main>
  );
}
