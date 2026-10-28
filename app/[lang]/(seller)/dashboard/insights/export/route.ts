import { requireSeller } from "@/lib/auth";
import { carName } from "@/lib/car-names";
import { cityName } from "@/lib/dictionary";
import { getDictionary } from "@/lib/i18n-server";
import { getSellerInsights, sortListingInsights } from "@/lib/insights";
import { getSellerListings } from "@/lib/listings";
import { hasInsightsReport, INSIGHTS_DAYS } from "@/lib/plans";

// Showroom's per-listing report for the chosen range, as CSV. Starts with a
// BOM so Excel reads the Arabic text as UTF-8.
export async function GET(request: Request) {
  const { user, profile } = await requireSeller("/dashboard/insights");
  if (!hasInsightsReport(profile.plan)) return new Response("Not found", { status: 404 });

  const { t, locale } = await getDictionary();
  const ranges = INSIGHTS_DAYS[profile.plan];
  const asked = Number(new URL(request.url).searchParams.get("range"));
  const range = ranges.includes(asked) ? asked : ranges[ranges.length - 1];

  const insights = await getSellerInsights(await getSellerListings(user.id), range);
  if (!insights) return new Response("Not found", { status: 404 });

  const c = t.insights.csv;
  const rows: (string | number)[][] = [
    [c.listing, c.year, c.city, c.status, c.views, c.calls, c.whatsapps, c.rate, c.saves, c.daysLive],
    ...sortListingInsights(insights.listings, "views").map(({ listing, ...row }) => [
      carName(locale, listing.make, listing.model),
      listing.year,
      cityName(t, listing.city),
      t.dashboard.status[listing.status],
      row.views,
      row.calls,
      row.whatsapps,
      row.contactRate === null ? "" : `${(row.contactRate * 100).toFixed(1)}%`,
      row.saves,
      row.daysLive ?? "",
    ]),
  ];
  const body = "﻿" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  const today = new Date().toISOString().slice(0, 10);

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="karsouq-insights-${range}d-${today}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}

// Quotes every text cell and defuses spreadsheet formulas (=, +, -, @).
function csvCell(value: string | number): string {
  if (typeof value === "number") return String(value);
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}
