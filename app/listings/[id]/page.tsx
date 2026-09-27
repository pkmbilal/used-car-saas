import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getCurrentUser } from "@/lib/auth";
import { formatKm, formatMonthYear, formatSAR } from "@/lib/format";
import { capitalize } from "@/lib/listing-options";
import { getPublicListing } from "@/lib/listings";
import { Gallery } from "./gallery";

// Shared by generateMetadata and the page within one request.
const getListing = cache(getPublicListing);

export async function generateMetadata({
  params,
}: PageProps<"/listings/[id]">): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListing(id);
  if (!listing) return { title: "Listing not found" };
  return {
    title: `${listing.year} ${listing.make} ${listing.model} — ${formatSAR(listing.price)} | Used Car Marketplace`,
  };
}

export default async function ListingPage({ params }: PageProps<"/listings/[id]">) {
  const { id } = await params;
  const [listing, current] = await Promise.all([getListing(id), getCurrentUser()]);
  if (!listing) notFound();

  const title = `${listing.year} ${listing.make} ${listing.model}`;
  const isOwner = current?.user.id === listing.seller_id;
  const seller = listing.seller;

  const specs: [string, string][] = [
    ["Make", listing.make],
    ["Model", listing.model],
    ["Year", String(listing.year)],
    ["Mileage", formatKm(listing.mileage)],
    ["Condition", capitalize(listing.condition)],
    ["Fuel type", capitalize(listing.fuel_type)],
    ["City", listing.city],
    ["Listed", formatMonthYear(listing.created_at)],
  ];

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12">
      {isOwner && listing.status !== "active" && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          <span>
            This listing is {listing.status === "draft" ? "a draft" : "marked as sold"} and is
            not visible to buyers.
          </span>
          <Link href={`/dashboard/listings/${listing.id}/edit`} className="font-medium underline">
            Edit listing
          </Link>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[3fr_2fr]">
        <Gallery title={title} photos={listing.images.map(({ id, url }) => ({ id, url }))} />

        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-2 text-2xl font-semibold">{formatSAR(listing.price)}</p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {formatKm(listing.mileage)} · {listing.city}
            </p>
          </div>

          {seller && (
            <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <p className="font-medium">{seller.full_name ?? "Seller"}</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {seller.city ? `${seller.city} · ` : ""}Member since{" "}
                {formatMonthYear(seller.created_at)}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                {seller.phone && (
                  <a
                    href={`tel:${seller.phone}`}
                    className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
                  >
                    Call seller
                  </a>
                )}
                <Link href={`/sellers/${seller.id}`} className="text-sm font-medium">
                  View seller&apos;s listings
                </Link>
              </div>
            </div>
          )}

          <table className="w-full text-sm">
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {specs.map(([label, value]) => (
                <tr key={label}>
                  <th scope="row" className="py-2 text-left font-normal text-zinc-600 dark:text-zinc-400">
                    {label}
                  </th>
                  <td className="py-2 text-right font-medium">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
