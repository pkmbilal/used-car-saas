import { getListingsForExport, isDashboardRange } from "@/lib/admin";
import { getCurrentUser } from "@/lib/auth";
import { toCsv } from "@/lib/csv";
import { PLAN_LABELS } from "@/lib/plans";

// CSV of the listings added in the dashboard's date range.
export async function GET(request: Request) {
  const current = await getCurrentUser();
  if (!current?.profile.is_admin) return new Response("Not found", { status: 404 });

  const range = Number(new URL(request.url).searchParams.get("range"));
  const days = isDashboardRange(range) ? range : 30;
  const listings = await getListingsForExport(days);

  const csv = toCsv([
    ["Listed", "Year", "Make", "Model", "Mileage (km)", "Price (SAR)", "City", "Fuel", "Status", "Featured until", "Seller", "Seller plan", "Views", "Calls", "WhatsApps", "Listing ID"],
    ...listings.map((listing) => {
      const stats = listing.listing_view_counts ?? { views: 0, calls: 0, whatsapps: 0 };
      return [
        listing.created_at,
        listing.year,
        listing.make,
        listing.model,
        listing.mileage,
        listing.price,
        listing.city,
        listing.fuel_type,
        listing.status,
        listing.featured_until ?? "",
        listing.seller?.full_name ?? "",
        listing.seller ? PLAN_LABELS[listing.seller.plan] : "",
        stats.views,
        stats.calls,
        stats.whatsapps,
        listing.id,
      ];
    }),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="karsouq-listings-${days}d-${today}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
