import type { Metadata } from "next";
import { DealerCard } from "@/components/dealer-card";
import { getDealerStorefronts } from "@/lib/storefront";

export const metadata: Metadata = {
  title: "Car dealers | DriveLoop",
  description: "Browse car dealers on DriveLoop and see their showrooms and cars for sale.",
};

export default async function DealersPage() {
  const dealers = await getDealerStorefronts();

  return (
    <main className="light bg-canvas text-ink">
      <section className="relative overflow-hidden bg-charcoal">
        <div className="absolute inset-y-0 right-0 w-2/3 bg-[radial-gradient(ellipse_at_70%_60%,rgba(111,224,124,.16),transparent_60%)]" />
        <div className="relative mx-auto w-full max-w-6xl px-4 pt-10 pb-14 sm:px-6">
          <p className="text-[0.65625rem] font-bold tracking-[0.24em] text-[#5fd06e]">DEALERS</p>
          <h1 className="mt-2.5 max-w-md text-3xl leading-tight font-medium tracking-tight text-white md:text-4xl">
            Buy From <span className="text-lime">Trusted Dealers</span>
          </h1>
          <p className="mt-3.5 max-w-sm text-[0.78125rem] leading-relaxed text-white/85">
            Browse dealer showrooms and see every car they have for sale.
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <p className="mb-4 text-[0.8125rem] font-semibold">
          {dealers.length} {dealers.length === 1 ? "Dealer" : "Dealers"}
        </p>
        {dealers.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">No dealers yet.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {dealers.map((dealer) => (
              <li key={dealer.id}>
                <DealerCard dealer={dealer} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
