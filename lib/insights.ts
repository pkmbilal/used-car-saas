import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isFeatured, type ListingStats, type ListingWithImages } from "@/lib/listings";
import type { ListingQuota } from "@/lib/plans";

// Seller insights for Pro and Showroom (listing_daily_stats migration). The
// RPCs cap the range by plan and return nothing when it isn't included.

export type SellerListing = ListingWithImages & { stats: ListingStats };

export type InsightsTotals = {
  views: number;
  calls: number;
  whatsapps: number;
  contacts: number;
  saves: number;
  offers: number;
};

export type InsightsDay = InsightsTotals & { day: string };

export type ListingInsight = {
  listing: SellerListing;
  views: number;
  calls: number;
  whatsapps: number;
  contacts: number;
  saves: number;
  contactRate: number | null; // contacts / views; null without views
  daysLive: number | null; // since first published; null if never published
};

export type SellerInsights = {
  days: number;
  current: InsightsTotals;
  previous: InsightsTotals;
  daily: InsightsDay[]; // current period, oldest first
  listings: ListingInsight[]; // published at least once
};

// The day the listing_daily_stats migration went live; earlier days read as
// zero, so the page says so when the range reaches back past it.
export const INSIGHTS_TRACKING_SINCE = "2026-10-28";

const DAY_MS = 24 * 60 * 60 * 1000;

function sum(rows: InsightsDay[]): InsightsTotals {
  const totals = { views: 0, calls: 0, whatsapps: 0, contacts: 0, saves: 0, offers: 0 };
  for (const row of rows) {
    totals.views += row.views;
    totals.calls += row.calls;
    totals.whatsapps += row.whatsapps;
    totals.contacts += row.contacts;
    totals.saves += row.saves;
    totals.offers += row.offers;
  }
  return totals;
}

export function contactRate(contacts: number, views: number): number | null {
  return views > 0 ? contacts / views : null;
}

// null when the plan doesn't include insights.
export async function getSellerInsights(
  listings: SellerListing[],
  days: number,
): Promise<SellerInsights | null> {
  const supabase = await createClient();
  const [{ data: daily, error }, { data: perListing }] = await Promise.all([
    supabase.rpc("seller_insights", { p_days: days }),
    supabase.rpc("seller_listing_insights", { p_days: days }),
  ]);
  if (error || !daily || daily.length === 0) return null;

  const rows = daily.map((row) => ({ ...row, contacts: row.calls + row.whatsapps }));
  // The RPC returns this period and the one before it.
  const n = Math.floor(rows.length / 2);
  const previous = rows.slice(0, rows.length - n);
  const current = rows.slice(rows.length - n);

  const byId = new Map((perListing ?? []).map((row) => [row.listing_id, row]));
  const now = Date.now();
  const insights = listings
    .filter((listing) => listing.first_published_at !== null)
    .map((listing): ListingInsight => {
      const row = byId.get(listing.id) ?? { views: 0, calls: 0, whatsapps: 0, saves: 0 };
      const contacts = row.calls + row.whatsapps;
      return {
        listing,
        views: row.views,
        calls: row.calls,
        whatsapps: row.whatsapps,
        contacts,
        saves: row.saves,
        contactRate: contactRate(contacts, row.views),
        daysLive: listing.first_published_at
          ? Math.max(0, Math.floor((now - new Date(listing.first_published_at).getTime()) / DAY_MS))
          : null,
      };
    });

  return { days: n, current: sum(current), previous: sum(previous), daily: current, listings: insights };
}

export const INSIGHT_SORTS = ["views", "contacts", "rate", "saves", "age"] as const;
export type InsightSort = (typeof INSIGHT_SORTS)[number];

export function isInsightSort(value: unknown): value is InsightSort {
  return INSIGHT_SORTS.some((sort) => sort === value);
}

// Highest first; "age" puts the longest-live listings first.
export function sortListingInsights(rows: ListingInsight[], sort: InsightSort): ListingInsight[] {
  const key: Record<InsightSort, (row: ListingInsight) => number> = {
    views: (row) => row.views,
    contacts: (row) => row.contacts,
    rate: (row) => row.contactRate ?? -1,
    saves: (row) => row.saves,
    age: (row) => row.daysLive ?? -1,
  };
  return [...rows].sort((a, b) => key[sort](b) - key[sort](a));
}

export type Breakdown = { key: string; listings: number; views: number; contacts: number }[];

// Totals grouped by make or city, most viewed first.
export function breakdownBy(rows: ListingInsight[], field: "make" | "city", limit = 8): Breakdown {
  const groups = new Map<string, Breakdown[number]>();
  for (const row of rows) {
    const key = row.listing[field];
    const group = groups.get(key) ?? { key, listings: 0, views: 0, contacts: 0 };
    group.listings += 1;
    group.views += row.views;
    group.contacts += row.contacts;
    groups.set(key, group);
  }
  return [...groups.values()].sort((a, b) => b.views - a.views || b.contacts - a.contacts).slice(0, limit);
}

// Things a seller can act on, most urgent first.
export type AttentionItem =
  | { kind: "pendingOffers"; count: number }
  | { kind: "featuredEnding"; listing: SellerListing; until: string }
  | { kind: "unusedFeatured"; count: number }
  | { kind: "noContacts"; listing: SellerListing; days: number }
  | { kind: "fewPhotos"; listing: SellerListing; photos: number };

// Below this many photos a live listing gets flagged; every plan allows it.
export const RECOMMENDED_PHOTOS = 5;
const STALE_DAYS = 30;
const FEATURED_ENDING_MS = 2 * DAY_MS;

export function buildAttentionItems(
  listings: SellerListing[],
  quota: Pick<ListingQuota, "featuredRemaining"> | null,
  pendingOffers: number,
  now = Date.now(),
): AttentionItem[] {
  const active = listings.filter((listing) => listing.status === "active");
  const items: AttentionItem[] = [];

  if (pendingOffers > 0) items.push({ kind: "pendingOffers", count: pendingOffers });

  for (const listing of active) {
    if (!listing.featured_until || !isFeatured(listing)) continue;
    if (new Date(listing.featured_until).getTime() - now < FEATURED_ENDING_MS) {
      items.push({ kind: "featuredEnding", listing, until: listing.featured_until });
    }
  }

  const featuredRemaining = quota?.featuredRemaining ?? 0;
  if (featuredRemaining > 0 && active.some((listing) => !isFeatured(listing))) {
    items.push({ kind: "unusedFeatured", count: featuredRemaining });
  }

  for (const listing of active) {
    if (!listing.first_published_at) continue;
    const days = Math.floor((now - new Date(listing.first_published_at).getTime()) / DAY_MS);
    if (days >= STALE_DAYS && listing.stats.calls + listing.stats.whatsapps === 0) {
      items.push({ kind: "noContacts", listing, days });
    }
  }

  for (const listing of active) {
    if (listing.images.length < RECOMMENDED_PHOTOS) {
      items.push({ kind: "fewPhotos", listing, photos: listing.images.length });
    }
  }

  return items;
}
