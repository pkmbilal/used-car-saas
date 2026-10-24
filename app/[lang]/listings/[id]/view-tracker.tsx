"use client";

import { useEffect } from "react";
import { recordView } from "./actions";

// Counts one view per listing per browser session. Runs after mount so
// prefetches and crawlers without JS aren't counted.
export function ViewTracker({ listingId }: { listingId: string }) {
  useEffect(() => {
    const key = `viewed:${listingId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Storage unavailable (private mode, blocked): count anyway.
    }
    recordView(listingId).catch(() => {});
  }, [listingId]);

  return null;
}
