import "server-only";
import { createClient } from "@/lib/supabase/server";

// Responsive seller badge, from how fast sellers answer offers and rental
// requests. The window and which requests count live in the
// seller_responsiveness migration; the badge thresholds live here.

export const RESPONSE_MIN_REQUESTS = 3;
export const RESPONSE_MIN_ANSWERED = 0.8;
export const RESPONSE_MAX_MEDIAN_MINUTES = 12 * 60;

export type ResponseStats = { total: number; answered: number; medianMinutes: number | null };

// "hour": within an hour, "hours": within a few hours, "day": within a day.
export type ResponseBucket = "hour" | "hours" | "day";

export type Responsiveness = {
  badge: boolean;
  bucket: ResponseBucket | null;
  answeredPct: number;
  // Requests counted in the window.
  total: number;
};

export async function getResponseStats(sellerIds: string[]): Promise<Map<string, ResponseStats>> {
  const stats = new Map<string, ResponseStats>();
  const ids = [...new Set(sellerIds)];
  if (ids.length === 0) return stats;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("seller_response_stats", { p_seller_ids: ids });
  if (error) {
    console.error("seller_response_stats failed", error.message);
    return stats;
  }
  for (const row of data ?? []) {
    stats.set(row.seller_id, {
      total: row.total,
      answered: row.answered,
      medianMinutes: row.median_minutes,
    });
  }
  return stats;
}

export async function getSellerResponsiveness(sellerId: string): Promise<Responsiveness> {
  const stats = await getResponseStats([sellerId]);
  return responsiveness(stats.get(sellerId));
}

export function responsiveness(stats: ResponseStats | undefined): Responsiveness {
  if (!stats || stats.total === 0) return { badge: false, bucket: null, answeredPct: 0, total: 0 };

  const answeredPct = Math.round((stats.answered / stats.total) * 100);
  const median = stats.medianMinutes;
  const bucket: ResponseBucket | null =
    median === null ? null : median <= 60 ? "hour" : median <= 6 * 60 ? "hours" : median <= 24 * 60 ? "day" : null;
  const badge =
    stats.total >= RESPONSE_MIN_REQUESTS &&
    stats.answered / stats.total >= RESPONSE_MIN_ANSWERED &&
    median !== null &&
    median <= RESPONSE_MAX_MEDIAN_MINUTES;

  return { badge, bucket, answeredPct, total: stats.total };
}
