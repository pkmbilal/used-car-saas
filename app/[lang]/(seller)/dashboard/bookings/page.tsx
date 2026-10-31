import type { Metadata } from "next";
import { BookingsView } from "@/app/[lang]/(site)/bookings/bookings-view";
import { requireSeller } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n-server";
import { noIndex } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.rentals.inboxMetaTitle, robots: noIndex };
}

// Date requests on the seller's rental cars.
export default async function SellerBookingsPage() {
  const { user } = await requireSeller("/dashboard/bookings");
  return (
    <div className="mx-auto w-full max-w-5xl">
      <BookingsView userId={user.id} side="owner" />
    </div>
  );
}
